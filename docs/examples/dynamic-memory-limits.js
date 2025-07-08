/**
 * @file dynamic-memory-limits.js
 * @description This example demonstrates memory-aware task management with Tasklets.
 * It shows how to:
 * - Monitor memory usage during task execution using `process.memoryUsage()` and `os.freemem()`.
 * - Process tasks in batches to control memory consumption.
 * - Implement a strategy to dynamically adjust task creation based on available memory, preventing the system from being overloaded.
 * This is useful for long-running applications or batch processing systems that handle large amounts of data.
 */
const tasklets = require('../../lib/tasklets');
const os = require('os');

console.log('=== Tasklets - Dynamic Memory Limits Demo ===\n');

console.log('This example demonstrates memory-aware task management:');
console.log('- Monitor memory usage during task execution');
console.log('- Batch processing with memory awareness');
console.log('- System resource monitoring');
console.log('- Dynamic task scheduling based on available memory\n');

// Function to get system memory info
function getMemoryInfo() {
    const memUsage = process.memoryUsage();
    const stats = tasklets.getStats();
    const totalMemMB = os.totalmem() / 1024 / 1024;
    const freeMemMB = os.freemem() / 1024 / 1024;
    const usedMemMB = memUsage.heapUsed / 1024 / 1024;

    return {
        activeTasks: stats.tasks.active,
        totalTasks: stats.tasks.total,
        completedTasks: stats.tasks.completed,
        totalMemoryMB: Math.round(totalMemMB),
        freeMemoryMB: Math.round(freeMemMB),
        usedMemoryMB: Math.round(usedMemMB),
        memoryUsagePercentage: Math.round((usedMemMB / totalMemMB) * 100),
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024)
    };
}

// Example 1: Memory-aware task creation
console.log('=== Example 1: Memory-Aware Task Creation ===\n');

