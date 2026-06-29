const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();
const db = new Database(path.join(__dirname, 'db', 'p20.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'ambassador',
    name          TEXT NOT NULL,
    active        INTEGER DEFAULT 1,
    created_at    TEXT DEFAULT (datetime('now'))
  );

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

/* Add profile + onboarding columns to users table if they don't exist yet */
['bio', 'major', 'institution', 'cohort', 'avatar_color'].forEach(col => {
  try { db.exec(`ALTER TABLE users ADD COLUMN ${col} TEXT DEFAULT ''`); } catch {}
});
try { db.exec(`ALTER TABLE users ADD COLUMN onboarding_complete INTEGER DEFAULT 0`); } catch {}
/* Staff accounts are always considered onboarded */
db.prepare(`UPDATE users SET onboarding_complete = 1 WHERE role = 'staff'`).run();

/* Seed default admin user */
const adminHash = bcrypt.hashSync('P20Staff2025!', 10);
db.prepare(`
  INSERT OR IGNORE INTO users (username, email, password_hash, role, name)
  VALUES ('admin', 'admin@p20.org', ?, 'staff', 'Admin')
`).run(adminHash);

/* Seed demo access code */
db.prepare(`
  INSERT OR IGNORE INTO portal_codes (code, name, email)
  VALUES ('DEMO2025', 'Demo Applicant', 'demo@landofsky.org')
`).run();

/* ── Middleware ── */

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'p20-dev-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

function requireStaff(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'staff')
    return res.status(403).json({ error: 'Staff only' });
  next();
}

/* ── Auth routes ── */

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username.trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid username or password' });
  req.session.user = { id: user.id, username: user.username, role: user.role, name: user.name, onboarding_complete: user.onboarding_complete };
  res.json({ username: user.username, role: user.role, name: user.name, onboarding_complete: user.onboarding_complete });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json(req.session.user);
});

app.post('/api/auth/complete-onboarding', requireAuth, (req, res) => {
  db.prepare('UPDATE users SET onboarding_complete = 1 WHERE id = ?').run(req.session.user.id);
  req.session.user.onboarding_complete = 1;
  res.json({ ok: true });
});

app.get('/api/auth/users', requireStaff, (req, res) => {
  const users = db.prepare(
    'SELECT id, username, email, role, name, active, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json(users);
});

app.post('/api/auth/users', requireStaff, (req, res) => {
  const { username, email, password, role = 'ambassador', name } = req.body;
  if (!username || !email || !password || !name)
    return res.status(400).json({ error: 'username, email, password, and name are required' });
  if (!['ambassador', 'staff'].includes(role))
    return res.status(400).json({ error: 'role must be ambassador or staff' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash, role, name) VALUES (?, ?, ?, ?, ?)'
    ).run(username.trim(), email.trim(), hash, role, name.trim());
    const user = db.prepare('SELECT id, username, email, role, name, active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(user);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username or email already exists' });
    throw e;
  }
});

app.patch('/api/auth/users/:id', requireStaff, (req, res) => {
  const { name, email, role, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (name)     db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, user.id);
  if (email)    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, user.id);
  if (role && ['ambassador', 'staff'].includes(role))
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, user.id);
  if (password) db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), user.id);
  res.json(db.prepare('SELECT id, username, email, role, name, active, created_at FROM users WHERE id = ?').get(user.id));
});

app.delete('/api/auth/users/:id', requireStaff, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.username === 'admin') return res.status(403).json({ error: 'Cannot delete the admin account' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ── Profile routes ── */

app.get('/api/auth/me/profile', requireAuth, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, email, role, name, bio, major, institution, cohort, avatar_color, created_at FROM users WHERE id = ?'
  ).get(req.session.user.id);
  res.json(user);
});

