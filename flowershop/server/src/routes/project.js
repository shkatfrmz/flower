import { Router } from 'express';
import {
  getProjectGraph,
  searchKnowledge,
  getContextBrief,
  populateProjectMemory,
} from '../services/memory.js';

const router = Router();

// Full dependency + domain graph (optionally filtered by area=client|server)
router.get('/graph', (req, res) => {
  const area = ['client', 'server'].includes(req.query.area) ? req.query.area : undefined;
  res.json(getProjectGraph({ area }));
});

// Retrieval over files, symbols and stored memories
router.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  const topK = Math.min(Number(req.query.k) || 10, 50);
  if (!q) return res.status(400).json({ error: 'Query param q is required' });
  res.json({ query: q, results: searchKnowledge(q, topK) });
});

// Compact text brief an AI agent can read to become aware of the project
router.get('/context', (_req, res) => {
  res.json(getContextBrief());
});

// Rebuild the graph from the current source tree
router.post('/reindex', async (_req, res, next) => {
  try {
    const stats = await populateProjectMemory();
    res.json({ status: 'ok', ...stats });
  } catch (err) { next(err); }
});

export default router;
