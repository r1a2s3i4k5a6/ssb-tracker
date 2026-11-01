// Adds a demo account and a few classmates the first time the server runs,
// so the dashboard, heatmap and leaderboard look alive in the viva.
// Demo login:  demo@ssb.com  /  demo123
const bcrypt = require('bcryptjs');
const STARTER_TASKS = require('./starter-tasks');

const pad = n => String(n).padStart(2, '0');
const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// small repeatable random generator, so the demo data is the same every time
function rng(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }

module.exports = function seedDemo(db) {
  if (db.prepare('SELECT COUNT(*) AS n FROM aspirants').get().n > 0) return;

  const people = [
    { name: 'Demo Aspirant', email: 'demo@ssb.com', entry: 'NDA', days: 34, rate: 0.82, seed: 11, quizzes: [[7, 10], [8, 10], [9, 10]] },
    { name: 'Arjun Singh',   email: 'arjun@ssb.com', entry: 'CDS',   days: 34, rate: 0.9,  seed: 23, quizzes: [[17, 20], [18, 20]] },
    { name: 'Meera Nair',    email: 'meera@ssb.com', entry: 'AFCAT', days: 28, rate: 0.78, seed: 37, quizzes: [[8, 10], [9, 10]] },
    { name: 'Kabir Khan',    email: 'kabir@ssb.com', entry: 'NDA',   days: 18, rate: 0.7,  seed: 41, quizzes: [[6, 10]] },
    { name: 'Priya Sharma',  email: 'priya@ssb.com', entry: 'TES',   days: 12, rate: 0.65, seed: 53, quizzes: [[5, 10], [7, 10]] }
  ];

  const hash = bcrypt.hashSync('demo123', 10);
  const addUser = db.prepare('INSERT INTO aspirants (name, email, password_hash, entry_type, ssb_date) VALUES (?, ?, ?, ?, ?)');
  const addTask = db.prepare('INSERT INTO tasks (aspirant_id, title, category, task_time) VALUES (?, ?, ?, ?)');
  const addDone = db.prepare('INSERT OR IGNORE INTO completions (task_id, aspirant_id, done_date) VALUES (?, ?, ?)');
  const addQuiz = db.prepare('INSERT INTO quiz_attempts (aspirant_id, score, total) VALUES (?, ?, ?)');

  const soon = new Date(); soon.setDate(soon.getDate() + 45);

  people.forEach(p => {
    const uid = Number(addUser.run(p.name, p.email, hash, p.entry, key(soon)).lastInsertRowid);
    const taskIds = STARTER_TASKS.map(t => Number(addTask.run(uid, t[0], t[1], t[2]).lastInsertRowid));
    const rnd = rng(p.seed);
    for (let back = 0; back < p.days; back++) {
      const d = new Date(); d.setDate(d.getDate() - back);
      if (back === 0) continue;                           // leave today empty so the user can tick tasks live
      const strong = back <= 6 ? 0.2 : 0;                 // recent week is stronger, so the streak shows
      taskIds.forEach(id => { if (rnd() < Math.min(0.98, p.rate + strong)) addDone.run(id, uid, key(d)); });
    }
    p.quizzes.forEach(q => addQuiz.run(uid, q[0], q[1]));
  });
};