app.patch('/api/auth/me/profile', requireAuth, (req, res) => {
  const { name, bio, major, institution, cohort, avatar_color } = req.body;
  const allowed = { bio, major, institution, cohort, avatar_color };
  if (name) allowed.name = name.trim();
  const fields = Object.entries(allowed).filter(([, v]) => v !== undefined);
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  const sql = `UPDATE users SET ${fields.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...fields.map(([, v]) => v), req.session.user.id);
  if (name) req.session.user.name = name.trim();
  res.json(db.prepare(
    'SELECT id, username, email, role, name, bio, major, institution, cohort, avatar_color FROM users WHERE id = ?'
  ).get(req.session.user.id));
});

app.get('/api/users/profiles', requireAuth, (req, res) => {
  const users = db.prepare(
    `SELECT id, username, name, role, bio, major, institution, cohort, avatar_color
     FROM users WHERE active = 1 AND role = 'ambassador' ORDER BY name ASC`
  ).all();
  res.json(users);
});

/* ── Admin routes ── */

app.get('/api/admin/stats', requireStaff, (req, res) => {
  const users         = db.prepare(`SELECT COUNT(*) as n FROM users WHERE active = 1 AND role = 'ambassador'`).get().n;
  const pendingReqs   = db.prepare(`SELECT COUNT(*) as n FROM items WHERE store = 'p20_devices' AND json_extract(data,'$.status') = 'pending'`).get().n;
  const boardPosts    = db.prepare(`SELECT COUNT(*) as n FROM items WHERE store = 'p20_board'`).get().n;
  const events        = db.prepare(`SELECT COUNT(*) as n FROM items WHERE store = 'p20_events'`).get().n;
  const portalCodes   = db.prepare(`SELECT COUNT(*) as n FROM portal_codes WHERE used = 0`).get().n;
  res.json({ users, pendingReqs, boardPosts, events, portalCodes });
});

/* ── Ambassador routes ── */

app.get('/api/ambassadors', requireAuth, (req, res) => {
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

app.post('/api/ambassadors', requireAuth, (req, res) => {
  const { name, email, cohort = 'dynamic', role = 'new', major = '', bio = '', author = '' } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  const result = db.prepare(
    'INSERT INTO ambassadors (name, email, cohort, role, major, bio, author) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(name, email, cohort, role, major, bio, author);
  res.status(201).json(db.prepare('SELECT * FROM ambassadors WHERE id = ?').get(result.lastInsertRowid));
});

app.delete('/api/ambassadors/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM ambassadors WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ── Generic key-value store ── */

app.get('/api/store/:key', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT id, data, created_at FROM items WHERE store = ? ORDER BY id DESC'
  ).all(req.params.key);
  res.json(rows.map(r => ({ ...JSON.parse(r.data), id: r.id, created_at: r.created_at })));
});

app.post('/api/store/:key', requireAuth, (req, res) => {
  const result = db.prepare(
    'INSERT INTO items (store, data) VALUES (?, ?)'
  ).run(req.params.key, JSON.stringify(req.body));
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...JSON.parse(row.data), id: row.id, created_at: row.created_at });
});

app.patch('/api/store/:key/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM items WHERE store = ? AND id = ?').get(req.params.key, req.params.id);
  if (!row) return res.status(404).json({ error: 'Item not found' });
  const updated = { ...JSON.parse(row.data), ...req.body };
  db.prepare('UPDATE items SET data = ? WHERE id = ?').run(JSON.stringify(updated), row.id);
  res.json({ ...updated, id: row.id, created_at: row.created_at });
});

app.delete('/api/store/:key/:id', requireAuth, (req, res) => {
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

app.post('/api/portal/register', async (req, res) => {
  const { code, username, password } = req.body;
  if (!code || !username || !password)
    return res.status(400).json({ error: 'code, username, and password are required' });
  const record = db.prepare('SELECT * FROM portal_codes WHERE code = ?').get(code.trim().toUpperCase());
  if (!record) return res.status(404).json({ error: 'Invalid access code' });
  if (record.used) return res.status(409).json({ error: 'This code has already been used' });
  if (db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim()))
    return res.status(409).json({ error: 'Username already taken' });
  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare(
    `INSERT INTO users (username, email, password_hash, role, name, active, onboarding_complete)
     VALUES (?, ?, ?, 'ambassador', ?, 1, 0)`
  ).run(username.trim(), record.email, hash, record.name);
  db.prepare('UPDATE portal_codes SET used = 1 WHERE id = ?').run(record.id);
  const user = { id: result.lastInsertRowid, username: username.trim(), role: 'ambassador', name: record.name, onboarding_complete: 0 };
  req.session.user = user;
  res.status(201).json(user);
});

app.get('/api/portal/codes', requireStaff, (req, res) => {
  res.json(db.prepare('SELECT * FROM portal_codes ORDER BY created_at DESC').all());
});

app.post('/api/portal/codes', requireStaff, (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  let code, attempts = 0;
  do { code = generateCode(); attempts++; } while (
    db.prepare('SELECT id FROM portal_codes WHERE code = ?').get(code) && attempts < 10
  );
  db.prepare('INSERT INTO portal_codes (code, name, email) VALUES (?, ?, ?)').run(code, name, email);
  res.status(201).json({ code, name, email });
});

app.delete('/api/portal/codes/:id', requireStaff, (req, res) => {
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

app.get('/api/portal/applications', requireStaff, (req, res) => {
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
