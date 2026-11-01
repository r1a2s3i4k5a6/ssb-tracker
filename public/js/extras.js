// Extra dashboard cards: OLQ of the day and recent quiz scores
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // a new quality every day (same one for the whole day)
  const o = OLQ[Math.floor(Date.now() / 86400000) % OLQ.length];
  document.getElementById('olqName').textContent = o.name;
  document.getElementById('olqMeaning').textContent = o.meaning;
  document.getElementById('olqTip').textContent = 'Practise it today: ' + o.tip;

  fetch('/api/quiz/history').then(r => r.ok ? r.json() : []).then(rows => {
    const ul = document.getElementById('quizHist');
    if (!rows.length) { ul.innerHTML = '<li class="none">No quiz taken yet. Try your first one!</li>'; return; }
    ul.innerHTML = rows.slice(0, 5).map(r => {
      const pct = Math.round(r.score / r.total * 100);
      return '<li><span>' + esc(String(r.taken_at).slice(0, 10)) + '</span><b>' + r.score + '/' + r.total +
             '</b><div class="bar"><i style="width:' + pct + '%"></i></div></li>';
    }).join('');
  }).catch(() => {});
})();
