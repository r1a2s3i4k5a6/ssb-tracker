SSB TRACKER - Web Technology project
====================================

WHAT IT IS
A daily tracker for SSB aspirants: login with a database, daily task timeline,
progress ring, streak, rank, heatmap, SSB date countdown, a practice room
(WAT timer, TAT timer, OIR quiz with scores saved in the database) and a
leaderboard that ranks all aspirants. Dark theme with picture backgrounds.

QUICK DEMO LOGIN (created automatically the first time the server starts)
  Email: demo@ssb.com     Password: demo123
  (or press "Try the demo account" on the sign-in page)

THE 5 PAGES
  1. index.html        landing page (hero picture, features, SSB process, entries)
  2. login.html        sign in / create account
  3. dashboard.html    daily schedule, ring, streak, rank, heatmap
  4. practice.html     WAT, TAT and OIR quiz
  5. leaderboard.html  podium + ranking of all aspirants (reads the database)

HOW TO RUN (every time)
1. Unzip this folder. Open it in VS Code:  File > Open Folder > ssb-tracker
2. Open the terminal:  Terminal > New Terminal  (the path must end with ssb-tracker)
3. First time only, install the packages:
       npm install
4. Start the server:
       npm run dev
5. Open http://localhost:3000 in your browser.
   Stop the server with Ctrl+C in the terminal.

Needs Node.js 22 or newer (check with: node -v). The database uses the
SQLite that is built into Node, so nothing else needs installing.
A yellow "ExperimentalWarning: SQLite" message is normal.

FOLDER GUIDE
server.js            starts the website and connects the routes
db.js                creates the SQLite database file and the 5 tables
seed-questions.js    the 20 OIR quiz questions (added to the database on first run)
middleware.js        requireLogin: blocks people who are not logged in
routes/auth.js       register, login, logout, who-am-I, save SSB date   (SERVER code)
routes/tasks.js      list, add, tick, delete tasks, and stats           (SERVER code)
routes/quiz.js       quiz questions, marking, score history             (SERVER code)
routes/leaderboard.js ranking of all aspirants from the database         (SERVER code)
starter-tasks.js     the 10 tasks every new aspirant gets
seed-demo.js         demo account + 4 sample aspirants, added on first run
public/              everything the browser can see
  index.html         landing page
  login.html         sign in / create account
  dashboard.html     the tracker
  practice.html      WAT, TAT and OIR quiz
  leaderboard.html   ranking page
  css/               style.css, dashboard.css, landing.css, practice.css, leaderboard.css
  js/                login.js, dashboard.js, landing.js, practice.js, leaderboard.js  (BROWSER code)
  images/            hero.svg, pic1-3.svg, pattern.svg, favicon.svg (picture backgrounds)
database/            ssb.db is created here automatically

DATABASE TABLES
aspirants       one row per registered person (password is stored hashed)
tasks           each aspirant's own tasks      (linked to aspirants)
completions     one row each time a task is ticked on a date  (linked to tasks)
quiz_questions  the OIR question bank
quiz_attempts   each aspirant's quiz scores    (linked to aspirants)
To look inside: install the VS Code extension "SQLite Viewer" and click database/ssb.db

TROUBLESHOOTING
- "port 3000 already in use": an old server is still running. Close all terminals
  (trash icon), open a new one, run npm run dev again.
- Page looks unstyled or buttons do nothing: press F12, open Console, read the red error.
  css/ and js/ must be INSIDE the public folder.
- To reset all data: stop the server and delete the files inside the database folder.
  A fresh database (with the demo account) is created on the next start.
- REAL PHOTOS: copy your photos into public/images/photos using the file names listed in
  public/images/photos/README.txt (hero.jpg, gallery1.jpg ...). They appear automatically.
  Without a photo, a drawn night-scene picture is shown, so nothing looks broken.
- The fonts come from Google Fonts. Offline, the page still works with fallback fonts.
- Always open the site through http://localhost:3000, never by double-clicking the HTML files.

SECURITY NOTES (for your viva)
- Passwords are hashed with bcrypt before saving; the real password is never stored.
- Every API route for tasks and quiz checks the login session first.
- Each aspirant can only read or change their own tasks (checked by aspirant_id on the server).
- The server marks the quiz, so the browser cannot fake a score.

ROUND 1 ADDITIONS
-----------------
  progress.html + js/progress.js + css/progress.css   Progress report: 30-day bar chart, per-test-area bars,
                                                       OIR quiz trend, print button (charts are drawn as SVG)
  profile.html + js/profile.js                         Profile and settings: edit name, entry, SSB date; change password
  Dashboard: achievement badges (worked out from your own data) and an Edit button on every task (pencil icon)
  New server routes:  PUT /api/tasks/:id   GET /api/tasks/report   POST /api/auth/profile   POST /api/auth/password
  All of them check the login session, and edits only work on your own tasks (aspirant_id check).

ROUND 2 ADDITIONS
-----------------
  ADMIN LOGIN:  admin@ssb.com / admin123   (created automatically; hidden from the leaderboard)
  admin.html + js/admin.js            Admin panel: totals, add / edit / delete OIR quiz questions, read and delete messages
  about.html + js/about.js            About page with a contact form (JavaScript validation + saved to the messages table)
  404.html                            Friendly "page not found" screen (the server sends it for unknown addresses)
  Progress page: "Download CSV" button (your whole task history; cells are made safe for Excel)
  New tables / columns: messages table, aspirants.is_admin column (added automatically to an old database too)
  New server routes:  /api/admin/*  (admin only)   POST /api/contact (public, max 5 messages an hour)   GET /api/tasks/export.csv
  The Admin link appears in the dashboard menu only when you are logged in as the admin.
