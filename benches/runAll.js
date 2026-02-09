const Benchmark = require('benchmark');
const tasklets = require('../lib/index');

const suite = new Benchmark.Suite('runAll()');

// Função de Fibonacci para simular uma tarefa que consome CPU
function fibonacci(n) {
    if (n < 2) return n;
    return fibonacci(n - 2) + fibonacci(n - 1);
}

const simpleTasks = Array(10).fill(() => 1 + 1);
const cpuTasks = Array(10).fill(() => fibonacci(15));

console.log('--- Preparando benchmarks para tasklets.runAll() ---');

tasklets.configure({
    workers: 'auto',
    logging: 'off',
});

suite
    .add('runAll(10 simple tasks)', {
        defer: true,
        fn: async (deferred) => {
            await tasklets.runAll(simpleTasks);
            deferred.resolve();
        },
    })
    .add('runAll(10 cpu intensive tasks)', {
        defer: true,
        fn: async (deferred) => {
            await tasklets.runAll(cpuTasks);
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
