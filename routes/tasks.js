const express = require('express');
const db = require('../db');
const { requireLogin } = require('../middleware');
const router = express.Router();

router.use(requireLogin);   // every route in this file needs a logged-in aspirant

const CATEGORIES = ['Screening', 'Psychology', 'GTO', 'Interview', 'Fitness', 'Current Affairs'];
const validDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '');

// GET /api/tasks?date=2026-10-21  -> my tasks, with done = 1 or 0 for that date
router.get('/', (req, res) => {
  const date = req.query.date;
  if (!validDate(date)) return res.status(400).json({ error: 'Date must look like 2026-10-21' });

  const rows = db.prepare(`
    SELECT t.id, t.title, t.category, t.task_time,
           CASE WHEN c.id IS NULL THEN 0 ELSE 1 END AS done
    FROM tasks t
    LEFT JOIN completions c ON c.task_id = t.id AND c.done_date = ?
    WHERE t.aspirant_id = ?
    ORDER BY t.task_time
  `).all(date, req.session.aspirantId);

  res.json(rows);
});

// POST /api/tasks  -> add a task
router.post('/', (req, res) => {
  const { title, category, task_time } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Task title is required' });
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });

  const info = db.prepare(
    'INSERT INTO tasks (aspirant_id, title, category, task_time) VALUES (?, ?, ?, ?)'
  ).run(req.session.aspirantId, title.trim(), category, task_time || '12:00');

  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// POST /api/tasks/5/toggle  -> tick or untick a task for a date
router.post('/:id/toggle', (req, res) => {
  const { date } = req.body;
  if (!validDate(date)) return res.status(400).json({ error: 'Invalid date' });

  // make sure this task belongs to the logged-in aspirant
  const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND aspirant_id = ?')
                 .get(Number(req.params.id), req.session.aspirantId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const existing = db.prepare('SELECT id FROM completions WHERE task_id = ? AND done_date = ?')
                     .get(task.id, date);
  if (existing) {
    db.prepare('DELETE FROM completions WHERE id = ?').run(existing.id);
    return res.json({ done: false });
  }
  db.prepare('INSERT INTO completions (task_id, aspirant_id, done_date) VALUES (?, ?, ?)')
    .run(task.id, req.session.aspirantId, date);
  res.json({ done: true });
});

// DELETE /api/tasks/5
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM tasks WHERE id = ? AND aspirant_id = ?')
                 .run(Number(req.params.id), req.session.aspirantId);
  if (info.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.json({ message: 'Deleted' });
});

// GET /api/tasks/stats  -> numbers for the streak, heatmap and rank
// PUT /api/tasks/5  -> edit a task's title, time or category
router.put('/:id', (req, res) => {
  const { title, category, task_time } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Task title is required' });
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
  const info = db.prepare('UPDATE tasks SET title = ?, category = ?, task_time = ? WHERE id = ? AND aspirant_id = ?')
    .run(title.trim(), category, task_time || '12:00', Number(req.params.id), req.session.aspirantId);
  if (info.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.json({ message: 'Updated' });
});

// GET /api/tasks/report?since=2026-10-02  -> completed tasks per test area since a date
router.get('/report', (req, res) => {
  if (!validDate(req.query.since)) return res.status(400).json({ error: 'since must look like 2026-10-02' });
  const id = req.session.aspirantId;
  const rows = db.prepare(`
    SELECT t.category AS category, COUNT(*) AS tasks,
      (SELECT COUNT(*) FROM completions c JOIN tasks t2 ON t2.id = c.task_id
        WHERE t2.aspirant_id = ? AND t2.category = t.category AND c.done_date >= ?) AS done
    FROM tasks t WHERE t.aspirant_id = ? GROUP BY t.category`).all(id, req.query.since, id);
  res.json(rows.map(r => ({ category: r.category, tasks: Number(r.tasks), done: Number(r.done) })));
});

// GET /api/tasks/export.csv  -> download my whole task history
router.get('/export.csv', (req, res) => {
  const rows = db.prepare(`SELECT c.done_date AS d, t.task_time AS tm, t.title AS title, t.category AS cat
    FROM completions c JOIN tasks t ON t.id = c.task_id WHERE c.aspirant_id = ? ORDER BY c.done_date DESC, t.task_time`).all(req.session.aspirantId);
  const cell = v => { v = String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
  const csv = ['Date,Time,Task,Test area'].concat(rows.map(r => [r.d, r.tm, r.title, r.cat].map(cell).join(','))).join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ssb-task-history.csv"');
  res.send(csv);
});

router.get('/stats', (req, res) => {
  const id = req.session.aspirantId;
  const totalTasks = db.prepare('SELECT COUNT(*) AS n FROM tasks WHERE aspirant_id = ?').get(id).n;
  const rows = db.prepare(
    'SELECT done_date AS d, COUNT(*) AS n FROM completions WHERE aspirant_id = ? GROUP BY done_date'
  ).all(id);

  const byDay = {};
  rows.forEach(r => { byDay[r.d] = r.n; });
  const totalDone = rows.reduce((sum, r) => sum + r.n, 0);

  res.json({ totalTasks, totalDone, byDay });
});

module.exports = router;
