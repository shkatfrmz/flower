import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data.db');
const UPLOAD_PATH = path.join(__dirname, 'uploads');

export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'seller',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL,
  category_id INTEGER,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 100,
  images TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  address TEXT NOT NULL,
  note TEXT DEFAULT '',
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare("INSERT INTO users (username, email, password, role) VALUES ('admin', 'admin@petalbloom.com', ?, 'admin')").run(hash);
  const hashSeller = bcrypt.hashSync('demo123', 10);
  db.prepare("INSERT INTO users (username, email, password, role) VALUES ('demo_seller', 'seller@petalbloom.com', ?, 'seller')").run(hashSeller);
  console.log('[seed] Created admin user (admin/admin123) and demo seller (demo_seller/demo123)');
}

const catCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
if (catCount === 0) {
  const stmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  stmt.run('Roses', 'Classic roses for every romantic moment');
  stmt.run('Tulips', 'Bright spring tulips in all colors');
  stmt.run('Sunflowers', 'Cheerful sunflowers to brighten any day');
  stmt.run('Orchids', 'Elegant exotic orchids');
  stmt.run('Lilies', 'Fragrant lilies with graceful blooms');
  stmt.run('Bouquets', 'Hand-arranged mixed bouquets');
  console.log('[seed] Created default categories');
}

const prodCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (prodCount === 0) {
  const seller = db.prepare("SELECT id FROM users WHERE username='demo_seller'").get();
  const cats = db.prepare('SELECT id, name FROM categories').all();
  const catByName = Object.fromEntries(cats.map(c => [c.name, c.id]));
  const stmt = db.prepare(`
    INSERT INTO products (seller_id, category_id, name, description, price, stock, images, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
  `);
  const seed = [
    ['Red Velvet Roses', 'Roses', 'A dozen premium red roses, perfect for anniversaries and declarations of love.', 39.99, 50],
    ['Pastel Tulip Bunch', 'Tulips', 'A fresh bunch of pastel tulips straight from the spring fields.', 24.5, 80],
    ['Golden Sunflower Stem', 'Sunflowers', 'Large golden sunflowers with sturdy stems, sun on a vase.', 9.99, 200],
    ['Phalaenopsis Orchid', 'Orchids', 'A graceful white phalaenopsis orchid plant in a ceramic pot.', 49.0, 30],
    ['Fragrant Casa Blanca Lilies', 'Lilies', 'Snow-white Casa Blanca lilies with a rich, sweet fragrance.', 34.0, 40],
    ['Garden Party Bouquet', 'Bouquets', 'A cheerful hand-tied mix of roses, eucalyptus and baby breath.', 44.99, 60],
    ['Midnight Black Roses', 'Roses', 'Striking dark roses for a bold and mysterious statement.', 55.0, 25],
    ['Rainbow Tulip Mix', 'Tulips', 'Colorful tulips in a rainbow mix, a true eye-catcher.', 29.99, 70],
  ];
  for (const [name, cat, desc, price, stock] of seed) {
    stmt.run(seller.id, catByName[cat], name, desc, price, stock, JSON.stringify(['p' + name.toLowerCase().replace(/[^a-z0-9]/g, '-')]));
  }
  console.log('[seed] Created sample products');
}

export { UPLOAD_PATH };

export function parseProducts(rows) {
  return (rows || []).map((p) => {
    if (p && typeof p.images === 'string') {
      try { p.images = JSON.parse(p.images || '[]'); } catch { p.images = []; }
    }
    return p;
  });
}

export function parseProduct(row) {
  return (parseProducts([row]) || [])[0] || null;
}