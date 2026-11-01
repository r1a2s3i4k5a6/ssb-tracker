// 1) If the aspirant is already logged in, change the buttons to "Dashboard"
fetch('/api/auth/me').then(res => {
  if (!res.ok) return;
  document.getElementById('navCta').textContent = 'Dashboard';
  document.getElementById('navCta').href = 'dashboard.html';
  document.getElementById('heroCta').textContent = 'Open your dashboard';
  document.getElementById('heroCta').href = 'dashboard.html';
}).catch(() => {});

// 2) Reveal sections as you scroll down
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 3) * 0.08 + 's';   // small stagger
  io.observe(el);
});

// 3) Count up the numbers in the hero
document.querySelectorAll('[data-count]').forEach(el => {
  const end = Number(el.dataset.count);
  let n = 0;
  const timer = setInterval(() => {
    n++;
    el.textContent = n;
    if (n >= end) clearInterval(timer);
  }, 180);
});

// 4) The 15 OLQ chips come from js/olq.js
const chips = document.getElementById('olqChips');
if (chips && typeof OLQ !== 'undefined') {
  chips.innerHTML = OLQ.map(o => '<a class="olqchip" href="guide.html#olq" title="' + o.meaning.replace(/"/g, '&quot;') + '">' + o.name + '</a>').join('');
}
