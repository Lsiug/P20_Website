const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const db = new Database(path.join(__dirname, 'db', 'p20.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS ambassadors (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    email     TEXT NOT NULL,
    cohort    TEXT NOT NULL DEFAULT '2023',
    role      TEXT NOT NULL DEFAULT 'student',
    major     TEXT,
    bio       TEXT,
    author    TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    store      TEXT NOT NULL,
    data       TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

app.use(express.json());

/* ── Ambassador routes ── */

app.get('/api/ambassadors', (req, res) => {
  const { cohort, role } = req.query;
  let sql = 'SELECT * FROM ambassadors';
  const params = [];
  const conditions = [];
  if (cohort)    { conditions.push('cohort = ?'); params.push(cohort); }
  if (role)      { conditions.push('role = ?');   params.push(role); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY name ASC';
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/ambassadors', (req, res) => {
  const { name, email, cohort = 'dynamic', role = 'new', major = '', bio = '', author = '' } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  const result = db.prepare(
    'INSERT INTO ambassadors (name, email, cohort, role, major, bio, author) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name, email, cohort, role, major, bio, author);
  res.status(201).json(db.prepare('SELECT * FROM ambassadors WHERE id = ?').get(result.lastInsertRowid));
});

app.delete('/api/ambassadors/:id', (req, res) => {
  db.prepare('DELETE FROM ambassadors WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ── Generic key-value store (replaces localStorage for news, events, requests) ── */

app.get('/api/store/:key', (req, res) => {
  const rows = db.prepare(
    'SELECT id, data, created_at FROM items WHERE store = ? ORDER BY id DESC'
  ).all(req.params.key);
  res.json(rows.map(r => ({ ...JSON.parse(r.data), id: r.id, created_at: r.created_at })));
});

app.post('/api/store/:key', (req, res) => {
  const result = db.prepare(
    'INSERT INTO items (store, data) VALUES (?, ?)'
  ).run(req.params.key, JSON.stringify(req.body));
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...JSON.parse(row.data), id: row.id, created_at: row.created_at });
});

app.delete('/api/store/:key/:id', (req, res) => {
  db.prepare('DELETE FROM items WHERE store = ? AND id = ?').run(req.params.key, req.params.id);
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`P20 server running at http://localhost:${PORT}`));
