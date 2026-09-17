import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// services -> src -> server -> <project root>
const DEFAULT_ROOT = path.resolve(__dirname, '..', '..', '..');

// ---------------------------------------------------------------------------
// Persistent knowledge store (SQLite). Provides an "AI awareness" layer:
// a codebase dependency graph, a searchable symbol/file index, and a small
// semantic memory table the app can write to (products, notes, decisions).
// ---------------------------------------------------------------------------

db.exec(`
CREATE TABLE IF NOT EXISTS kn_nodes (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL,        -- file | symbol | domain
  label      TEXT NOT NULL,
  area       TEXT NOT NULL,        -- client | server | domain
  meta       TEXT DEFAULT '{}',
  tokens     TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS kn_edges (
  source   TEXT NOT NULL,
  target   TEXT NOT NULL,
  relation TEXT NOT NULL,          -- imports | exports | belongs
  PRIMARY KEY (source, target, relation)
);
CREATE TABLE IF NOT EXISTS memories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  content    TEXT NOT NULL,
  meta       TEXT DEFAULT '{}',
  tokens     TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

// ---------------------------------------------------------------------------
// Memory API (kept stable so existing routes keep working)
// ---------------------------------------------------------------------------

export async function addMemory(content, metadata = {}) {
  const tokens = tokenize(content + ' ' + JSON.stringify(metadata)).join(' ');
  db.prepare('INSERT INTO memories (content, meta, tokens) VALUES (?, ?, ?)')
    .run(String(content), JSON.stringify(metadata), tokens);
}

export async function queryMemory(query, topK = 5) {
  return scoreMemories(query, topK);
}

export async function queryAllMemories() {
  return scoreMemories('', 1000);
}

function scoreMemories(query, topK) {
  const qTokens = new Set(tokenize(query));
  const rows = db.prepare('SELECT * FROM memories').all();
  const scored = rows.map((r) => {
    const t = new Set(r.tokens.split(' '));
    let score = 0;
    for (const qt of qTokens) if (t.has(qt)) score += 1;
    if (query === '') score = 1; // empty query returns everything
    return { id: r.id, content: r.content, metadata: safeParse(r.meta), score };
  });
  return scored.filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, topK);
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}

// ---------------------------------------------------------------------------
// Static analysis: build the project graph from real imports + exports
// ---------------------------------------------------------------------------

const EXT = ['.js', '.jsx', '.ts', '.tsx', '.mjs'];

function walk(dir, acc) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (EXT.includes(path.extname(e.name))) acc.push(full);
  }
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null; // external package
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [base, ...EXT.map((x) => base + x)];
  for (const dir of EXT) { /* noop */ }
  candidates.push(path.join(base, 'index.js'), path.join(base, 'index.jsx'));
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return toPosix(path.relative(PROJECT_ROOT, c));
  }
  return null;
}

function extractImports(content) {
  const specs = new Set();
  const importRe = /(?:^|\n)\s*import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const dynRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  const reqRe = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = importRe.exec(content))) specs.add(m[1]);
  while ((m = dynRe.exec(content))) specs.add(m[1]);
  while ((m = reqRe.exec(content))) specs.add(m[1]);
  return [...specs];
}

function extractExports(content) {
  const names = new Set();
  const fn = /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g;
  const constRe = /export\s+(?:const|let|var)\s+([A-Za-z0-9_]+)/g;
  const listRe = /export\s*\{([^}]+)\}/g;
  let m;
  while ((m = fn.exec(content))) names.add(m[1]);
  while ((m = constRe.exec(content))) names.add(m[1]);
  while ((m = listRe.exec(content))) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      if (name) names.add(name);
    }
  }
  if (/export\s+default/.test(content)) names.add('default');
  return [...names];
}

let PROJECT_ROOT = DEFAULT_ROOT;

export async function populateProjectMemory(rootDir) {
  PROJECT_ROOT = rootDir ? path.resolve(rootDir) : DEFAULT_ROOT;
  const serverRoot = path.resolve(PROJECT_ROOT, 'server', 'src');
  const clientRoot = path.resolve(PROJECT_ROOT, 'client', 'src');

  const files = [];
  walk(serverRoot, files);
  walk(clientRoot, files);

  db.exec('DELETE FROM kn_nodes; DELETE FROM kn_edges;');

  const insertNode = db.prepare('INSERT OR IGNORE INTO kn_nodes (id,type,label,area,meta,tokens) VALUES (?,?,?,?,?,?)');
  const insertEdge = db.prepare('INSERT OR IGNORE INTO kn_edges (source,target,relation) VALUES (?,?,?)');
  const fileContents = new Map();

  for (const file of files) {
    const id = toPosix(path.relative(PROJECT_ROOT, file));
    const area = id.startsWith('server/') ? 'server' : 'client';
    const content = fs.readFileSync(file, 'utf8');
    fileContents.set(id, content);
    const label = path.basename(id);
    insertNode.run(id, 'file', label, area, JSON.stringify({ path: id, loc: content.split('\n').length }), tokenize(label).join(' '));

    for (const spec of extractImports(content)) {
      const target = resolveImport(file, spec);
      if (target) insertEdge.run(id, target, 'imports');
    }
    for (const sym of extractExports(content)) {
      const sid = `${id}#${sym}`;
      insertNode.run(sid, 'symbol', sym, area, JSON.stringify({ file: id }), tokenize(sym).join(' '));
      insertEdge.run(sid, id, 'exports');
    }
  }

  // Domain cluster: read live DB counts and expose as nodes
  const domain = domainSnapshot();
  for (const d of domain) {
    insertNode.run(`domain:${d.key}`, 'domain', d.label, 'domain', JSON.stringify({ count: d.count }), tokenize(d.label).join(' '));
    insertEdge.run('domain:app', `domain:${d.key}`, 'belongs');
  }
  insertNode.run('domain:app', 'domain', 'PetalBloom', 'domain', '{}', 'petalbloom app');

  return { files: files.length, nodes: db.prepare('SELECT COUNT(*) c FROM kn_nodes').get().c, edges: db.prepare('SELECT COUNT(*) c FROM kn_edges').get().c };
}

