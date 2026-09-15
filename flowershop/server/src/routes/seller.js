import { Router } from 'express';
import { db, parseProduct, parseProducts } from '../db.js';
import { requireAuth, requireRole, upload } from '../middleware.js';

const router = Router();

router.use(requireAuth, requireRole('seller', 'admin'));

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

router.get('/products', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, c.name AS category_name FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.seller_id = ? ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json({ products: parseProducts(rows) });
});

router.post('/products', (req, res) => {
  const { name, description, price, stock, category_id, images } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Product name is required' });
  if (price === undefined || isNaN(Number(price)) || Number(price) <= 0) return res.status(400).json({ error: 'Valid price is required' });
  const info = db.prepare(`
    INSERT INTO products (seller_id, category_id, name, description, price, stock, images, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    req.user.id,
    category_id || null,
    String(name).trim(),
    String(description || '').trim(),
    Number(price),
    Math.max(0, Number(stock) || 0),
    JSON.stringify(Array.isArray(images) && images.length ? images : [])
  );
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ product: parseProduct(row), message: 'Product submitted for admin approval' });
});

router.put('/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.seller_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not your product' });
  const { name, description, price, stock, category_id, images } = req.body || {};
  const data = {
    name: name !== undefined ? String(name).trim() : product.name,
    description: description !== undefined ? String(description).trim() : product.description,
    price: price !== undefined ? Number(price) : product.price,
    stock: stock !== undefined ? Math.max(0, Number(stock)) : product.stock,
    category_id: category_id !== undefined ? category_id : product.category_id,
    images: images !== undefined ? JSON.stringify(images) : product.images,
  };
  if (!data.name) return res.status(400).json({ error: 'Product name is required' });
  if (isNaN(data.price) || data.price <= 0) return res.status(400).json({ error: 'Valid price is required' });
  db.prepare(`
    UPDATE products SET name=?, description=?, price=?, stock=?, category_id=?, images=?
    WHERE id=?
  `).run(data.name, data.description, data.price, data.stock, data.category_id, data.images, product.id);
  res.json({ message: 'Product updated' });
});

router.delete('/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.seller_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not your product' });
  db.prepare('DELETE FROM products WHERE id = ?').run(product.id);
  res.json({ message: 'Product deleted' });
});

router.get('/orders', (req, res) => {
  const rows = db.prepare(`
    SELECT oi.*, o.customer_name, o.customer_email, o.customer_phone, o.address, o.note,
           o.status AS order_status, o.created_at AS order_date, o.id AS order_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.seller_id = ?
    ORDER BY o.created_at DESC
  `).all(req.user.id);
  res.json({ items: rows });
});

function orderStats(userId) {
  return {
    products: db.prepare('SELECT COUNT(*) c FROM products WHERE seller_id=?').get(userId).c,
    pending: db.prepare("SELECT COUNT(*) c FROM products WHERE seller_id=? AND status='pending'").get(userId).c,
    orders: db.prepare('SELECT COUNT(DISTINCT order_id) c FROM order_items WHERE seller_id=?').get(userId).c,
    revenue: db.prepare('SELECT COALESCE(SUM(quantity*price),0) s FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.seller_id=? AND o.status<>?').get(userId, 'cancelled').s,
  };
}

router.get('/stats', (req, res) => {
  res.json(orderStats(req.user.id));
});

export default router;