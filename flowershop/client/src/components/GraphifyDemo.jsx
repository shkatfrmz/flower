import { useEffect, useRef, useState } from 'react';
import api from '../api.js';

const COLORS = { client: '#f9b8cc', server: '#849850', domain: '#b84e59' };
const W = 940;
const H = 580;

// Self-contained, dependency-free project knowledge graph.
// Fetches the dependency/domain graph from the backend and renders an
// interactive force-directed SVG that an AI agent (or you) can navigate.
export default function ProjectGraph() {
  const [area, setArea] = useState('all');
  const [raw, setRaw] = useState({ nodes: [], edges: [] });
  const [positions, setPositions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [brief, setBrief] = useState('');
  const [status, setStatus] = useState('loading graph…');

  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  const rafRef = useRef(0);

  useEffect(() => {
    let on = true;
    setStatus('loading graph…');
    api.get('/project/graph', { params: area === 'all' ? {} : { area } })
      .then((r) => { if (on) { setRaw(r.data); setStatus(`${r.data.nodes.length} nodes · ${r.data.edges.length} edges`); } })
      .catch(() => on && setStatus('failed to load graph (is the API running?)'));
    return () => { on = false; };
  }, [area]);

  useEffect(() => {
    const list = raw.nodes;
    const nodes = list.map((n, i) => {
      const a = (i / Math.max(list.length, 1)) * Math.PI * 2;
      return { ...n, x: W / 2 + Math.cos(a) * 220, y: H / 2 + Math.sin(a) * 180, vx: 0, vy: 0 };
    });
    const idset = new Set(nodes.map((n) => n.id));
    const edges = raw.edges.filter((e) => idset.has(e.source) && idset.has(e.target));
    nodesRef.current = nodes;
    edgesRef.current = edges;

    let alpha = 1;
    cancelAnimationFrame(rafRef.current);
    const tick = () => {
      alpha *= 0.985;
      const N = nodesRef.current;
      for (let i = 0; i < N.length; i++) {
        for (let j = i + 1; j < N.length; j++) {
          const A = N[i], B = N[j];
          let dx = B.x - A.x, dy = B.y - A.y;
          let d2 = dx * dx + dy * dy || 0.01;
          const rep = 4200 / d2;
          const d = Math.sqrt(d2);
          const fx = (dx / d) * rep, fy = (dy / d) * rep;
          A.vx -= fx; A.vy -= fy; B.vx += fx; B.vy += fy;
        }
      }
      const map = new Map(N.map((n) => [n.id, n]));
      for (const e of edgesRef.current) {
        const A = map.get(e.source), B = map.get(e.target);
        if (!A || !B) continue;
        const dx = B.x - A.x, dy = B.y - A.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = (d - 96) * 0.02;
        const fx = (dx / d) * force, fy = (dy / d) * force;
        A.vx += fx; A.vy += fy; B.vx -= fx; B.vy -= fy;
      }
      for (const n of N) {
        n.vx += (W / 2 - n.x) * 0.008;
        n.vy += (H / 2 - n.y) * 0.008;
        n.vx *= 0.85; n.vy *= 0.85;
        n.x = Math.max(28, Math.min(W - 28, n.x + n.vx * alpha));
        n.y = Math.max(28, Math.min(H - 28, n.y + n.vy * alpha));
      }
      setPositions(N.map((n) => ({ id: n.id, x: n.x, y: n.y, area: n.area, label: n.label, type: n.type })));
      if (alpha > 0.02) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [raw]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      api.get('/project/search', { params: { q: q.trim(), k: 8 } })
        .then((r) => setResults(r.data.results))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const neighbors = new Set();
  if (selected) {
    for (const e of edgesRef.current) {
      if (e.source === selected) neighbors.add(e.target);
      if (e.target === selected) neighbors.add(e.source);
    }
  }
  const posById = new Map(positions.map((p) => [p.id, p]));

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Project Knowledge Graph</h1>
        <p style={styles.sub}>Live dependency map + searchable codebase memory. {status}</p>
      </div>

      <div style={styles.layout}>
        <div style={styles.toolbar}>
          <div style={styles.group}>
            {['all', 'client', 'server'].map((a) => (
              <button key={a} onClick={() => setArea(a)}
                style={{ ...styles.chip, ...(area === a ? styles.chipActive : {}) }}>{a}</button>
            ))}
          </div>
          <input style={styles.input} placeholder="Search files, symbols, memories…"
            value={q} onChange={(e) => setQ(e.target.value)} />
          <button style={styles.btn} onClick={() => {
            api.post('/project/reindex').then(() => api.get('/project/context')).then((r) => setBrief(r.data.briefText));
          }}>Reindex + brief</button>
        </div>

        <div style={styles.body}>
          <div style={styles.canvasWrap}>
            <svg viewBox={`0 0 ${W} ${H}`} style={styles.svg}>
              {edgesRef.current.map((e, i) => {
                const a = posById.get(e.source), b = posById.get(e.target);
                if (!a || !b) return null;
                const hot = selected && (e.source === selected || e.target === selected);
                return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={hot ? '#b84e59' : '#d9c3cb'} strokeWidth={hot ? 1.8 : 0.8} />;
              })}
              {positions.map((p) => {
                const isSel = p.id === selected;
                const near = neighbors.has(p.id);
                const r = p.type === 'domain' ? 12 : p.type === 'file' ? 7 : 4;
                const dim = selected && !isSel && !near;
                return (
                  <g key={p.id} style={{ cursor: 'pointer', opacity: dim ? 0.25 : 1 }}
                    onClick={() => setSelected(isSel ? null : p.id)}>
                    <circle cx={p.x} cy={p.y} r={r} fill={COLORS[p.area] || '#999'}
                      stroke={isSel ? '#9f3f4b' : '#fff'} strokeWidth={isSel ? 2.5 : 1} />
                    {(p.type !== 'symbol' || isSel || near) && (
                      <text x={p.x + r + 2} y={p.y + 3} fontSize={p.type === 'symbol' ? 8 : 10} fill="#5a3b40">
                        {p.label.length > 26 ? p.label.slice(0, 24) + '…' : p.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <div style={styles.legend}>
              <span><i style={{ background: COLORS.client }} /> client</span>
              <span><i style={{ background: COLORS.server }} /> server</span>
              <span><i style={{ background: COLORS.domain }} /> domain</span>
            </div>
          </div>

          <aside style={styles.panel}>
            <h3 style={styles.panelTitle}>Search results</h3>
            {results.length === 0 && <p style={styles.muted}>Type to search the indexed codebase.</p>}
            <ul style={styles.results}>
              {results.map((r) => (
                <li key={r.id} style={styles.resultItem}
                  onClick={() => posById.has(r.id) && setSelected(r.id)}>
                  <span style={{ ...styles.badge, background: COLORS[r.area] || '#999' }}>{r.type}</span>
                  <span style={styles.resultLabel} title={r.id}>{r.label}</span>
                </li>
              ))}
            </ul>
            {brief && (
              <>
                <h3 style={styles.panelTitle}>Agent context brief</h3>
                <pre style={styles.brief}>{brief}</pre>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '24px 16px' },
  header: { marginBottom: 12 },
  title: { fontFamily: '"Cormorant Garamond", serif', fontSize: 30, margin: 0, color: '#9f3f4b' },
  sub: { color: '#7a6b6f', marginTop: 4 },
  layout: { display: 'flex', flexDirection: 'column', gap: 12 },
  toolbar: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  group: { display: 'flex', gap: 6 },
  chip: { border: '1px solid #e4c9d2', background: '#fff', borderRadius: 999, padding: '6px 14px', cursor: 'pointer', textTransform: 'capitalize' },
  chipActive: { background: '#b84e59', color: '#fff', borderColor: '#b84e59' },
  input: { flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid #e4c9d2' },
  btn: { border: 'none', background: '#849850', color: '#fff', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' },
  body: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 },
  canvasWrap: { position: 'relative', background: '#fffdf8', border: '1px solid #f0dfe6', borderRadius: 12, overflow: 'hidden' },
  svg: { width: '100%', height: 580, display: 'block' },
  legend: { position: 'absolute', left: 12, bottom: 10, display: 'flex', gap: 14, fontSize: 12, color: '#5a3b40' },
  panel: { background: '#fffdf8', border: '1px solid #f0dfe6', borderRadius: 12, padding: 14, maxHeight: 580, overflowY: 'auto' },
  panelTitle: { fontFamily: '"Cormorant Garamond", serif', margin: '0 0 8px', color: '#9f3f4b' },
  muted: { color: '#a99', fontSize: 13 },
  results: { listStyle: 'none', padding: 0, margin: 0 },
  resultItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid #f6e7ec' },
  badge: { fontSize: 10, color: '#fff', borderRadius: 6, padding: '2px 6px', textTransform: 'uppercase' },
  resultLabel: { fontSize: 13, color: '#4a3a3d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  brief: { background: '#fff', border: '1px solid #f0dfe6', borderRadius: 8, padding: 10, fontSize: 11, whiteSpace: 'pre-wrap', color: '#4a3a3d', maxHeight: 320, overflow: 'auto' },
};
