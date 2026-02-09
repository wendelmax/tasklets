const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const examplesDir = path.join(__dirname, '..', 'docs', 'examples');
const files = fs.readdirSync(examplesDir).filter((f) => f.endsWith('.js')).sort();

const single = process.argv[2];
const list = single ? [single] : files;

let failed = 0;
for (const file of list) {
  const filePath = path.join(examplesDir, file);
  console.log('\n---', file, '---');
  const r = spawnSync(process.execPath, [filePath], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  if (r.status !== 0) failed++;
}

if (list.length > 1) {
  console.log('\nDone:', list.length - failed, 'ok,', failed, 'failed');
}
process.exit(failed ? 1 : 0);
