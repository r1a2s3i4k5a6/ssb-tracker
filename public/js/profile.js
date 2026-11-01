const $ = id => document.getElementById(id);
$('logout').onclick = async () => { await fetch('/api/auth/logout', { method: 'POST' }); location.href = 'login.html'; };

async function post(url, data) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (r.status === 401 && url.endsWith('/profile')) { location.href = 'login.html'; }
  const b = await r.json();
  if (!r.ok) throw new Error(b.error || 'Something went wrong');
  return b;
}
function say(el, text, ok) { el.textContent = text; el.className = 'msg ' + (ok ? 'ok' : 'err'); }

fetch('/api/auth/me').then(r => r.ok ? r.json() : (location.href = 'login.html')).then(u => {
  if (!u) return;
  $('email').textContent = 'Signed in as ' + u.email;
  $('pName').value = u.name; $('pEntry').value = u.entry_type; $('pDate').value = u.ssb_date || '';
});

$('pForm').onsubmit = async e => {
  e.preventDefault();
  try { say($('pMsg'), (await post('/api/auth/profile', { name: $('pName').value, entry_type: $('pEntry').value, ssb_date: $('pDate').value })).message, true); }
  catch (err) { say($('pMsg'), err.message, false); }
};

$('wForm').onsubmit = async e => {
  e.preventDefault();
  if ($('wNew').value !== $('wNew2').value) return say($('wMsg'), 'The two new passwords do not match', false);
  try {
    say($('wMsg'), (await post('/api/auth/password', { current: $('wCur').value, next: $('wNew').value })).message, true);
    $('wForm').reset();
  } catch (err) { say($('wMsg'), err.message, false); }
};
