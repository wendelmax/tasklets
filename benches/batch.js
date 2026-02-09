const Benchmark = require('benchmark');
const tasklets = require('../lib/index');

const suite = new Benchmark.Suite('batch()');

// Função de Fibonacci para simular uma tarefa que consome CPU
function fibonacci(n) {
    if (n < 2) return n;
    return fibonacci(n - 2) + fibonacci(n - 1);
}

const simpleBatch = Array(50).fill(null).map((_, i) => ({
    name: `simple-${i}`,
    task: () => 1 + 1,
}));

const cpuBatch = Array(20).fill(null).map((_, i) => ({
    name: `cpu-${i}`,
    task: () => fibonacci(18),
}));


console.log('--- Preparando benchmarks para tasklets.batch() ---');

tasklets.configure({
    workers: 'auto',
    logging: 'off',
});

suite
    .add('batch(50 simple tasks)', {
        defer: true,
        fn: async (deferred) => {
            await tasklets.batch(simpleBatch);
            deferred.resolve();
        },
    })
    .add('batch(20 cpu intensive tasks)', {
        defer: true,
        fn: async (deferred) => {
            await tasklets.batch(cpuBatch);
            deferred.resolve();
        },
    })
    .on('cycle', (event) => {
        console.log(String(event.target));
    })
    .on('complete', function () {
        console.log(`\nFastest is ${this.filter('fastest').map('name')}`);
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
