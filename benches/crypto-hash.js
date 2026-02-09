const Benchmark = require('benchmark');
const tasklets = require('../lib/index');

console.log('=== Cryptographic Hash Benchmark ===\n');

tasklets.configure({
    workers: 'auto',
    logging: 'off',
});

// Simple hash function (SHA-256-like simulation)
function computeHash(data, iterations = 10000) {
    let hash = 0;

    for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
            hash = Math.abs(hash);
        }
        // Additional rounds
        hash = ((hash * 1103515245) + 12345) & 0x7fffffff;
    }

    return hash.toString(16).padStart(8, '0');
}

// Generate random data
function generateData(size) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < size; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const testData = generateData(1000);
const HEAVY_ITERATIONS = 50000;  // 50k iterations for heavy work
const MEDIUM_ITERATIONS = 25000; // 25k iterations

const suite = new Benchmark.Suite();

suite
    .add('Native: Hash 1 string (50k iterations)', () => {
        computeHash(testData, HEAVY_ITERATIONS);
    })
    .add('Tasklets: Hash 1 string (50k iterations)', {
        defer: true,
        fn: async (deferred) => {
            await tasklets.run(() => computeHash(testData, HEAVY_ITERATIONS));
            deferred.resolve();
        },
    })
    .add('Native: Hash 6 strings sequentially (25k iterations each)', () => {
        for (let i = 0; i < 6; i++) {
            computeHash(testData, MEDIUM_ITERATIONS);
        }
    })
    .add('Tasklets: Hash 6 strings in parallel (25k iterations each)', {
        defer: true,
        fn: async (deferred) => {
            await tasklets.runAll([
                () => computeHash(testData, MEDIUM_ITERATIONS),
                () => computeHash(testData, MEDIUM_ITERATIONS),
                () => computeHash(testData, MEDIUM_ITERATIONS),
                () => computeHash(testData, MEDIUM_ITERATIONS),
                () => computeHash(testData, MEDIUM_ITERATIONS),
                () => computeHash(testData, MEDIUM_ITERATIONS)
            ]);
            deferred.resolve();
        },
    })
    .on('cycle', (event) => {
        console.log(String(event.target));
    })
    .on('complete', function () {
        console.log('\n--- Results ---');

        const native1 = this[0];
        const tasklets1 = this[1];
        const native6 = this[2];
        const tasklets6 = this[3];

        if (native1 && tasklets1) {
            const overhead = ((tasklets1.stats.mean - native1.stats.mean) / native1.stats.mean * 100);
            console.log(`Single hash overhead: ${overhead.toFixed(2)}%`);
        }

        if (native6 && tasklets6) {
            const speedup = (native6.stats.mean / tasklets6.stats.mean);
            console.log(`Parallel speedup (6 hashes): ${speedup.toFixed(2)}x`);
            console.log(`Time saved: ${((1 - tasklets6.stats.mean / native6.stats.mean) * 100).toFixed(1)}%`);
            console.log(`\nFastest for parallel: ${tasklets6.hz > native6.hz ? 'Tasklets ✓' : 'Native'}`);
        }

        tasklets.shutdown().then(() => {
            process.exit(0);
        });
    })
    .on('error', (event) => {
        console.error('Benchmark error:', event.target.error);
        tasklets.shutdown().then(() => {
            process.exit(1);
        });
    })
    .run({ async: true });
