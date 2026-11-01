const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireLogin } = require('../middleware');
const router = express.Router();

// Every new aspirant starts with these tasks (they can edit them later)
const STARTER_TASKS = require('../starter-tasks');

// REGISTER
router.post('/register', (req, res) => {
  const { name, email, password, entry_type, ssb_date } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const exists = db.prepare('SELECT id FROM aspirants WHERE email = ?').get(cleanEmail);
  if (exists) {
    return res.status(409).json({ error: 'This email is already registered' });
  }

  const hash = bcrypt.hashSync(password, 10);   // never store the real password
  const info = db.prepare(
    'INSERT INTO aspirants (name, email, password_hash, entry_type, ssb_date) VALUES (?, ?, ?, ?, ?)'
  ).run(name.trim(), cleanEmail, hash, entry_type || 'NDA', ssb_date || null);

  const id = Number(info.lastInsertRowid);
  const addTask = db.prepare(
    'INSERT INTO tasks (aspirant_id, title, category, task_time) VALUES (?, ?, ?, ?)'
  );
  STARTER_TASKS.forEach(t => addTask.run(id, t[0], t[1], t[2]));

  req.session.aspirantId = id;                  // log them in straight away
  res.status(201).json({ message: 'Registered', name: name.trim() });
});

// LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM aspirants WHERE email = ?').get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }

  req.session.aspirantId = Number(user.id);
  res.json({ message: 'Logged in', name: user.name });
});

// LOGOUT
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

// WHO AM I (the dashboard uses this)
router.get('/me', requireLogin, (req, res) => {
  const user = db.prepare(
    'SELECT name, email, entry_type, ssb_date, is_admin FROM aspirants WHERE id = ?'
  ).get(req.session.aspirantId);
  res.json(user);
});

// SAVE SSB DATE
router.post('/ssb-date', requireLogin, (req, res) => {
  db.prepare('UPDATE aspirants SET ssb_date = ? WHERE id = ?')
    .run(req.body.ssb_date || null, req.session.aspirantId);
  res.json({ message: 'Saved' });
});

// UPDATE PROFILE (name, entry type, SSB date)
router.post('/profile', requireLogin, (req, res) => {
  const { name, entry_type, ssb_date } = req.body;
  const entries = ['NDA', 'CDS', 'AFCAT', 'TES', 'NCC Special'];
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!entries.includes(entry_type)) return res.status(400).json({ error: 'Invalid entry type' });
  if (ssb_date && !/^\d{4}-\d{2}-\d{2}$/.test(ssb_date)) return res.status(400).json({ error: 'Invalid date' });
  db.prepare('UPDATE aspirants SET name = ?, entry_type = ?, ssb_date = ? WHERE id = ?')
    .run(name.trim(), entry_type, ssb_date || null, req.session.aspirantId);
  res.json({ message: 'Profile saved' });
});

// CHANGE PASSWORD
router.post('/password', requireLogin, (req, res) => {
  const { current, next } = req.body;
  if (!current || !next) return res.status(400).json({ error: 'Both passwords are required' });
  if (next.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  const user = db.prepare('SELECT password_hash FROM aspirants WHERE id = ?').get(req.session.aspirantId);
  if (!bcrypt.compareSync(current, user.password_hash)) return res.status(401).json({ error: 'Current password is wrong' });
  db.prepare('UPDATE aspirants SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 10), req.session.aspirantId);
  res.json({ message: 'Password changed' });
});

module.exports = router;
