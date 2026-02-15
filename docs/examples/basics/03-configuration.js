/**
 * @file 03-configuration.js
 * @description Demonstrates all configure() options introduced in Tasklets v2.2.
 *
 * Features covered:
 *   - maxWorkers / minWorkers / idleTimeout
 *   - workload ('cpu' | 'io' | 'mixed')
 *   - adaptive (auto-scaling)
 *   - timeout (auto-reject slow tasks)
 *   - maxMemory (% based memory limit)
 *   - logging ('debug' | 'info' | 'warn' | 'error' | 'none')
 *   - MODULE: prefix for require() inside workers
 */
const path = require('path');
const Tasklets = require('../../../lib/index');

console.log('--- Tasklets v2.2 Configuration Example ---\n');

async function main() {
    // ================================================================
    // 1. Full configure() demonstration
    // ================================================================
    console.log('1. Full configure() example:');

    const tasklets = new Tasklets();

    tasklets.configure({
        maxWorkers: 4,       // Number of worker threads
        minWorkers: 2,       // Keep 2 workers warm
        idleTimeout: 10000,  // Terminate idle workers after 10s
        workload: 'cpu',     // Optimize for CPU-bound tasks (sets idleTimeout to 10s)
        adaptive: true,      // Auto-scale workers based on system load
        timeout: 5000,       // Reject tasks that take longer than 5s
        maxMemory: 99,       // Block new workers above 99% system memory
        logging: 'debug',    // Show all internal logs
    });

    console.log('  Configuration applied!\n');

    // ================================================================
    // 2. Timeout in action
    // ================================================================
    console.log('2. Timeout (auto-reject slow tasks):');

    // This task finishes fast — should succeed
    const fast = await tasklets.run((n) => {
        let sum = 0;
        for (let i = 0; i < n; i++) sum += i;
        return sum;
    }, 1000);
    console.log(`  Fast task result: ${fast}`);

    // This task blocks forever — should be rejected after 5s
    try {
        await tasklets.run(() => {
            while (true) { } // infinite loop
        });
    } catch (err) {
        console.log(`  Slow task rejected: "${err.message}"`);
    }
    console.log();

    // ================================================================
    // 3. Logging levels
    // ================================================================
    console.log('3. Logging levels:');

    tasklets.configure({ logging: 'warn' });
    console.log('  Set to "warn" — debug messages are now hidden');

    tasklets.configure({ logging: 'none' });
    console.log('  Set to "none" — completely silent');

    tasklets.configure({ logging: 'debug' });
    console.log('  Set to "debug" — everything is visible again\n');

    // ================================================================
    // 4. Workload types
    // ================================================================
    console.log('4. Workload types:');
    console.log('  "cpu"   → idleTimeout = 10,000ms (keep workers longer)');
    console.log('  "io"    → idleTimeout =  2,000ms (recycle faster)');
    console.log('  "mixed" → idleTimeout =  5,000ms (balanced)\n');

    // ================================================================
    // 5. Health & Stats monitoring
    // ================================================================
    console.log('5. Pool monitoring:');

    const stats = tasklets.getStats();
    const health = tasklets.getHealth();

    console.log(`  Active tasks:  ${stats.activeTasks}`);
    console.log(`  Total workers: ${stats.totalWorkers}`);
    console.log(`  Idle workers:  ${stats.idleWorkers}`);
    console.log(`  Throughput:    ${stats.throughput.toFixed(2)} ops/sec`);
    console.log(`  Health status: ${health.status}`);
    console.log(`  Memory usage:  ${health.memoryUsagePercent.toFixed(1)}%\n`);

    // ================================================================
    // 6. Argument validation
    // ================================================================
    console.log('6. Argument validation:');

    // Functions cannot be passed as arguments
    try {
        await tasklets.run((cb) => cb(), () => 'hello');
    } catch (err) {
        console.log(`  Function as arg: "${err.message.split('.')[0]}."`);
    }

    // Symbols cannot be passed as arguments
    try {
        await tasklets.run((s) => s, Symbol('test'));
    } catch (err) {
        console.log(`  Symbol as arg:   "${err.message}"`);
    }

    // Plain data works fine
    const result = await tasklets.run(
        (data) => `Got ${data.items.length} items from ${data.source}`,
        { source: 'database', items: [1, 2, 3] }
    );
    console.log(`  Plain data:      "${result}"\n`);

    // ================================================================
    // Done
    // ================================================================
    await tasklets.terminate();
    console.log('--- Configuration example completed! ---');
}

main().catch(console.error);
