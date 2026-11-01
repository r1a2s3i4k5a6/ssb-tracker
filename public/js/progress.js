const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const CATS = { 'Screening': '#6f9bc4', 'Psychology': '#e0a93f', 'GTO': '#86ad71', 'Interview': '#c9615a', 'Fitness': '#5fb3a6', 'Current Affairs': '#9aa6b8' };

async function api(url) {
  const r = await fetch(url);
  if (r.status === 401) { location.href = 'login.html'; throw new Error('login'); }
  return r.json();
}
$('logout').onclick = async () => { await fetch('/api/auth/logout', { method: 'POST' }); location.href = 'login.html'; };
$('print').onclick = () => window.print();

async function start() {
  const since = new Date(); since.setDate(since.getDate() - 29);
  const [stats, rep, quiz] = await Promise.all([api('/api/tasks/stats'), api('/api/tasks/report?since=' + key(since)), api('/api/quiz/history')]);
  const total = stats.totalTasks;

  // the last 30 days, oldest first
  const days = [];
  for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push({ d, n: stats.byDay[key(d)] || 0 }); }
  const done30 = days.reduce((s, x) => s + x.n, 0);
  const active = days.filter(x => x.n > 0).length;
  const rate = total ? Math.round(done30 / (total * 30) * 100) : 0;
  const best = days.reduce((m, x) => Math.max(m, x.n), 0);
  $('range').textContent = key(since) + ' to ' + key(new Date());

  $('kpis').innerHTML = [[done30, 'tasks completed'], [active + ' / 30', 'active days'], [rate + '%', 'of planned tasks done'], [best, 'best day']]
    .map(k => `<div class="kpi"><b>${k[0]}</b><span>${k[1]}</span></div>`).join('');

  // bar chart (drawn as SVG)
  const W = 600, H = 170, bw = W / 30, max = Math.max(total, best, 1);
  let bars = '';
  days.forEach((x, i) => {
    const h = x.n / max * 130;
    bars += `<rect x="${i * bw + 3}" y="${145 - h}" width="${bw - 6}" height="${Math.max(h, 2)}" rx="2" fill="${x.n ? '#e0a93f' : '#26374f'}"><title>${key(x.d)}: ${x.n} tasks</title></rect>`;
    if (i % 5 === 0) bars += `<text x="${i * bw + bw / 2}" y="162" text-anchor="middle">${x.d.getDate()}/${x.d.getMonth() + 1}</text>`;
  });
  $('barChart').innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tasks completed per day">${bars}</svg>`;

  // per test area
  $('areas').innerHTML = rep.length ? rep.map(r => {
    const pct = r.tasks ? Math.round(r.done / (r.tasks * 30) * 100) : 0;
    return `<div class="area"><div><span>${r.category}</span><span class="mini">${pct}%</span></div>
      <div class="meter"><i style="width:${pct}%;background:${CATS[r.category] || '#888'}"></i></div></div>`;
  }).join('') : '<p class="empty-note">No tasks yet.</p>';

  // quiz trend (line chart, oldest to newest)
  const q = quiz.slice().reverse().map(x => Math.round(x.score / x.total * 100));
  if (q.length < 2) {
    $('quizChart').innerHTML = '<p class="empty-note">Take at least 2 OIR quizzes in the Practice room to see your trend.</p>';
  } else {
    const step = 560 / (q.length - 1);
    const pts = q.map((v, i) => `${20 + i * step},${130 - v * 1.1}`);
    $('quizChart').innerHTML = `<svg class="chart" viewBox="0 0 600 160" role="img" aria-label="Quiz score trend">
      <line x1="20" y1="20" x2="580" y2="20" stroke="#26374f"/><line x1="20" y1="130" x2="580" y2="130" stroke="#26374f"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="#e0a93f" stroke-width="3" stroke-linejoin="round"/>
      ${q.map((v, i) => `<circle cx="${20 + i * step}" cy="${130 - v * 1.1}" r="4" fill="#e0a93f"><title>${v}%</title></circle>
      <text x="${20 + i * step}" y="${122 - v * 1.1}" text-anchor="middle">${v}%</text>`).join('')}</svg>`;
  }
}
start().catch(e => { if (e.message !== 'login') console.error(e); });
