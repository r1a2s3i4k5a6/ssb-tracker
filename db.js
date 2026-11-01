// Creates the SQLite database file and all tables.
// Uses the SQLite that is built into Node.js (no extra install needed).
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbFolder = path.join(__dirname, 'database');
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder);

const db = new DatabaseSync(path.join(dbFolder, 'ssb.db'));
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS aspirants (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    entry_type    TEXT DEFAULT 'NDA',
    ssb_date      TEXT,
    created_at    TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    aspirant_id  INTEGER NOT NULL,
    title        TEXT NOT NULL,
    category     TEXT NOT NULL,
    task_time    TEXT NOT NULL DEFAULT '12:00',
    created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aspirant_id) REFERENCES aspirants(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS completions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id      INTEGER NOT NULL,
    aspirant_id  INTEGER NOT NULL,
    done_date    TEXT NOT NULL,
    UNIQUE (task_id, done_date),
    FOREIGN KEY (task_id)     REFERENCES tasks(id)      ON DELETE CASCADE,
    FOREIGN KEY (aspirant_id) REFERENCES aspirants(id)  ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quiz_questions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    question    TEXT NOT NULL,
    options     TEXT NOT NULL,      -- JSON list of 4 answers
    correct     INTEGER NOT NULL,   -- position of the right answer: 0, 1, 2 or 3
    explanation TEXT
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    aspirant_id  INTEGER NOT NULL,
    score        INTEGER NOT NULL,
    total        INTEGER NOT NULL,
    taken_at     TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aspirant_id) REFERENCES aspirants(id) ON DELETE CASCADE
  );
`);

// Round 2: admin flag + contact messages
try { db.exec('ALTER TABLE aspirants ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0'); } catch (e) { /* column already exists */ }
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    message    TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Fill the question bank the first time the server runs
const have = db.prepare('SELECT COUNT(*) AS n FROM quiz_questions').get().n;
if (have === 0) {
  const seed = require('./seed-questions');
  const add = db.prepare('INSERT INTO quiz_questions (question, options, correct, explanation) VALUES (?, ?, ?, ?)');
  seed.forEach(q => add.run(q.q, JSON.stringify(q.o), q.c, q.e));
}

// Demo account + a few classmates on the very first run (demo@ssb.com / demo123)
require('./seed-demo')(db);

// Admin account (admin@ssb.com). Password: the ADMIN_PASSWORD setting if you set one on the host, otherwise admin123. It is created after the demo seed so the demo data still loads.
if (!db.prepare("SELECT id FROM aspirants WHERE email = 'admin@ssb.com'").get()) {
  const hash = require('bcryptjs').hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
  db.prepare("INSERT INTO aspirants (name, email, password_hash, entry_type, is_admin) VALUES ('Administrator', 'admin@ssb.com', ?, 'NDA', 1)").run(hash);
}

module.exports = db;
