const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let editing = null, questions = [];

async function api(url, method = 'GET', body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 401) { location.href = 'login.html'; throw new Error('go'); }
  if (r.status === 403) { location.href = 'dashboard.html'; throw new Error('go'); }   // not an admin
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Something went wrong');
  return d;
}
$('logout').onclick = async () => { await fetch('/api/auth/logout', { method: 'POST' }); location.href = 'login.html'; };
function say(t, ok) { $('qMsg').textContent = t; $('qMsg').className = 'msg ' + (ok ? 'ok' : 'err'); }

async function load() {
  const [sum, qs, ms] = await Promise.all([api('/api/admin/summary'), api('/api/admin/questions'), api('/api/admin/messages')]);
  questions = qs;
  $('kpis').innerHTML = [[sum.aspirants, 'aspirants'], [sum.tasksDone, 'tasks completed'], [sum.quizzes, 'quizzes taken'], [sum.questions, 'questions'], [sum.messages, 'messages']]
    .map(k => `<div class="kpi"><b>${k[0]}</b><span>${k[1]}</span></div>`).join('');
  $('qRows').innerHTML = qs.map(q => `<tr><td>${q.id}</td><td>${esc(q.question)}</td>
    <td>${q.options.map((o, i) => `<span class="${i === q.correct ? 'hit' : ''}">${'ABCD'[i]}. ${esc(o)}</span>`).join(' &nbsp; ')}</td>
    <td class="nowrap"><button class="ghost" data-edit="${q.id}" type="button">Edit</button> <button class="ghost" data-del="${q.id}" type="button">Delete</button></td></tr>`).join('');
  $('mList').innerHTML = ms.length ? ms.map(m => `<div class="msgbox"><div><b>${esc(m.name)}</b> &lt;${esc(m.email)}&gt; <span class="mini">${esc(m.created_at)}</span>
    <p>${esc(m.message)}</p></div><button class="ghost" data-mdel="${m.id}" type="button">Delete</button></div>`).join('') : '<p class="empty-note">No messages yet.</p>';
}

function resetForm() {
  editing = null; $('qForm').reset(); $('formTitle').textContent = 'Add a quiz question';
  $('qSave').textContent = 'Add question'; $('qCancel').hidden = true;
}
$('qCancel').onclick = () => { resetForm(); say('', true); };

$('qForm').onsubmit = async e => {
  e.preventDefault();
  const body = { question: $('qText').value, options: [0, 1, 2, 3].map(i => $('o' + i).value), correct: Number($('qCorrect').value), explanation: $('qExp').value };
  try {
    if (editing) await api('/api/admin/questions/' + editing, 'PUT', body); else await api('/api/admin/questions', 'POST', body);
    say(editing ? 'Question updated' : 'Question added', true);
    resetForm(); await load();
  } catch (err) { say(err.message, false); }
};

document.addEventListener('click', async e => {
  try {
    const ed = e.target.closest('[data-edit]');
    if (ed) {
      const q = questions.find(x => x.id == ed.dataset.edit); editing = q.id;
      $('qText').value = q.question; q.options.forEach((o, i) => $('o' + i).value = o);
      $('qCorrect').value = q.correct; $('qExp').value = q.explanation || '';
      $('formTitle').textContent = 'Edit question ' + q.id; $('qSave').textContent = 'Save changes'; $('qCancel').hidden = false;
      $('qText').scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
    }
    const del = e.target.closest('[data-del]');
    if (del && confirm('Delete this question?')) { await api('/api/admin/questions/' + del.dataset.del, 'DELETE'); await load(); return; }
    const md = e.target.closest('[data-mdel]');
    if (md && confirm('Delete this message?')) { await api('/api/admin/messages/' + md.dataset.mdel, 'DELETE'); await load(); }
  } catch (err) { if (err.message !== 'go') say(err.message, false); }
});
load().catch(err => { if (err.message !== 'go') console.error(err); });
