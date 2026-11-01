// Builds the OLQ cards from js/olq.js and fades sections in as you scroll
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const factors = [...new Set(OLQ.map(o => o.factor))];
  document.getElementById('olqGrid').innerHTML = factors.map(f => `
    <div class="tgroup reveal">
      <div class="thead"><h3>${esc(f)}</h3><span class="when">${OLQ.filter(o => o.factor === f).length} qualities</span></div>
      <div class="tgrid">${OLQ.filter(o => o.factor === f).map(o =>
        `<article class="tcard"><h4>${esc(o.name)}</h4><p>${esc(o.meaning)}</p><small>Practise: ${esc(o.tip)}</small></article>`).join('')}
      </div>
    </div>`).join('');

  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(list => list.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: .12 });
  els.forEach(e => io.observe(e));
})();
