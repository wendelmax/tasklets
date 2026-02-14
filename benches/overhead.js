const Benchmark = require('benchmark');
const tasklets = require('../lib/index');

const suite = new Benchmark.Suite('Overhead');

function fibonacci(n) {
    if (n < 2) return n;
    return fibonacci(n - 2) + fibonacci(n - 1);
}

console.log('--- Comparando tasklets vs. execução nativa (Overhead) ---');

tasklets.configure({
    workers: 1,
    logging: 'off',
});

suite
    .add('Native JS execution', () => {
        fibonacci(20);
    })
    .add('tasklets.run(fibonacci)', {
        defer: true,
        fn: async (deferred) => {
            // Inline the recursive function so it exists in worker scope
            await tasklets.run((n) => {
                function fib(x) {
                    if (x < 2) return x;
                    return fib(x - 2) + fib(x - 1);
                }
                return fib(n);
            }, 20);
            deferred.resolve();
        },
    })
    .on('cycle', (event) => {
        console.log(String(event.target));
    })
    .on('complete', function () {
        console.log('Benchmark completed');
        tasklets.terminate().then(() => {
            process.exit(0);
        });
    })
    .run({ async: true });
