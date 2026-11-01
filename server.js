const express = require('express');
const session = require('express-session');
const path = require('path');
require('./db');                       // runs db.js, so the tables get created

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);          // needed when the site runs behind a host like Render
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'ssb-tracker-secret-key',    // used to sign the login cookie
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }   // stay logged in for 7 days
}));
app.use(express.static(path.join(__dirname, 'public')));   // serve the public folder

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SSB Tracker server is running' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/leaderboard', require('./routes/leaderboard'));

app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));

// Anything that did not match above: a friendly 404
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, () => {
  console.log(`SSB Tracker running at http://localhost:${PORT}`);
});
