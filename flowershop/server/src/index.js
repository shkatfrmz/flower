import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/store.js';
import sellerRoutes from './routes/seller.js';
import buyerRoutes from './routes/buyer.js';
import adminRoutes from './routes/admin.js';
import projectRoutes from './routes/project.js';
import { populateProjectMemory } from './services/memory.js';
import { UPLOAD_PATH } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

fs.mkdirSync(UPLOAD_PATH, { recursive: true });
app.use('/uploads', express.static(UPLOAD_PATH));

const SEED_PALETTES = [
  '#f62d5a', '#ff8fa3', '#9b5de5', '#f9a03f', '#7bd389', '#ffd166',
  '#06d6a0', '#9ef01a', '#c77dff', '#ff9770', '#0598d4', '#f72585',
];

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

app.get('/img/:key', (req, res) => {
  const key = String(req.params.key || 'flower').replace(/[^a-z0-9-]/gi, '');
  const h = hashCode(key);
  const bg = SEED_PALETTES[h % SEED_PALETTES.length];
  const petals = (h % 5) + 4;
  const w = 600, hh = 480;
  let circles = '';
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    const cx = w / 2 + Math.cos(a) * 90 + (i % 3) * 6;
    const cy = hh / 2 + Math.sin(a) * 90 + (i % 2) * -5;
    circles += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="55" fill="${bg}" opacity="0.85"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="${bg}99"/>
  </linearGradient></defs>
  <rect width="${w}" height="${hh}" fill="url(#g)"/>
  ${circles}
  <circle cx="${w / 2}" cy="${hh / 2 - 20}" r="26" fill="#ffd166"/>
</svg>`;
  res.type('image/svg+xml').set('Cache-Control', 'public, max-age=86400').send(svg);
});

app.use('/api/auth', authRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/orders', buyerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/project', projectRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error('[error]', err.stack || err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`PetalBloom API running on http://localhost:${PORT}`);
  // Build the project knowledge graph once on startup so agents can query it.
  populateProjectMemory()
    .then((s) => console.log(`[knowledge] indexed ${s.files} files, ${s.nodes} nodes, ${s.edges} edges`))
    .catch((e) => console.error('[knowledge] index failed:', e.message));
});