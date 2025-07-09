const Benchmark = require('benchmark');
const tasklets = require('../lib');

console.log('--- Comparando tasklets Normal Mode vs Fast Mode ---');

// Configure tasklets
tasklets.config({
    workers: 1,
    logging: 'error'
});

const suite = new Benchmark.Suite();

// Simple number task
const numberTask = () => 42;
const stringTask = () => "Hello World";
const booleanTask = () => true;

// Add benchmarks
suite
    .add('Normal mode (number) -> string', {
        defer: true,
        fn: async (deferred) => {
            try {
                const result = await tasklets.run(numberTask);
                deferred.resolve();
            } catch (error) {
                deferred.reject(error);
            }
        }
    })
    .add('Fast mode (number) -> native', {
        defer: true,
        fn: async (deferred) => {
            try {
                const result = await tasklets.run(numberTask, {fastMode: true});
                deferred.resolve();
            } catch (error) {
                deferred.reject(error);
            }
        }
    })
    .add('Normal mode (string) -> string', {
        defer: true,
        fn: async (deferred) => {
            try {
                const result = await tasklets.run(stringTask);
                deferred.resolve();
            } catch (error) {
                deferred.reject(error);
            }
        }
    })
    .add('Fast mode (string) -> native', {
        defer: true,
        fn: async (deferred) => {
            try {
                const result = await tasklets.run(stringTask, {fastMode: true});
                deferred.resolve();
            } catch (error) {
                deferred.reject(error);
            }
        }
    })
    .add('Normal mode (boolean) -> string', {
        defer: true,
        fn: async (deferred) => {
            try {
                const result = await tasklets.run(booleanTask);
                deferred.resolve();
            } catch (error) {
                deferred.reject(error);
            }
        }
    })
    .add('Fast mode (boolean) -> native', {
        defer: true,
        fn: async (deferred) => {
            try {
                const result = await tasklets.run(booleanTask, {fastMode: true});
                deferred.resolve();
            } catch (error) {
                deferred.reject(error);
            }
        }
    });

// Add event listeners
suite
    .on('cycle', (event) => {
        console.log(String(event.target));
    })
    .on('complete', function () {
        const fastest = this.filter('fastest');
        const slowest = this.filter('slowest');

        if (fastest.length > 0 && slowest.length > 0) {
            const improvement = ((fastest[0].hz - slowest[0].hz) / slowest[0].hz * 100).toFixed(2);
            console.log(`\nFastest is ${fastest.map('name')}`);
            console.log(`Performance improvement: ${improvement}%`);
        }
    })
    .run({async: true});