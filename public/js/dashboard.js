const $ = id => document.getElementById(id);
let editingId = null, quiz = [];

const CATS = { 'Screening': '#5b9bd5', 'Psychology': '#e0a93f', 'GTO': '#7bbf5a',
               'Interview': '#e27067', 'Fitness': '#3fc1b0', 'Current Affairs': '#8fa0b8' };
const RANKS = [['Aspirant', 0], ['Cadet', 20], ['Sergeant', 60], ['Under Officer', 120], ['Officer Candidate', 250]];
const QUOTES = ['Prepare as if the board is tomorrow.', 'Consistency beats intensity. Show up again today.',
  'Officer-like qualities are built in ordinary hours.', 'Be natural, be honest, be ready.',
  'Small daily wins make a recommended candidate.'];

// Local date as YYYY-MM-DD (avoids the UTC date bug in India before 5:30 AM)
const pad = n => String(n).padStart(2, '0');
const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = key(new Date());
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let user = null, tasks = [], stats = { totalTasks: 0, totalDone: 0, byDay: {} }, filter = 'All';

// Talk to the server. If we are not logged in, go to the login page.
async function api(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) { location.href = 'login.html'; throw new Error('Not logged in'); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function toast(m) {
  const t = $('toast'); t.textContent = m; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

async function loadData() {
  [tasks, stats, quiz] = await Promise.all([api('/api/tasks?date=' + today), api('/api/tasks/stats'), api('/api/quiz/history')]);
  render();
}

function streak() {
  const need = Math.max(1, Math.ceil(stats.totalTasks / 2));
  const ok = d => (stats.byDay[key(d)] || 0) >= need;
  const d = new Date();
  if (!ok(d)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (ok(d)) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function chevrons(n) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const y = 40 - i * 10;
    s += `<path d="M8 ${y} L27 ${y - 14} L46 ${y}" fill="none" stroke="#e0a93f" stroke-width="4"/>`;
  }
  return s || '<circle cx="27" cy="27" r="5" fill="none" stroke="#93a3ba" stroke-width="2"/>';
}

function render() {
  const total = tasks.length;
  const doneCount = tasks.filter(t => t.done).length;
  const p = total ? Math.round(doneCount / total * 100) : 0;

  $('pct').textContent = p + '%';
  $('arc').style.strokeDashoffset = 402.1 * (1 - p / 100);
  $('count').textContent = doneCount + ' of ' + total + ' complete';
  $('sDone').textContent = doneCount;
  $('sStreak').textContent = streak();
  renderBadges();

  // filter tabs
  $('tabs').innerHTML = ['All', ...Object.keys(CATS)]
    .map(c => `<button type="button" class="tab ${c === filter ? 'on' : ''}" data-c="${c}">${c}</button>`).join('');

  // timeline
  const items = tasks.filter(t => filter === 'All' || t.category === filter);
  $('list').innerHTML = items.length ? items.map(t => `
    <li class="row ${t.done ? 'done' : ''}">
      <span class="time">${esc(t.task_time)}</span>
      <button type="button" class="node" data-id="${t.id}" role="checkbox" aria-checked="${!!t.done}" aria-label="Mark done: ${esc(t.title)}"></button>
      <div class="txt">${esc(t.title)}<br><span class="tag" style="--c:${CATS[t.category] || '#888'}">${esc(t.category)}</span></div>
      <span class="acts"><button type="button" class="edit" data-edit="${t.id}" aria-label="Edit task">&#9998;</button><button type="button" class="del" data-del="${t.id}" aria-label="Delete task">&times;</button></span>
    </li>`).join('') : '<div class="empty">Nothing here yet. Add a task below.</div>';

  // rank (based on all tasks ever completed)
  const all = stats.totalDone;
  let r = 0;
  RANKS.forEach((x, i) => { if (all >= x[1]) r = i; });
  const next = RANKS[r + 1];
  $('rank').textContent = RANKS[r][0];
  $('chev').innerHTML = chevrons(r);
  $('rmeter').style.width = (next ? (all - RANKS[r][1]) / (next[1] - RANKS[r][1]) * 100 : 100) + '%';
  $('rnext').textContent = next ? (next[1] - all) + ' more tasks to reach ' + next[0] : 'Highest rank reached. Keep the standard.';

  // heatmap: last 35 days
  let h = '';
  for (let i = 34; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const n = stats.byDay[key(d)] || 0;
    const f = stats.totalTasks ? Math.min(1, n / stats.totalTasks) : 0;
    h += `<i class="${i === 0 ? 't' : ''}" title="${key(d)}: ${n} tasks" style="${n ? `background:#e0a93f;opacity:${(.25 + f * .75).toFixed(2)}` : ''}"></i>`;
  }
  $('heat').innerHTML = h;

  // progress by test area (today)
  $('areas').innerHTML = Object.keys(CATS).map(c => {
    const ts = tasks.filter(t => t.category === c);
    if (!ts.length) return '';
    const d = ts.filter(t => t.done).length;
    return `<div class="area"><div><span>${c}</span><span class="mini">${d}/${ts.length}</span></div>
      <div class="meter"><i style="width:${d / ts.length * 100}%;background:${CATS[c]}"></i></div></div>`;
  }).join('');

  // countdown
  if (user && user.ssb_date) {
    const d = Math.ceil((new Date(user.ssb_date) - new Date(today)) / 864e5);
    $('days').textContent = d >= 0 ? d : 0;
    $('exam').value = user.ssb_date;
  } else {
    $('days').textContent = '-';
  }
}

// ---------- events ----------
document.addEventListener('click', async e => {
  try {
    const tab = e.target.closest('.tab');
    if (tab) { filter = tab.dataset.c; render(); return; }

    const node = e.target.closest('.node');
    if (node) {
      const res = await api('/api/tasks/' + node.dataset.id + '/toggle', 'POST', { date: today });
      await loadData();
      if (res.done && tasks.every(t => t.done)) toast('Day complete. Well done, officer.');
      return;
    }

    const ed = e.target.closest('[data-edit]');
    if (ed) {
      const t = tasks.find(x => x.id == ed.dataset.edit);
      editingId = t.id; $('nText').value = t.title; $('nTime').value = t.task_time; $('nCat').value = t.category;
      $('addBtn').textContent = 'Save changes'; $('nText').focus(); toast('Editing task. Change it and press Save changes.');
      return;
    }

    const del = e.target.closest('[data-del]');
    if (del && confirm('Delete this task?')) {
      await api('/api/tasks/' + del.dataset.del, 'DELETE');
      await loadData();
      toast('Task deleted');
    }
  } catch (err) { if (err.message !== 'Not logged in') toast(err.message); }
});

async function addTask() {
  const title = $('nText').value.trim();
  if (!title) { toast('Enter a task first'); return; }
  try {
    const body = { title, category: $('nCat').value, task_time: $('nTime').value || '12:00' };
    const wasEditing = editingId !== null;
    if (wasEditing) await api('/api/tasks/' + editingId, 'PUT', body); else await api('/api/tasks', 'POST', body);
    editingId = null; $('addBtn').textContent = 'Add task';
    $('nText').value = '';
    await loadData();
    toast(wasEditing ? 'Task updated' : 'Task added');
  } catch (err) { toast(err.message); }
}
$('addBtn').onclick = addTask;
$('nText').onkeydown = e => { if (e.key === 'Enter') addTask(); };

$('exam').onchange = async e => {
  try {
    await api('/api/auth/ssb-date', 'POST', { ssb_date: e.target.value });
    user.ssb_date = e.target.value || null;
    render();
    toast('SSB date saved');
  } catch (err) { toast(err.message); }
};

$('logout').onclick = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  location.href = 'login.html';
};

// ---------- start ----------
async function start() {
  user = await api('/api/auth/me');
  if (user.is_admin) $('userName').insertAdjacentHTML('beforebegin', '<a class="navlink" href="admin.html">Admin</a>');
  const hr = new Date().getHours();
  $('userName').textContent = user.name + ' | ' + user.entry_type;
  $('greet').textContent = (hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening') + ', ' + user.name.split(' ')[0] + '.';
  $('date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  $('quote').textContent = QUOTES[new Date().getDate() % QUOTES.length];
  $('nCat').innerHTML = Object.keys(CATS).map(c => `<option>${c}</option>`).join('');
  await loadData();
}
start();


// ---------- achievement badges (worked out from your own data) ----------
function renderBadges() {
  const best = quiz.reduce((m, q) => Math.max(m, q.total ? q.score / q.total : 0), 0);
  const s = streak(), all = stats.totalDone;
  const perfect = tasks.length > 0 && tasks.every(t => t.done);
  const list = [
    ['First step', 'Complete your first task', all >= 1], ['50 tasks', 'Complete 50 tasks', all >= 50],
    ['100 tasks', 'Complete 100 tasks', all >= 100], ['3-day streak', 'Keep a 3-day streak', s >= 3],
    ['7-day streak', 'Keep a 7-day streak', s >= 7], ['Perfect day', 'Finish every task today', perfect],
    ['Quiz ace', 'Score 90% or more in an OIR quiz', best >= 0.9]
  ];
  $('badges').innerHTML = list.map(b => `<span class="badge ${b[2] ? 'on' : ''}" title="${b[1]}">${b[2] ? '&#9733;' : '&#9734;'} ${b[0]}</span>`).join('');
}
