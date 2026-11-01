const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

$('logout').onclick = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  location.href = 'login.html';
};

async function load() {
  const res = await fetch('/api/leaderboard');
  if (res.status === 401) { location.href = 'login.html'; return; }
  const data = await res.json();
  const top = data.top;
  const max = Math.max(1, ...top.map(r => r.done));

  $('total').textContent = data.total + ' registered';
  $('mypos').innerHTML = data.mine
    ? `<span>Your position</span><b>#${data.mine.position}</b><span>of ${data.total} &middot; ${data.mine.done} tasks done</span>`
    : '';

  // podium: first, second, third
  $('podium').innerHTML = top.slice(0, 3).map((r, i) => `
    <article class="pod p${i + 1} ${r.me ? 'me' : ''}">
      <div class="medal">${i + 1}</div>
      <h3>${esc(r.name)}</h3>
      <small>${esc(r.entry_type)} aspirant</small>
      <div class="big">${r.done}<span>tasks done</span></div>
      <small>Best OIR score: ${r.attempts ? r.best_quiz + '%' : 'no attempt yet'}</small>
    </article>`).join('');

  // full list
  $('board').innerHTML = top.map(r => `
    <li class="entryrow ${r.me ? 'me' : ''}">
      <span class="pos">${r.position}</span>
      <div class="nm"><b>${esc(r.name)}${r.me ? '<span class="youtag">You</span>' : ''}</b>
        <span>${esc(r.entry_type)}</span>
        <div class="bar"><i style="width:${r.done / max * 100}%"></i></div></div>
      <div class="sc quiz"><b>${r.attempts ? r.best_quiz + '%' : '-'}</b>best OIR</div>
      <div class="sc"><b>${r.done}</b>tasks done</div>
    </li>`).join('');
}
load();
