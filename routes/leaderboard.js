const express = require('express');
const db = require('../db');
const { requireLogin } = require('../middleware');
const router = express.Router();

router.use(requireLogin);

// GET /api/leaderboard -> top 10 aspirants by tasks completed, plus my own position
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT a.id, a.name, a.entry_type,
           (SELECT COUNT(*) FROM completions c WHERE c.aspirant_id = a.id) AS done,
           (SELECT COUNT(*) FROM quiz_attempts q WHERE q.aspirant_id = a.id) AS attempts,
           (SELECT COALESCE(MAX(ROUND(q.score * 100.0 / q.total)), 0) FROM quiz_attempts q WHERE q.aspirant_id = a.id) AS best_quiz
    FROM aspirants a WHERE a.is_admin = 0
    ORDER BY done DESC, best_quiz DESC, a.name
  `).all();

  const me = Number(req.session.aspirantId);
  const ranked = rows.map((r, i) => ({
    position: i + 1,
    name: r.name,
    entry_type: r.entry_type,
    done: Number(r.done),
    attempts: Number(r.attempts),
    best_quiz: Number(r.best_quiz),
    me: Number(r.id) === me
  }));

  res.json({
    total: ranked.length,
    top: ranked.slice(0, 10),
    mine: ranked.find(r => r.me) || null
  });
});

module.exports = router;
