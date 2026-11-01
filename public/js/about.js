const $ = id => document.getElementById(id);
const rules = {
  cName:  [v => v.trim().length >= 2, 'Please enter your name (at least 2 letters)', 'eName'],
  cEmail: [v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), 'Please enter a valid email address', 'eEmail'],
  cMsg:   [v => v.trim().length >= 10, 'Your message needs at least 10 characters', 'eMsg']
};
function check(id) {
  const [ok, text, err] = rules[id];
  const good = ok($(id).value);
  $(err).textContent = good ? '' : text;
  $(id).style.borderColor = good ? '' : 'var(--crim)';
  return good;
}
Object.keys(rules).forEach(id => $(id).addEventListener('blur', () => check(id)));
$('cMsg').addEventListener('input', () => { $('cCount').textContent = $('cMsg').value.length + ' / 1000'; });

$('cForm').onsubmit = async e => {
  e.preventDefault();
  const valid = Object.keys(rules).map(check).every(Boolean);     // check all three fields
  if (!valid) return;
  try {
    const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: $('cName').value, email: $('cEmail').value, message: $('cMsg').value }) });
    const b = await r.json();
    if (!r.ok) throw new Error(b.error || 'Could not send');
    $('cStatus').textContent = b.message; $('cStatus').className = 'msg ok';
    $('cForm').reset(); $('cCount').textContent = '0 / 1000';
  } catch (err) { $('cStatus').textContent = err.message; $('cStatus').className = 'msg err'; }
};
