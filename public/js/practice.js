const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

// Only logged-in aspirants can use this page
fetch('/api/auth/me').then(r => { if (!r.ok) location.href = 'login.html'; });
$('logout').onclick = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  location.href = 'login.html';
};

const WORDS = ['Friend', 'Duty', 'Fear', 'Mother', 'Team', 'Win', 'Danger', 'Courage', 'Failure', 'Leader',
  'Help', 'Home', 'Money', 'Enemy', 'Success', 'Work', 'Order', 'Brave', 'Risk', 'Study',
  'Sports', 'Fire', 'Army', 'Discipline', 'Honest', 'Anger', 'Crowd', 'Father', 'Hope', 'Trust',
  'Fight', 'Responsibility', 'Weak', 'Strong', 'Plan', 'Time', 'Defeat', 'Pride', 'Country', 'Future'];

const CIRC = 2 * Math.PI * 54;     // length of the ring
let timer = null, audio = null;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function beep() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.connect(g); g.connect(audio.destination);
    o.frequency.value = 660; g.gain.value = 0.08;
    o.start(); o.stop(audio.currentTime + 0.18);
  } catch (e) { /* sound is optional */ }
}

function setRing(el, left, total) {
  if (left === total) {            // new countdown: refill instantly
    el.style.transition = 'none';
    el.style.strokeDashoffset = 0;
    el.getBoundingClientRect();
    el.style.transition = '';
  } else {
    el.style.strokeDashoffset = CIRC * (1 - left / total);
  }
}

// Count down from `seconds`; call onTick every second and onEnd at zero
function runTimer(seconds, onTick, onEnd) {
  clearInterval(timer);
  let left = seconds;
  onTick(left);
  timer = setInterval(() => {
    left--;
    onTick(left);
    if (left <= 0) { clearInterval(timer); onEnd(); }
  }, 1000);
}

// ---------- switching between WAT, TAT and OIR ----------
function resetWat() { $('watSetup').hidden = false; $('watRun').hidden = true; $('watDone').hidden = true; }
function resetTat() { $('tatSetup').hidden = false; $('tatRun').hidden = true; $('tatDone').hidden = true; }
function resetOir() { $('oirSetup').hidden = false; $('oirRun').hidden = true; $('oirDone').hidden = true; loadHistory(); }

document.querySelectorAll('.tab').forEach(t => {
  t.onclick = () => {
    clearInterval(timer); resetWat(); resetTat(); resetOir();
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b === t));
    $('watBox').hidden = t.dataset.m !== 'wat';
    $('tatBox').hidden = t.dataset.m !== 'tat';
    $('oirBox').hidden = t.dataset.m !== 'oir';
  };
});

// ================= WAT =================
const wat = { words: [], i: 0, answers: [] };

$('watStart').onclick = () => {
  wat.words = shuffle([...WORDS]).slice(0, Number($('watCount').value));
  wat.i = 0; wat.answers = [];
  $('watSetup').hidden = true; $('watDone').hidden = true; $('watRun').hidden = false;
  watShow();
};

function watShow() {
  if (wat.i >= wat.words.length) return watFinish();
  const w = $('watWord');
  w.textContent = wat.words[wat.i];
  w.style.animation = 'none'; w.offsetWidth; w.style.animation = '';   // replay the pop effect
  $('watCounter').textContent = 'Word ' + (wat.i + 1) + ' of ' + wat.words.length;
  $('watInput').value = ''; $('watInput').focus();
  runTimer(15,
    left => { $('watTime').textContent = left; setRing($('watArc'), left, 15); },
    () => { beep(); watAdvance(); });
}

function watAdvance() {
  wat.answers.push([wat.words[wat.i], $('watInput').value.trim()]);
  wat.i++;
  watShow();
}

function watFinish() {
  clearInterval(timer);
  $('watRun').hidden = true; $('watDone').hidden = false;
  $('watReview').innerHTML = wat.answers.map(a =>
    `<li><b>${esc(a[0])}</b> &mdash; ${a[1] ? esc(a[1]) : '<em>no response</em>'}</li>`).join('');
}

$('watInput').onkeydown = e => { if (e.key === 'Enter') watAdvance(); };
$('watNextBtn').onclick = watAdvance;
$('watStop').onclick = () => { clearInterval(timer); resetWat(); };
$('watAgain').onclick = resetWat;

// ================= TAT =================
const tat = { pics: [], list: [], i: 0, stories: [] };

$('tatFiles').onchange = e => {
  tat.pics = [...e.target.files].map(f => URL.createObjectURL(f));
  $('tatInfo').textContent = tat.pics.length
    ? tat.pics.length + ' picture(s) chosen.'
    : 'No pictures chosen: you will get one blank slide to imagine your own scene.';
};

$('tatStart').onclick = () => {
  tat.list = tat.pics.length ? [...tat.pics] : [null];   // null = blank slide
  tat.i = 0; tat.stories = [];
  $('tatSetup').hidden = true; $('tatDone').hidden = true; $('tatRun').hidden = false;
  tatView();
};

