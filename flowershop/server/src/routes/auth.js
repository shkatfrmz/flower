import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, requireAuth } from '../middleware.js';

const router = Router();

router.post('/register', (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error: 'Username, email and password are required' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const uname = String(username).trim();
  const mail = String(email).trim().toLowerCase();
  if (!/^[A-Za-z0-9_.-]+$/.test(uname)) return res.status(400).json({ error: 'Username may only contain letters, numbers, dots, underscores and dashes' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return res.status(400).json({ error: 'Invalid email address' });

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(uname, mail);
  if (existing) return res.status(409).json({ error: 'Username or email already in use' });

  const hash = bcrypt.hashSync(String(password), 10);
  const info = db.prepare('INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)')
    .run(uname, mail, hash, 'seller', 'active');
  const user = db.prepare('SELECT id, username, email, role, status, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(String(username).trim(), String(username).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(String(password), user.password)) return res.status(401).json({ error: 'Invalid username or password' });
  if (user.status !== 'active') return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
  const safe = { id: user.id, username: user.username, email: user.email, role: user.role, status: user.status, created_at: user.created_at };
  res.json({ token: signToken(safe), user: safe });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, email, role, status, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

export default router;