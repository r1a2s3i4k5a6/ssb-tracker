const express = require('express');
const db = require('../db');
const router = express.Router();

const sent = {};                                   // simple limit: 5 messages per hour per visitor
// POST /api/contact  (public, no login needed)
router.post('/', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const message = String(req.body.message || '').trim();

  if (name.length < 2 || name.length > 60) return res.status(400).json({ error: 'Please enter your name (2 to 60 characters)' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) return res.status(400).json({ error: 'Please enter a valid email' });
  if (message.length < 10 || message.length > 1000) return res.status(400).json({ error: 'Message must be 10 to 1000 characters' });

  const now = Date.now(), list = (sent[req.ip] || []).filter(t => now - t < 3600000);
  if (list.length >= 5) return res.status(429).json({ error: 'Too many messages. Please try again later.' });
  sent[req.ip] = list.concat(now);

  db.prepare('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)').run(name, email, message);
  res.status(201).json({ message: 'Thank you. Your message has been saved.' });
});

module.exports = router;
