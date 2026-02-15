/**
 * @file 03-metrics-monitoring.js
 * @description Demonstrates performance metrics tracking and health monitoring in Tasklets.
 */
const tasklets = require('../../../lib/index');

async function runMetricsExample() {
    console.log('--- Tasklets Metrics & Health Example ---\n');

    // Configure
    tasklets.configure({
        maxWorkers: 4,
        logging: 'none'
    });

    console.log('1. Running tasks to generate metrics...');

    const runTasks = async (count, delay) => {
        const promises = [];
        for (let i = 0; i < count; i++) {
            promises.push(tasklets.run(async (d) => {
                const start = Date.now();
                // Simulate work with variable duration
                while (Date.now() - start < d) { }
                return d;
            }, Math.random() * delay));
        }
        return Promise.all(promises);
    };

    await runTasks(20, 50);

    // 2. Inspecting Metrics
    console.log('\n2. Performance Metrics:');
    const stats = tasklets.getStats();
    console.log('   Total Tasks Processed:', stats.processedTasks);
    console.log('   Average Task Duration:', stats.avgTaskTime.toFixed(2), 'ms');
    console.log('   Current Throughput:', stats.throughput, 'tasks/sec');

    // 3. Health Monitoring
    console.log('\n3. System Health:');
    const health = tasklets.getHealth();
    console.log('   Status:', health.status);
    console.log('   Total Workers:', health.workers);
    console.log('   System Memory Usage:', health.memoryUsagePercent.toFixed(1), '%');

    if (health.memoryUsagePercent > 90) {
        console.log('   ⚠️ WARNING: High memory usage detected!');
    } else {
        console.log('   ✅ System resources are stable.');
    }

    // 4. Resource Cleanup Verification
    console.log('\n4. Verifying resource cleanup on shutdown...');
    await tasklets.shutdown();

    const finalStats = tasklets.getStats();
    console.log('   Total Active Tasks after shutdown:', finalStats.activeTasks);
    console.log('   Total Workers after shutdown:', finalStats.totalWorkers);

    console.log('\n🎉 Example finished.');
}

runMetricsExample().catch(console.error);
