const fs = require('fs').promises;
const path = require('path');

const files = [];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const res = path.join(dir, e.name);
    if (e.isDirectory()) await walk(res);
    else if (e.isFile() && /^README\.md$/i.test(e.name)) files.push(res);
  }
}

(async () => {
  const root = path.resolve(__dirname, '..');
  await walk(root);
  const changed = [];
  for (const f of files) {
    let s = await fs.readFile(f, 'utf8');
    const orig = s;
    s = s.replace(/\r\n/g, '\n');
    s = s.split('\n').map(l => l.replace(/\s+$/, '')).join('\n');
    s = s.replace(/\n{3,}/g, '\n\n');
    if (!s.endsWith('\n')) s += '\n';
    if (s !== orig) {
      await fs.writeFile(f, s, 'utf8');
      changed.push(f);
    }
  }
  console.log('Formatted', changed.length, 'README.md files');
  if (changed.length) changed.forEach(f => console.log('  ', f));
})();
