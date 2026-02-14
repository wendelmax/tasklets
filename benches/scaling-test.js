const tasklets = require('../lib/index');

async function testScaling() {
    console.log('--- Scaling Test ---');

    // Configure for fast scaling
    tasklets.configure({
        minWorkers: 1,
        maxWorkers: 4,
        idleTimeout: 2000 // 2 seconds
    });

    console.log('Initial Stats:', tasklets.getStats());

    console.log('Running burst of tasks...');
    // enough tasks to saturate 4 workers
    const tasks = Array.from({ length: 50 }, () => ({
        task: () => new Promise(r => setTimeout(r, 100))
    }));

    await tasklets.runAll(tasks);

    console.log('After Burst Stats:', tasklets.getStats()); // Should be ~4 workers

    console.log('Waiting for idle timeout (3s)...');
    await new Promise(r => setTimeout(r, 3000));

    // Force maintenance check (setInterval is 2s, we waited 3s, should be enough)
    // But we might need to wait a bit more for the interval to fire
    await new Promise(r => setTimeout(r, 2000));

    console.log('After Idle Stats:', tasklets.getStats()); // Should be 1 worker

    await tasklets.terminate();
}

testScaling().catch(console.error);
