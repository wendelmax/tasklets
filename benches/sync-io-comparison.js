const Benchmark = require('benchmark');
const fs = require('fs');
const path = require('path');
const os = require('os');
const tasklets = require('../lib/index');

const HELPER = path.join(__dirname, '_bench-io-helper.cjs');
const TEST_FILE = path.join(os.tmpdir(), `tasklets-bench-io-${process.pid}.dat`);
const FILE_SIZE = 1024 * 512; // 512KB

// Generate test data and write temp file
const testData = Buffer.alloc(FILE_SIZE, 0x41);
fs.writeFileSync(TEST_FILE, testData);

tasklets.configure({ logging: 'none' });
tasklets.setWorkloadType('io');

console.log('=== Sync I/O Offloading Benchmark ===\n');
console.log('Test file: %s (%d bytes)\n', TEST_FILE, FILE_SIZE);

const suite = new Benchmark.Suite();

suite
  .add('fs.readFileSync (main thread, blocks event loop)', () => {
    fs.readFileSync(TEST_FILE);
  })
  .add('Tasklets: readFileSync offloaded via MODULE:', {
    defer: true,
    fn: async (deferred) => {
      await tasklets.run('MODULE:' + HELPER, TEST_FILE);
      deferred.resolve();
    },
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function () {
    try { fs.unlinkSync(TEST_FILE); } catch (e) {}
    // Registered for cleanup on exit as well
    console.log('\n--- Results ---');
    console.log('Fastest is ' + this.filter('fastest').map('name'));
    tasklets.shutdown().then(function () {
      process.exit(0);
    });
  })
  .run({ async: true });
