/**
 * @file basic.js
 * @description This example provides a basic demonstration of the Tasklets API.
 * It covers the fundamental features of the library, including:
 * - Configuring tasklet behavior.
 * - Executing a single task with `tasklets.run()`.
 * - Basic error handling for tasks.
 * - Retrieving performance statistics and system health.
 * - A performance comparison between synchronous and parallel execution.
 */
const tasklets = require('../../lib');

console.log('--- Tasklets Basic Example ---\n');

async function runBasicExamples() {
    // Configure tasklets (optional - has smart defaults)
    tasklets.config({
        logging: 'info'
    });

    // Example 1: Simple task execution
    console.log('1. Simple task execution:');
    const result = await tasklets.run(() => {
        console.log('  -> Task running in a worker thread...');
        let sum = 0;
        // NOTE: This is a heavy loop for demonstration.
        for (let i = 0; i < 200000000; i++) {
            sum += 1;
        }
        console.log('  -> Task completed!');
        return sum;
    });
    console.log(`  Result: ${result}\n`);


    // Example 2: Error handling
    console.log('2. Error handling:');
    try {
        await tasklets.run(() => {
            throw new Error('This task failed intentionally');
        });
        console.log('  Task succeeded (this should not happen)');
    } catch (error) {
        console.log(`  Task failed as expected: ${error.message}`);
    }
    console.log();

    // Example 3: Performance statistics
    console.log('3. Performance statistics:');
    const stats = tasklets.getStats();
    console.log('  Current stats:', stats);
    console.log();

    // Example 4: System health
    console.log('4. System health check:');
    const health = tasklets.getHealth();
    console.log('  Health status:', health.status);
    console.log();

    // Example 5: Performance comparison
    console.log('5. Performance comparison:');

    const iterations = 3;
    const workAmount = 200000000;

    const doWork = () => {
        let sum = 0;
        for (let j = 0; j < workAmount; j++) {
            sum += 1;
        }
        return sum;
    };

    // Synchronous execution
    console.log(`  -> Running ${iterations} tasks synchronously...`);
    const syncStart = Date.now();
    for (let i = 0; i < iterations; i++) {
        doWork();
    }
    const syncTime = Date.now() - syncStart;

    // Parallel execution with tasklets
    console.log(`  -> Running ${iterations} tasks in parallel...`);
    const parallelStart = Date.now();
    // We create an array of promises and wait for them all to finish.
    const promises = [];
    for (let i = 0; i < iterations; i++) {
        promises.push(tasklets.run(doWork));
    }
    await Promise.all(promises);
    const parallelTime = Date.now() - parallelStart;

    console.log(`  Synchronous time: ${syncTime}ms`);
    console.log(`  Parallel time:    ${parallelTime}ms`);
    if (parallelTime > 0) {
        console.log(`  Speedup:          ${(syncTime / parallelTime).toFixed(2)}x\n`);
    }

    console.log(' Basic example completed successfully!\n');
}

// Run the examples
(async () => {
    try {
        await runBasicExamples();
    } catch (error) {
        console.error(' Example failed:', error.message);
    }
})(); 