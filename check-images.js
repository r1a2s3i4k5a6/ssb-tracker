// Run with:  node check-images.js
// Lists every picture the website expects and tells you what is missing or too big.
const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, 'public', 'images', 'photos');

const wanted = [
  ['hero', 400, 'landing page top banner'],
  ['banner', 300, 'dashboard, practice, guide and leaderboard headers'],
  ['login', 300, 'sign-in page, left side'],
  ['discipline', 150, 'landing card'], ['teamwork', 150, 'landing card'], ['leadership', 150, 'landing card'],
  ['gallery1', 250, 'landing gallery (big one)'], ['gallery2', 150, 'landing gallery'], ['gallery3', 150, 'landing gallery'],
  ['gallery4', 150, 'landing gallery'], ['gallery5', 150, 'landing gallery'], ['gallery6', 150, 'landing gallery']
];

const files = fs.existsSync(folder) ? fs.readdirSync(folder) : [];
let found = 0;
console.log('\nChecking ' + folder + '\n');
wanted.forEach(([name, maxKB, where]) => {
  const jpg = files.find(f => f === name + '.jpg');
  const other = files.find(f => f.toLowerCase().startsWith(name.toLowerCase() + '.') && f !== name + '.jpg');
  if (jpg) {
    const kb = Math.round(fs.statSync(path.join(folder, jpg)).size / 1024);
    found++;
    console.log((kb > maxKB ? 'BIG     ' : 'OK      ') + jpg.padEnd(16) + String(kb).padStart(5) + ' KB  (limit ' + maxKB + ')  ' + where);
  } else if (other) {
    console.log('WRONG   ' + other.padEnd(16) + '  should be named exactly ' + name + '.jpg');
  } else {
    console.log('MISSING ' + (name + '.jpg').padEnd(16) + '  ' + where + ' (the drawn picture is shown instead)');
  }
});
console.log('\n' + found + ' of ' + wanted.length + ' pictures found.');
console.log('OK = good, BIG = works but shrink it at squoosh.app, WRONG = rename it, MISSING = add it.\n');
