import { Router } from 'express';
import { db, parseProduct, parseProducts } from '../db.js';

const router = Router();

router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json({ categories: rows });
});

router.get('/products', (req, res) => {
  const { category, search, sort, min, max } = req.query;
  const where = ["p.status = 'approved'"];
  const params = [];
  if (category && category !== 'all') {
    where.push('p.category_id = ?');
    params.push(category);
  }
  if (search) {
    where.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (min) { where.push('p.price >= ?'); params.push(Number(min)); }
  if (max) { where.push('p.price <= ?'); params.push(Number(max)); }

  const orderBy = {
    newest: 'p.created_at DESC',
    price_low: 'p.price ASC',
    price_high: 'p.price DESC',
    name: 'p.name ASC',
  }[sort] || 'p.created_at DESC';

  const sql = `
    SELECT p.*, c.name AS category_name, u.username AS seller_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u ON u.id = p.seller_id
    WHERE ${where.join(' AND ')}
    ORDER BY ${orderBy}
  `;
  const rows = db.prepare(sql).all(...params);
  res.json({ products: parseProducts(rows) });
});

router.get('/products/:id', (req, res) => {
  const row = db.prepare(`
    SELECT p.*, c.name AS category_name, u.username AS seller_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u ON u.id = p.seller_id
    WHERE p.id = ? AND p.status = 'approved'
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  res.json({ product: parseProduct(row) });
});

export default router;