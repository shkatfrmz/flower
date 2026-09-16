import { Memory } from 'mem0';
import path from 'node:path';
import fs from 'node:fs';

// SQLite backend stored in server data folder
const dbPath = path.resolve(process.cwd(), 'data', 'mem0.db');
const memory = new Memory({ dbPath });

/** Add a memory entry */
export async function addMemory(content, metadata = {}) {
  await memory.add({ content, metadata });
}

/** Search memories */
export async function queryAllMemories() {
  // Retrieve all stored memories (empty query returns everything)
  // mem0 search with empty string returns nearest matches; using a high k to get most entries
  const results = await memory.search({ query: '', k: 1000 });
  return results;
}

/** Helper to scan a directory for .js/.jsx files and store imports as memories */
export async function populateProjectMemory(rootDir) {
  const files = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) files.push(full);
    }
  }
  walk(rootDir);

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    // simple import regex – captures relative import paths
    const importRegex = /import\s+[^'\"]+['\"]([^'\"]+)['\"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const imported = match[1];
      await addMemory('', { source: path.relative(process.cwd(), filePath), target: imported });
    }
  }
}
