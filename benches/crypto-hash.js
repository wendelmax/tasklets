const Benchmark = require('benchmark');
const tasklets = require('../lib/index');

console.log('=== Cryptographic Hash Benchmark ===\n');

tasklets.configure({
    workers: 'auto',
    logging: 'off',
});

// Helper available in main thread for native bench
function computeHash(data, iterations = 10000) {
    let hash = 0;
    for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
            hash = Math.abs(hash);
        }
        hash = ((hash * 1103515245) + 12345) & 0x7fffffff;
    }
    return hash.toString(16).padStart(8, '0');
}

function generateData(size) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < size; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const testData = generateData(1000);
const HEAVY_ITERATIONS = 50000;
const MEDIUM_ITERATIONS = 15000;

const suite = new Benchmark.Suite();

suite
    .add('Native: Hash 1 string', () => {
        computeHash(testData, HEAVY_ITERATIONS);
    })
    .add('Tasklets: Hash 1 string', {
        defer: true,
        fn: async (deferred) => {
            // Self-contained task function
            await tasklets.run((data, iter) => {
                let hash = 0;
                for (let j = 0; j < iter; j++) {
                    for (let i = 0; i < data.length; i++) {
                        const char = data.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash;
                        hash = Math.abs(hash);
                    }
                    hash = ((hash * 1103515245) + 12345) & 0x7fffffff;
                }
                return hash.toString(16).padStart(8, '0');
            }, testData, HEAVY_ITERATIONS);
            deferred.resolve();
        },
    })
    .on('cycle', (event) => {
        console.log(String(event.target));
    })
    .on('complete', function () {
        console.log('\n--- Results ---');
        tasklets.shutdown().then(() => {
            process.exit(0);
        });
    })
    .run({ async: true });
