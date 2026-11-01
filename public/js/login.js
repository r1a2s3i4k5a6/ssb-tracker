const $ = id => document.getElementById(id);
const msg = $('msg');

function showMessage(text, ok = false) {
  msg.textContent = text;
  msg.className = 'msg ' + (ok ? 'ok' : 'err');
}

// Switch between "Sign in" and "Create account"
document.querySelectorAll('.switch button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.switch button').forEach(b => b.classList.toggle('on', b === btn));
    $('loginForm').hidden = btn.dataset.t !== 'login';
    $('registerForm').hidden = btn.dataset.t !== 'register';
    showMessage('');
  });
});

// Send data to the server and return its answer
async function postJSON(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Something went wrong');
  return body;
}

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await postJSON('/api/auth/login', { email: $('lEmail').value, password: $('lPass').value });
    showMessage('Signed in. Opening your dashboard...', true);
    location.href = 'dashboard.html';
  } catch (err) { showMessage(err.message); }
});

$('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await postJSON('/api/auth/register', {
      name: $('rName').value,
      email: $('rEmail').value,
      password: $('rPass').value,
      entry_type: $('rEntry').value,
      ssb_date: $('rDate').value
    });
    showMessage('Account created. Opening your dashboard...', true);
    location.href = 'dashboard.html';
  } catch (err) { showMessage(err.message); }
});

// One-click demo account (created automatically on the first run of the server)
document.getElementById('demoBtn').addEventListener('click', () => {
  document.querySelector('.switch button[data-t="login"]').click();
  $('lEmail').value = 'demo@ssb.com';
  $('lPass').value = 'demo123';
  $('loginForm').requestSubmit();
});
