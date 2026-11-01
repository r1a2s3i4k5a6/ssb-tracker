const express = require('express');
const db = require('../db');
const { requireLogin } = require('../middleware');
const router = express.Router();

router.use(requireLogin);

// GET /api/quiz/questions?count=10 -> random questions WITHOUT the right answers
router.get('/questions', (req, res) => {
  const count = Math.min(Math.max(parseInt(req.query.count) || 10, 1), 30);
  const rows = db.prepare('SELECT id, question, options FROM quiz_questions ORDER BY RANDOM() LIMIT ?').all(count);
  res.json(rows.map(r => ({ id: Number(r.id), question: r.question, options: JSON.parse(r.options) })));
});

// POST /api/quiz/submit  body: { answers: [ { id: 3, choice: 1 }, ... ] }
// The server marks the answers, so the browser can never cheat
router.post('/submit', (req, res) => {
  const answers = Array.isArray(req.body.answers) ? req.body.answers.slice(0, 30) : [];
  if (answers.length === 0) return res.status(400).json({ error: 'No answers received' });

  const find = db.prepare('SELECT * FROM quiz_questions WHERE id = ?');
  const review = [];
  let score = 0;

  answers.forEach(a => {
    const q = find.get(Number(a.id));
    if (!q) return;
    const chosen = Number.isInteger(a.choice) ? a.choice : -1;   // -1 = not answered
    if (chosen === q.correct) score++;
    review.push({
      id: Number(q.id), question: q.question, options: JSON.parse(q.options),
      chosen, correct: Number(q.correct), explanation: q.explanation
    });
  });

  if (review.length === 0) return res.status(400).json({ error: 'No valid questions' });

  db.prepare('INSERT INTO quiz_attempts (aspirant_id, score, total) VALUES (?, ?, ?)')
    .run(req.session.aspirantId, score, review.length);

  res.json({ score, total: review.length, review });
});

// GET /api/quiz/history -> my last 8 attempts
router.get('/history', (req, res) => {
  const rows = db.prepare(
    'SELECT score, total, taken_at FROM quiz_attempts WHERE aspirant_id = ? ORDER BY id DESC LIMIT 8'
  ).all(req.session.aspirantId);
  res.json(rows);
});

module.exports = router;
