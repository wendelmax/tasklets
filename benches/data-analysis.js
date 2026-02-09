const Benchmark = require('benchmark');
const tasklets = require('../lib/index');

console.log('=== Data Analysis Benchmark ===\n');

tasklets.configure({
    workers: 'auto',
    logging: 'off',
});

// Simulate statistical analysis on large dataset
function analyzeDataset(size) {
    const data = Array.from({ length: size }, () => Math.random() * 1000);

    // Calculate mean
    const mean = data.reduce((a, b) => a + b, 0) / data.length;

    // Calculate standard deviation
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    // Calculate median
    const sorted = [...data].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Calculate percentiles
    const p25 = sorted[Math.floor(sorted.length * 0.25)];
    const p75 = sorted[Math.floor(sorted.length * 0.75)];

    // Find outliers (values > 2 std devs from mean)
    const outliers = data.filter(val => Math.abs(val - mean) > 2 * stdDev);

    return {
        mean,
        median,
        stdDev,
        p25,
        p75,
        outlierCount: outliers.length
    };
}

const suite = new Benchmark.Suite();

const LARGE_DATASET = 500000;  // 500k points
const MEDIUM_DATASET = 250000; // 250k points

suite
    .add('Native: Analyze 1 dataset (500k points)', () => {
        analyzeDataset(LARGE_DATASET);
    })
    .add('Tasklets: Analyze 1 dataset (500k points)', {
        defer: true,
        fn: async (deferred) => {
            await tasklets.run(() => analyzeDataset(LARGE_DATASET));
            deferred.resolve();
        },
    })
    .add('Native: Analyze 8 datasets sequentially (250k points each)', () => {
        for (let i = 0; i < 8; i++) {
            analyzeDataset(MEDIUM_DATASET);
        }
    })
    .add('Tasklets: Analyze 8 datasets in parallel (250k points each)', {
        defer: true,
        fn: async (deferred) => {
            const tasks = Array(8).fill(null).map(() => () => analyzeDataset(MEDIUM_DATASET));
            await tasklets.runAll(tasks);
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
        const native8 = this[2];
        const tasklets8 = this[3];

        if (native1 && tasklets1) {
            const overhead = ((tasklets1.stats.mean - native1.stats.mean) / native1.stats.mean * 100);
            console.log(`Single dataset overhead: ${overhead.toFixed(2)}%`);
        }

        if (native8 && tasklets8) {
            const speedup = (native8.stats.mean / tasklets8.stats.mean);
            console.log(`Parallel speedup (8 datasets): ${speedup.toFixed(2)}x`);
            console.log(`Time saved: ${((1 - tasklets8.stats.mean / native8.stats.mean) * 100).toFixed(1)}%`);
            console.log(`\nFastest for parallel: ${tasklets8.hz > native8.hz ? 'Tasklets ✓' : 'Native'}`);
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
