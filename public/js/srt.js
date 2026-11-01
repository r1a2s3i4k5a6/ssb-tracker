// Situation Reaction Test drill: 30 seconds per situation, model approach shown at the end
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SITUATIONS = [
  {
    "s": "You are on your way to an exam and your bicycle gets a puncture.",
    "a": "I would leave the cycle at a nearby shop, take an auto or ask someone for a lift, and still reach the exam on time."
  },
  {
    "s": "You are alone near a pond and see a child drowning.",
    "a": "I would shout for help, throw a rope or a floating object, and jump in only if I can swim and rescue the child safely."
  },
  {
    "s": "Your friend meets with an accident on the road.",
    "a": "I would stop the traffic, give first aid, take him to the nearest hospital and inform his parents."
  },
  {
    "s": "You are the leader of a trek and one member twists an ankle.",
    "a": "I would give first aid, share his load among the team, and arrange safe support to continue slowly or return."
  },
  {
    "s": "In a group project, one member refuses to cooperate.",
    "a": "I would talk to him privately, understand his problem, and give him a role that suits him."
  },
  {
    "s": "You notice a fire in your neighbour's house at night.",
    "a": "I would raise an alarm, call the fire brigade, wake up the family and help everyone move out safely."
  },
  {
    "s": "Your train is delayed and you may miss an important interview.",
    "a": "I would inform the interviewer, find the fastest alternate transport and try to reach as early as possible."
  },
  {
    "s": "You find a wallet with money and an ID card on the street.",
    "a": "I would trace the owner from the ID card and return it, or hand it over at the nearest police station."
  },
  {
    "s": "You have been given a task with a very short deadline and too much work.",
    "a": "I would list priorities, divide the work among the team, put in extra hours and finish on time."
  },
  {
    "s": "Juniors in your hostel are making noise during study hours.",
    "a": "I would request them politely, explain the problem and set an example by following the rules myself."
  },
  {
    "s": "You lose your way during a night march.",
    "a": "I would stay calm, keep the group together, use the map, compass and landmarks, and go back to the last known point."
  },
  {
    "s": "Your friend asks you to help him cheat in an exam.",
    "a": "I would refuse politely, explain the risks to him, and offer to help him prepare properly."
  },
  {
    "s": "You are the captain and your team is losing badly at half time.",
    "a": "I would motivate the players, review the strategy, make the needed changes and encourage everyone to give their best."
  },
  {
    "s": "You see two people fighting in a market.",
    "a": "I would try to calm them down, call the police if it gets serious, and keep myself and others safe."
  },
  {
    "s": "A river floods and villagers need to cross to safety.",
    "a": "I would organise a human chain or boat, inform the authorities, and move children, women and the elderly first."
  },
  {
    "s": "Your friend is very upset after failing an exam.",
    "a": "I would spend time with him, listen, encourage him and help him prepare again."
  },
  {
    "s": "You cannot solve a problem given by your teacher.",
    "a": "I would try different methods first, and then discuss it with a classmate or the teacher."
  },
  {
    "s": "You see a pickpocket stealing from a passenger in a bus.",
    "a": "I would alert the passenger, take help from others to hold the thief and hand him over to the police."
  },
  {
    "s": "There is a power cut the night before your exam.",
    "a": "I would use a torch or an emergency light to keep studying, or go to a friend's house where there is light."
  },
  {
    "s": "You lead a cleaning drive and very few volunteers turn up.",
    "a": "I would start the work myself, motivate others by example and divide the tasks among those who are present."
  },
  {
    "s": "A heavy storm hits during your picnic.",
    "a": "I would move everyone to a safe building, keep away from trees and poles, and count the members of the group."
  },
  {
    "s": "Your senior gives an instruction that you think is wrong.",
    "a": "I would respectfully explain my view with reasons, and follow the final lawful decision."
  },
  {
    "s": "You promised to meet a friend but an urgent family need comes up.",
    "a": "I would inform my friend, apologise, fix another time and attend to the family need first."
  },
  {
    "s": "You are in a lift and it stops between floors.",
    "a": "I would stay calm, press the alarm button, call for help and reassure the others inside."
  }
];
  const SECONDS = 30;
  let list = [], idx = 0, left = SECONDS, tm = null, answers = [];

  function show(id) { ['srtSetup', 'srtRun', 'srtDone'].forEach(x => $(x).hidden = x !== id); }
  function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

  function paint() {
    $('srtTime').textContent = left;
    $('srtBar').style.width = (left / SECONDS * 100) + '%';
  }
  function showSituation() {
    left = SECONDS;
    $('srtCounter').textContent = 'Situation ' + (idx + 1) + ' of ' + list.length;
    $('srtText').textContent = list[idx].s;
    $('srtInput').value = '';
    $('srtInput').focus();
    paint();
    clearInterval(tm);
    tm = setInterval(() => { left--; paint(); if (left <= 0) advance(); }, 1000);
  }
  function advance() {
    answers.push($('srtInput').value.trim());
    idx++;
    if (idx >= list.length) finish(); else showSituation();
  }
  function finish() {
    clearInterval(tm);
    show('srtDone');
    $('srtReview').innerHTML = answers.map((a, i) =>
      '<li><b>' + esc(list[i].s) + '</b><br>Your reaction: ' + (a ? esc(a) : '<i>no answer</i>') +
      '<br><small>Model approach: ' + esc(list[i].a) + '</small></li>').join('');
  }
  function reset() { clearInterval(tm); show('srtSetup'); }

  $('srtStart').onclick = () => {
    list = shuffle(SITUATIONS).slice(0, parseInt($('srtCount').value, 10));
    idx = 0; answers = [];
    show('srtRun'); showSituation();
  };
  $('srtNextBtn').onclick = advance;
  $('srtInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); advance(); } });
  $('srtStop').onclick = () => { if (answers.length || $('srtInput').value.trim()) { answers.push($('srtInput').value.trim()); list = list.slice(0, answers.length); finish(); } else reset(); };
  $('srtAgain').onclick = reset;

  // show or hide this section together with the other tabs
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { reset(); $('srtBox').hidden = t.dataset.m !== 'srt'; }));
})();