async function memoryAwareTest() {
    console.log('Creating tasks with memory monitoring...\n');

    const batchSize = 100;
    const batches = 10;
    let totalCreated = 0;

    try {
        for (let batch = 0; batch < batches; batch++) {
            const memBefore = getMemoryInfo();
            console.log(`Batch ${batch + 1}/${batches} - Memory before: ${memBefore.usedMemoryMB}MB (${memBefore.memoryUsagePercentage}%)`);

            // Create tasks that use some memory
            const tasks = Array.from({length: batchSize}, (_, i) => () => {
                // Simulate some memory usage with different random values
                const data = Array.from({length: 1000}, () => Math.random());

                // Do some work
                let sum = 0;
                for (let j = 0; j < data.length; j++) {
                    sum += data[j] * Math.sqrt(j + 1); // +1 to avoid sqrt(0)
                }

                return sum;
            });

            // Run tasks in parallel
            const results = await tasklets.runAll(tasks);
            totalCreated += batchSize;

            const memAfter = getMemoryInfo();
            console.log(`  Completed ${batchSize} tasks, Total: ${totalCreated}`);
            console.log(`  Memory after: ${memAfter.usedMemoryMB}MB (${memAfter.memoryUsagePercentage}%)`);
            console.log(`  Memory delta: ${memAfter.usedMemoryMB - memBefore.usedMemoryMB}MB`);
            console.log(`  Results sample: ${results.slice(0, 3).map(r => Math.round(r)).join(', ')}...\n`);

            // Check if we should limit further task creation
            if (memAfter.memoryUsagePercentage > 80) {
                console.log('  Memory usage above 80%, slowing down task creation...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`Successfully created and completed ${totalCreated} tasks!\n`);

    } catch (error) {
        console.log(`\nError during task creation: ${error.message}`);
        const memInfo = getMemoryInfo();
        console.log(`Final stats: Active tasks: ${memInfo.activeTasks}, Total created: ${memInfo.totalTasks}`);
    }
}

// Example 2: Memory monitoring during execution
console.log('=== Example 2: Real-time Memory Monitoring ===\n');

async function memoryMonitoringTest() {
    console.log('Creating tasks with real-time memory monitoring...\n');

    const monitoringInterval = 200; // Monitor every 200ms (faster)
    const taskCount = 100; // Fewer tasks but longer execution

    // Start memory monitoring
    const memoryLog = [];
    let monitoring = true;

    const monitoringTask = setInterval(() => {
        if (!monitoring) return;

        const memInfo = getMemoryInfo();
        memoryLog.push({
            timestamp: Date.now(),
            ...memInfo
        });

        console.log(`  [Monitor] Memory: ${memInfo.usedMemoryMB}MB (${memInfo.memoryUsagePercentage}%) | Active: ${memInfo.activeTasks} | Completed: ${memInfo.completedTasks}`);
    }, monitoringInterval);

    try {
        // Create tasks with varying memory usage
        const tasks = Array.from({length: taskCount}, (_, i) => () => {
            // Variable workload - larger and more intensive
            const workSize = Math.floor(Math.random() * 5000) + 2000;
            const data = Array.from({length: workSize}, () => Math.random());

            // Simulate CPU and memory work - more intensive
            for (let j = 0; j < workSize; j++) {
                data[j] = Math.sqrt(j + 1) * data[j] + Math.sin(j + 1); // +1 to avoid sqrt(0) and sin(0)
                // Add some extra computation to make tasks take longer
                if (j % 100 === 0) {
                    Math.cos(j + 1) * Math.tan(j + 1);
                }
            }

            return data.reduce((sum, val) => sum + val, 0);
        });

        console.log(`Starting ${taskCount} tasks with memory monitoring...\n`);

        const startTime = Date.now();
        const results = await tasklets.runAll(tasks);
        const endTime = Date.now();

        monitoring = false;
        clearInterval(monitoringTask);

        console.log(`\nAll tasks completed in ${endTime - startTime}ms`);
        console.log(`Results sample: ${results.slice(0, 3).map(r => Math.round(r)).join(', ')}...`);

        // Analyze memory usage
        if (memoryLog.length > 0) {
            const maxMemory = Math.max(...memoryLog.map(m => m.usedMemoryMB));
            const avgMemory = memoryLog.reduce((sum, m) => sum + m.usedMemoryMB, 0) / memoryLog.length;

            console.log(`\nMemory Analysis:`);
            console.log(`- Peak memory usage: ${Math.round(maxMemory)}MB`);
            console.log(`- Average memory usage: ${Math.round(avgMemory)}MB`);
            console.log(`- Memory samples collected: ${memoryLog.length}`);
        } else {
            console.log(`\nMemory Analysis:`);
            console.log(`- No memory samples collected (tasks completed too quickly)`);
            console.log(`- Consider increasing task count or reducing monitoring interval`);
        }

    } catch (error) {
        monitoring = false;
        clearInterval(monitoringTask);
        console.error('Error during monitoring test:', error.message);
    }

    console.log();
}

// Example 3: System resource awareness
console.log('=== Example 3: System Resource Awareness ===\n');

function showSystemInfo() {
    const memInfo = getMemoryInfo();
    const cpuCount = os.cpus().length;
    const platform = os.platform();
    const arch = os.arch();

    console.log('System Information:');
    console.log(`- Platform: ${platform} (${arch})`);
    console.log(`- CPU cores: ${cpuCount}`);
    console.log(`- Total memory: ${memInfo.totalMemoryMB}MB`);
    console.log(`- Free memory: ${memInfo.freeMemoryMB}MB`);
    console.log(`- Used memory: ${memInfo.usedMemoryMB}MB`);
    console.log(`- Worker threads: ${tasklets.getStats().workers}`);
    console.log();

    console.log('Memory Management Strategy:');
    console.log('- Monitor memory usage during task execution');
    console.log('- Batch tasks to prevent memory spikes');
    console.log('- Use system-aware worker thread counts');
    console.log('- Implement backpressure when memory is high');
    console.log();

    console.log('Recommended Limits:');
    const recommendedBatchSize = Math.min(cpuCount * 10, 100);
    const memoryThreshold = 75; // percent

    console.log(`- Batch size: ${recommendedBatchSize} tasks`);
    console.log(`- Memory threshold: ${memoryThreshold}%`);
    console.log(`- Worker threads: ${cpuCount} (auto-detected)`);
    console.log();
}

// Run examples
async function runExamples() {
    showSystemInfo();

    try {
        await memoryAwareTest();
        await memoryMonitoringTest();

        console.log('=== Dynamic Memory Limits Demo Complete ===\n');
        console.log('The system successfully managed memory usage during task execution!');
        console.log('Memory awareness helps prevent system overload.');

    } catch (error) {
        console.error('Error during demo:', error.message);
    }
}

runExamples(); 