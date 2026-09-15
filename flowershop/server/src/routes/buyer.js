import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/', (req, res) => {
  const { items, customer_name, customer_email, customer_phone, address, note } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });
  if (!customer_name || !customer_email || !address) return res.status(400).json({ error: 'Name, email and address are required' });

  let total = 0;
  const lines = [];
  for (const item of items) {
    const product = db.prepare("SELECT * FROM products WHERE id=? AND status='approved'").get(item.product_id);
    if (!product) continue;
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    if (product.stock < qty) return res.status(400).json({ error: `Insufficient stock for "${product.name}"` });
    total += product.price * qty;
    lines.push({ product, qty });
  }
  if (lines.length === 0) return res.status(400).json({ error: 'No valid products in cart' });

  const info = db.prepare(`
    INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, address, note, total, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, customer_name, customer_email, customer_phone || '', address, note || '', total, 'pending');
  const orderId = info.lastInsertRowid;

  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, seller_id, product_name, quantity, price)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  for (const { product, qty } of lines) {
    insertItem.run(orderId, product.id, product.seller_id, product.name, qty, product.price);
    updateStock.run(qty, product.id);
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  res.status(201).json({ order, total, message: 'Order placed successfully' });
});

router.get('/mine', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const itemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  for (const o of orders) o.items = itemsStmt.all(o.id);
  res.json({ orders });
});

export default router;