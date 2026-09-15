import { Router } from 'express';
import { db, parseProducts } from '../db.js';
import { requireAuth, requireRole } from '../middleware.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) c FROM users').get().c,
    sellers: db.prepare("SELECT COUNT(*) c FROM users WHERE role='seller'").get().c,
    products: db.prepare('SELECT COUNT(*) c FROM products').get().c,
    pendingProducts: db.prepare("SELECT COUNT(*) c FROM products WHERE status='pending'").get().c,
    approvedProducts: db.prepare("SELECT COUNT(*) c FROM products WHERE status='approved'").get().c,
    orders: db.prepare('SELECT COUNT(*) c FROM orders').get().c,
    revenue: db.prepare("SELECT COALESCE(SUM(total),0) s FROM orders WHERE status<>'cancelled'").get().s,
    categories: db.prepare('SELECT COUNT(*) c FROM categories').get().c,
  };
  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 8').all();
  res.json({ stats, recentOrders });
});

// ---------- Users ----------
router.get('/users', (req, res) => {
  const { search } = req.query;
  let rows;
  if (search) {
    rows = db.prepare("SELECT id, username, email, role, status, created_at FROM users WHERE username LIKE ? OR email LIKE ? ORDER BY created_at DESC")
      .all(`%${search}%`, `%${search}%`);
  } else {
    rows = db.prepare('SELECT id, username, email, role, status, created_at FROM users ORDER BY created_at DESC').all();
  }
  res.json({ users: rows });
});

router.put('/users/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.id === req.user.id) return res.status(400).json({ error: 'You cannot modify your own account here' });
  const { role, status } = req.body || {};
  if (role !== undefined) {
    if (!['seller', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    db.prepare('UPDATE users SET role=? WHERE id=?').run(role, user.id);
  }
  if (status !== undefined) {
    if (!['active', 'suspended'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    db.prepare('UPDATE users SET status=? WHERE id=?').run(status, user.id);
  }
  res.json({ message: 'User updated' });
});

router.delete('/users/:id', (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });
  db.prepare('DELETE FROM users WHERE id=?').run(user.id);
  res.json({ message: 'User deleted' });
});

// ---------- Products ----------
router.get('/products', (req, res) => {
  const { status, search } = req.query;
  const where = [];
  const params = [];
  if (status && status !== 'all') { where.push('p.status = ?'); params.push(status); }
  if (search) { where.push('(p.name LIKE ? OR u.username LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  const sql = `
    SELECT p.*, c.name AS category_name, u.username AS seller_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN users u ON u.id = p.seller_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY p.created_at DESC
  `;
  res.json({ products: parseProducts(db.prepare(sql).all(...params)) });
});

router.put('/products/:id/status', (req, res) => {
  const product = db.prepare('SELECT id FROM products WHERE id=?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const { status } = req.body || {};
  if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE products SET status=? WHERE id=?').run(status, product.id);
  res.json({ message: `Product ${status}` });
});

router.get('/categories', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, COUNT(p.id) AS product_count
    FROM categories c LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id ORDER BY c.name
  `).all();
  res.json({ categories: rows });
});

router.post('/categories', (req, res) => {
  const { name, description, image } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Category name is required' });
  try {
    const info = db.prepare('INSERT INTO categories (name, description, image) VALUES (?, ?, ?)')
      .run(String(name).trim(), String(description || '').trim(), image || '');
    res.status(201).json({ message: 'Category created', id: info.lastInsertRowid });
  } catch {
    return res.status(409).json({ error: 'Category name already exists' });
  }
});

router.put('/categories/:id', (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE id=?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const { name, description, image } = req.body || {};
  try {
    db.prepare('UPDATE categories SET name=?, description=?, image=? WHERE id=?').run(
      name !== undefined ? String(name).trim() : cat.name,
      description !== undefined ? String(description).trim() : cat.description,
      image !== undefined ? image : cat.image,
      cat.id
    );
    res.json({ message: 'Category updated' });
  } catch {
    return res.status(409).json({ error: 'Category name already exists' });
  }
});

router.delete('/categories/:id', (req, res) => {
  const cat = db.prepare('SELECT id FROM categories WHERE id=?').get(req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const linked = db.prepare('SELECT COUNT(*) c FROM products WHERE category_id=?').get(cat.id).c;
  if (linked > 0) return res.status(400).json({ error: `Cannot delete: ${linked} product(s) belong to this category` });
  db.prepare('DELETE FROM categories WHERE id=?').run(cat.id);
  res.json({ message: 'Category deleted' });
});

router.delete('/products/:id', (req, res) => {
  const product = db.prepare('SELECT id FROM products WHERE id=?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  db.prepare('DELETE FROM products WHERE id=?').run(product.id);
  res.json({ message: 'Product deleted' });
});

// ---------- Orders ----------
router.get('/orders', (req, res) => {
  const { status } = req.query;
  const where = [];
  const params = [];
  if (status && status !== 'all') { where.push('status = ?'); params.push(status); }
  const orders = db.prepare(`SELECT * FROM orders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`).all(...params);
  const itemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id=?');
  for (const o of orders) o.items = itemsStmt.all(o.id);
  res.json({ orders });
});

router.put('/orders/:id/status', (req, res) => {
  const order = db.prepare('SELECT id FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const { status } = req.body || {};
  if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, order.id);
  res.json({ message: 'Order status updated' });
});

router.delete('/orders/:id', (req, res) => {
  const order = db.prepare('SELECT id FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  db.prepare('DELETE FROM orders WHERE id=?').run(order.id);
  res.json({ message: 'Order deleted' });
});

export default router;