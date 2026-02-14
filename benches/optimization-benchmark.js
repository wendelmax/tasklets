const tasklets = require('../lib/index');

async function runBenchmark() {
    console.log('--- Tasklets Optimization Benchmark ---');
    const start = Date.now();
    const taskCount = 1000;

    // Task that benefits from caching (compiled once, run many times)
    const taskFn = (n) => {
        return Math.sqrt(n) * Math.sin(n);
    };

    console.log(`Running ${taskCount} tasks...`);

    const tasks = Array.from({ length: taskCount }, (_, i) => ({
        task: taskFn,
        args: [i]
    }));

    await tasklets.runAll(tasks);

    const duration = Date.now() - start;
    console.log(`Completed in ${duration}ms`);
    console.log(`Throughput: ${(taskCount / duration * 1000).toFixed(2)} ops/sec`);

    await tasklets.terminate();
}

runBenchmark().catch(console.error);