function tatView() {                       // phase 1: look at the picture (30 s)
  $('tatCounter').textContent = 'Slide ' + (tat.i + 1) + ' of ' + tat.list.length;
  $('tatPhase').textContent = 'Observe';
  const src = tat.list[tat.i];
  $('tatPic').innerHTML = src ? `<img src="${src}" alt="Test picture">` : '<p>Blank slide. Imagine your own scene.</p>';
  $('tatText').value = ''; $('tatText').disabled = true; $('tatDoneBtn').disabled = true;
  runTimer(30,
    left => { $('tatTime').textContent = fmt(left); setRing($('tatArc'), left, 30); },
    () => { beep(); tatWrite(); });
}

function tatWrite() {                      // phase 2: write the story (4 min)
  $('tatPhase').textContent = 'Write your story';
  $('tatPic').innerHTML = '<p>The picture is hidden. Write your story now.</p>';
  $('tatText').disabled = false; $('tatText').focus(); $('tatDoneBtn').disabled = false;
  runTimer(240,
    left => { $('tatTime').textContent = fmt(left); setRing($('tatArc'), left, 240); },
    () => { beep(); tatSave(); });
}

function tatSave() {
  clearInterval(timer);
  tat.stories.push($('tatText').value.trim());
  tat.i++;
  if (tat.i < tat.list.length) tatView(); else tatFinish();
}

function tatFinish() {
  $('tatRun').hidden = true; $('tatDone').hidden = false;
  $('tatReview').innerHTML = tat.stories.map((s, i) => {
    const words = s ? s.split(/\s+/).length : 0;
    return `<li><b>Slide ${i + 1}</b> (${words} words)<br>${s ? esc(s) : '<em>No story written</em>'}</li>`;
  }).join('');
}

$('tatDoneBtn').onclick = tatSave;
$('tatStop').onclick = () => { clearInterval(timer); resetTat(); };
$('tatAgain').onclick = resetTat;

// ================= OIR QUIZ (questions and scores live in the database) =================
const oir = { qs: [], i: 0, answers: [], choice: -1 };

async function loadHistory() {
  try {
    const res = await fetch('/api/quiz/history');
    if (!res.ok) return;
    const rows = await res.json();
    $('oirHist').innerHTML = rows.length
      ? rows.map(r => `<li><b>${r.score} / ${r.total}</b> &nbsp; ${new Date(r.taken_at.replace(' ', 'T') + 'Z').toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</li>`).join('')
      : '<li>No attempts yet. Take your first quiz.</li>';
  } catch (e) { /* history is optional */ }
}

$('oirStart').onclick = async () => {
  const res = await fetch('/api/quiz/questions?count=' + $('oirCount').value);
  if (!res.ok) { alert('Could not load questions. Please log in again.'); return; }
  oir.qs = await res.json(); oir.i = 0; oir.answers = [];
  $('oirSetup').hidden = true; $('oirDone').hidden = true; $('oirRun').hidden = false;
  oirShow();
};

function oirShow() {
  const q = oir.qs[oir.i];
  oir.choice = -1;
  $('oirCounter').textContent = 'Question ' + (oir.i + 1) + ' of ' + oir.qs.length;
  $('oirQ').textContent = q.question;
  $('oirOpts').innerHTML = q.options.map((o, i) =>
    `<button type="button" class="opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${esc(o)}</button>`).join('');
  $('oirNext').textContent = oir.i === oir.qs.length - 1 ? 'Finish' : 'Next';
  $('oirNext').disabled = true;
}

$('oirOpts').onclick = e => {
  const b = e.target.closest('.opt');
  if (!b) return;
  oir.choice = Number(b.dataset.i);
  document.querySelectorAll('.opt').forEach(x => x.classList.toggle('sel', x === b));
  $('oirNext').disabled = false;
};

$('oirNext').onclick = async () => {
  oir.answers.push({ id: oir.qs[oir.i].id, choice: oir.choice });
  oir.i++;
  if (oir.i < oir.qs.length) return oirShow();

  // all answered: the server marks them and saves the score
  const res = await fetch('/api/quiz/submit', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers: oir.answers })
  });
  const data = await res.json();
  if (!res.ok) { alert(data.error || 'Could not save your score'); return resetOir(); }

  $('oirRun').hidden = true; $('oirDone').hidden = false;
  $('oirScore').textContent = data.score; $('oirTotal').textContent = data.total;
  const pct = data.score / data.total;
  $('oirMsg').textContent = pct >= 0.8 ? 'Excellent. Keep this accuracy under time pressure.'
    : pct >= 0.5 ? 'Good start. Review the explanations below and try again.'
    : 'Keep practising. Read each explanation carefully.';
  $('oirReview').innerHTML = data.review.map((r, n) => {
    const ok = r.chosen === r.correct;
    return `<div class="qrev"><b>${n + 1}. ${esc(r.question)}</b>
      <p class="${ok ? 'good' : 'bad'}">Your answer: ${r.chosen >= 0 ? esc(r.options[r.chosen]) : 'not answered'} ${ok ? '(correct)' : ''}</p>
      ${ok ? '' : `<p class="good">Correct answer: ${esc(r.options[r.correct])}</p>`}
      <p class="mini">${esc(r.explanation || '')}</p></div>`;
  }).join('');
};

$('oirQuit').onclick = resetOir;
$('oirAgain').onclick = resetOir;
loadHistory();