function domainSnapshot() {
  const safe = (sql) => { try { return db.prepare(sql).get().c; } catch { return 0; } };
  return [
    { key: 'products', label: 'Products', count: safe('SELECT COUNT(*) c FROM products') },
    { key: 'categories', label: 'Categories', count: safe('SELECT COUNT(*) c FROM categories') },
    { key: 'orders', label: 'Orders', count: safe('SELECT COUNT(*) c FROM orders') },
    { key: 'users', label: 'Users', count: safe('SELECT COUNT(*) c FROM users') },
    { key: 'sellers', label: 'Sellers', count: safe("SELECT COUNT(*) c FROM users WHERE role='seller'") },
  ];
}

// ---------------------------------------------------------------------------
// Graph + retrieval used by the API and the frontend visualization
// ---------------------------------------------------------------------------

export function getProjectGraph({ area } = {}) {
  let nodes;
  if (area) {
    nodes = db.prepare('SELECT id,type,label,area,meta FROM kn_nodes WHERE area=?').all(area);
  } else {
    nodes = db.prepare("SELECT id,type,label,area,meta FROM kn_nodes WHERE type IN ('file','domain')").all();
  }
  const ids = new Set(nodes.map((n) => n.id));
  let edges = db.prepare('SELECT source,target,relation FROM kn_edges').all()
    .filter((e) => ids.has(e.source) && ids.has(e.target));
  if (area) {
    edges = db.prepare('SELECT source,target,relation FROM kn_edges').all()
      .filter((e) => ids.has(e.source) && ids.has(e.target));
  }
  return {
    nodes: nodes.map((n) => ({ ...n, meta: safeParse(n.meta) })),
    edges,
  };
}

export function searchKnowledge(query, topK = 10) {
  const qTokens = new Set(tokenize(query));
  const nodeRows = db.prepare('SELECT id,type,label,area,meta FROM kn_nodes').all();
  const scored = [];
  for (const r of nodeRows) {
    const t = new Set(tokenize(r.label).concat(tokenize(r.id)).concat(tokenize(JSON.stringify(safeParse(r.meta)))));
    let score = 0;
    for (const qt of qTokens) if (t.has(qt)) score += 2;
    if (score > 0) scored.push({ kind: 'node', id: r.id, type: r.type, label: r.label, area: r.area, meta: safeParse(r.meta), score });
  }
  for (const m of scoreMemories(query, 50)) {
    scored.push({ kind: 'memory', id: `memory:${m.id}`, type: 'memory', label: m.content.slice(0, 80), area: 'domain', meta: m.metadata, score: m.score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

// A compact, LLM-readable brief so an agent can "become aware" of the project.
export function getContextBrief() {
  const byArea = (area) =>
    db.prepare("SELECT id,meta FROM kn_nodes WHERE area=? AND type='file'").all(area)
      .map((r) => ({ path: r.id, loc: safeParse(r.meta).loc }));
  const clientFiles = byArea('client');
  const serverFiles = byArea('server');
  const symbols = db.prepare("SELECT label FROM kn_nodes WHERE type='symbol'").all().length;
  const domain = domainSnapshot();
  const recent = db.prepare('SELECT content,meta,created_at FROM memories ORDER BY id DESC LIMIT 12').all();
  const briefText = [
    `PetalBloom project context brief`,
    `Client: ${clientFiles.length} files (${clientFiles.reduce((a, f) => a + (f.loc || 0), 0)} LOC).`,
    `Server: ${serverFiles.length} files (${serverFiles.reduce((a, f) => a + (f.loc || 0), 0)} LOC).`,
    `Exported symbols indexed: ${symbols}.`,
    `Domain counts: ${domain.map((d) => `${d.label}=${d.count}`).join(', ')}.`,
    `Key server files: ${serverFiles.map((f) => f.path).join(', ')}.`,
    `Recent memories:`,
    ...recent.map((m) => `  - ${m.content}`),
  ].join('\n');
  return { clientFiles, serverFiles, symbols, domain, recent, briefText };
}
