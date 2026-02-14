const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const platform = process.platform;
const arch = process.arch;

const prebuildsPath = path.join(__dirname, '..', 'prebuilds', `${platform}-${arch}`, 'node.napi.node');

if (fs.existsSync(prebuildsPath)) {
    console.log(`[Tasklets] Prebuild found for ${platform}-${arch}, skipping compilation.`);
    process.exit(0);
}

console.log(`[Tasklets] No prebuild found for ${platform}-${arch}, compiling...`);

try {
    execSync('npx cmake-js compile', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
} catch (error) {
    console.error('[Tasklets] Compilation failed.');
    process.exit(1);
}
