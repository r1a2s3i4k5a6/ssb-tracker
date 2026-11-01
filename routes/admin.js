const express = require('express');
const db = require('../db');
const { requireLogin, requireAdmin } = require('../middleware');
const router = express.Router();
router.use(requireLogin, requireAdmin);       // every route here is for the admin only

// checks a question before it is saved
function clean(b) {
  const options = Array.isArray(b.options) ? b.options.map(o => String(o).trim()) : [];
  const q = String(b.question || '').trim();
  if (!q || q.length > 300) return { error: 'Question is required (max 300 characters)' };
  if (options.length !== 4 || options.some(o => !o || o.length > 100)) return { error: 'Give exactly 4 options (max 100 characters each)' };
  if (!Number.isInteger(b.correct) || b.correct < 0 || b.correct > 3) return { error: 'Choose the correct option' };
  return { q, options, correct: b.correct, explanation: String(b.explanation || '').trim().slice(0, 300) };
}

// GET /api/admin/summary
router.get('/summary', (req, res) => {
  const n = sql => Number(db.prepare(sql).get().n);
  res.json({
    aspirants: n('SELECT COUNT(*) AS n FROM aspirants WHERE is_admin = 0'),
    tasksDone: n('SELECT COUNT(*) AS n FROM completions'),
    quizzes: n('SELECT COUNT(*) AS n FROM quiz_attempts'),
    questions: n('SELECT COUNT(*) AS n FROM quiz_questions'),
    messages: n('SELECT COUNT(*) AS n FROM messages')
  });
});

// Quiz questions: create, read, update, delete
router.get('/questions', (req, res) => {
  const rows = db.prepare('SELECT * FROM quiz_questions ORDER BY id DESC').all();
  res.json(rows.map(r => ({ id: Number(r.id), question: r.question, options: JSON.parse(r.options), correct: Number(r.correct), explanation: r.explanation })));
});
router.post('/questions', (req, res) => {
  const c = clean(req.body); if (c.error) return res.status(400).json(c);
  const info = db.prepare('INSERT INTO quiz_questions (question, options, correct, explanation) VALUES (?, ?, ?, ?)')
    .run(c.q, JSON.stringify(c.options), c.correct, c.explanation);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});
router.put('/questions/:id', (req, res) => {
  const c = clean(req.body); if (c.error) return res.status(400).json(c);
  const info = db.prepare('UPDATE quiz_questions SET question = ?, options = ?, correct = ?, explanation = ? WHERE id = ?')
    .run(c.q, JSON.stringify(c.options), c.correct, c.explanation, Number(req.params.id));
  if (info.changes === 0) return res.status(404).json({ error: 'Question not found' });
  res.json({ message: 'Updated' });
});
router.delete('/questions/:id', (req, res) => {
  const info = db.prepare('DELETE FROM quiz_questions WHERE id = ?').run(Number(req.params.id));
  if (info.changes === 0) return res.status(404).json({ error: 'Question not found' });
  res.json({ message: 'Deleted' });
});

// Messages sent from the About page
router.get('/messages', (req, res) => {
  res.json(db.prepare('SELECT id, name, email, message, created_at FROM messages ORDER BY id DESC LIMIT 50').all()
    .map(m => ({ ...m, id: Number(m.id) })));
});
router.delete('/messages/:id', (req, res) => {
  const info = db.prepare('DELETE FROM messages WHERE id = ?').run(Number(req.params.id));
  if (info.changes === 0) return res.status(404).json({ error: 'Message not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
