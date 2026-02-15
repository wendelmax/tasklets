/**
 * @file 02-adaptive-scaling.js
 * @description Demonstrates adaptive scaling and workload-based optimization in Tasklets.
 */
const tasklets = require('../../../lib/index');

async function runAdaptiveExample() {
    console.log('--- Tasklets Adaptive Scaling Example ---\n');

    // 1. Enable Adaptive Mode
    // This allows the pool to proactively scale based on queue size and system health.
    tasklets.configure({
        adaptive: true,
        maxWorkers: 10,
        logging: 'info'
    });

    console.log('1. Adaptive mode enabled. Scaling is now dynamic based on load.\n');

    // 2. Setting Workload Type
    // You can optimize the idle timeout and scheduler for different types of work.
    console.log('2. Optimizing for CPU-intensive workload...');
    tasklets.setWorkloadType('cpu'); // Keeps workers warm longer (longer idleTimeout)

    // 3. Simulating a burst of tasks
    console.log('3. Running a burst of parallel tasks to trigger proactive scaling...');

    const tasks = Array.from({ length: 50 }, (_, i) => ({
        name: `cpu-task-${i}`,
        task: (n) => {
            // CPU intensive work
            let result = 0;
            for (let j = 0; j < 1000000; j++) result += Math.sqrt(j);
            return result;
        }
    }));

    const startTime = Date.now();

    // Use batch with progress monitoring
    const results = await tasklets.batch(tasks, {
        onProgress: (p) => {
            if (p.percentage % 20 === 0) {
                const stats = tasklets.getStats();
                console.log(`   Progress: ${p.percentage}% | Active Workers: ${stats.activeWorkers}/${stats.totalWorkers}`);
            }
        }
    });

    const duration = Date.now() - startTime;
    console.log(`\n✅ Burst completed in ${duration}ms`);

    // 4. Switching to I/O-intensive optimization
    console.log('\n4. Switching to I/O-intensive workload...');
    tasklets.setWorkloadType('io'); // Reclaims workers faster (shorter idleTimeout)

    // 5. Cleanup
    console.log('\n5. Shutting down pool...');
    await tasklets.shutdown();
    console.log('🎉 Example finished.');
}

runAdaptiveExample().catch(console.error);
