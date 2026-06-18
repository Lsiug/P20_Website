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

  CREATE TABLE IF NOT EXISTS portal_codes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT UNIQUE NOT NULL,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    used       INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    code_id      INTEGER NOT NULL,
    data         TEXT NOT NULL,
    submitted_at TEXT DEFAULT (datetime('now'))
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

/* ── Portal routes ── */

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

app.post('/api/portal/validate', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code required' });
  const record = db.prepare('SELECT * FROM portal_codes WHERE code = ?').get(code.trim().toUpperCase());
  if (!record) return res.status(404).json({ error: 'Invalid code' });
  res.json({ id: record.id, name: record.name, email: record.email, code: record.code });
});

app.get('/api/portal/codes', (req, res) => {
  res.json(db.prepare('SELECT * FROM portal_codes ORDER BY created_at DESC').all());
});

app.post('/api/portal/codes', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  let code, attempts = 0;
  do { code = generateCode(); attempts++; } while (
    db.prepare('SELECT id FROM portal_codes WHERE code = ?').get(code) && attempts < 10
  );
  db.prepare('INSERT INTO portal_codes (code, name, email) VALUES (?, ?, ?)').run(code, name, email);
  res.status(201).json({ code, name, email });
});

app.delete('/api/portal/codes/:id', (req, res) => {
  db.prepare('DELETE FROM portal_codes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/portal/applications', (req, res) => {
  const { code, ...data } = req.body;
  if (!code) return res.status(400).json({ error: 'code required' });
  const record = db.prepare('SELECT * FROM portal_codes WHERE code = ?').get(code);
  if (!record) return res.status(403).json({ error: 'Invalid code' });
  if (db.prepare('SELECT id FROM applications WHERE code_id = ?').get(record.id)) {
    return res.status(409).json({ error: 'Application already submitted for this code' });
  }
  const result = db.prepare('INSERT INTO applications (code_id, data) VALUES (?, ?)').run(
    record.id, JSON.stringify({ ...data, name: record.name, email: record.email })
  );
  db.prepare('UPDATE portal_codes SET used = 1 WHERE id = ?').run(record.id);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.get('/api/portal/applications', (req, res) => {
  const rows = db.prepare(`
    SELECT a.id, a.data, a.submitted_at
    FROM applications a
    ORDER BY a.submitted_at DESC
  `).all();
  res.json(rows.map(r => ({ ...JSON.parse(r.data), id: r.id, submitted_at: r.submitted_at })));
});

app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`P20 server running at http://localhost:${PORT}`));
