/**
 * @file batch-processing.js
 * @brief Example demonstrating batch processing with Tasklets
 * @author Jackson Wendel Santos Sá
 * @date 2025
 * 
 * This example shows how to use the new batch processing APIs
 * for efficient parallel task execution.
 */

const tasklets = require('../../build/Release/tasklets');

// =====================================================================
// Basic Batch Processing
// =====================================================================

console.log('🚀 Starting batch processing example...\n');

// Example 1: Simple batch processing
console.log('📦 Example 1: Simple batch processing');
const batch1 = tasklets.batch(10, (index) => {
    // Simulate some work
    const result = `Task ${index} completed`;
    console.log(`  Processing task ${index}...`);
    return result;
});

console.log(`  Created ${batch1.length} tasks`);
console.log(`  Task IDs: ${batch1.map(id => id.toString()).join(', ')}\n`);

// Wait for all tasks to complete
tasklets.joinBatch(batch1);
console.log('  All tasks completed!\n');

// Get results
const results1 = tasklets.getBatchResults(batch1);
console.log('  Results:', results1);
console.log('  Any errors:', tasklets.batchHasError(batch1), '\n');

// =====================================================================
// Batch Processing with Error Handling
// =====================================================================

console.log('⚠️  Example 2: Batch processing with error handling');

const batch2 = tasklets.batch(5, (index) => {
    if (index === 2) {
        throw new Error(`Intentional error in task ${index}`);
    }
    return `Task ${index} completed successfully`;
});

// Wait for completion
tasklets.joinBatch(batch2);

// Check for errors
if (tasklets.batchHasError(batch2)) {
    console.log('  Errors detected in batch');
    const errors = tasklets.getBatchErrors(batch2);
    errors.forEach((error, index) => {
        if (error) {
            console.log(`    Task ${index}: ${error}`);
        }
    });
} else {
    console.log('  All tasks completed successfully');
}

const results2 = tasklets.getBatchResults(batch2);
console.log('  Results:', results2, '\n');

// =====================================================================
// Large Batch Processing
// =====================================================================

console.log('🔥 Example 3: Large batch processing (1000 tasks)');

const startTime = Date.now();
const largeBatch = tasklets.batch(1000, (index) => {
    // Simulate CPU-intensive work
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
        sum += Math.sqrt(i + index);
    }
    return `Task ${index} computed sum: ${sum.toFixed(2)}`;
});

console.log(`  Created ${largeBatch.length} tasks`);
console.log('  Waiting for completion...');

// Wait for completion
tasklets.joinBatch(largeBatch);

const endTime = Date.now();
const duration = endTime - startTime;

console.log(`  ✅ Completed ${largeBatch.length} tasks in ${duration}ms`);
console.log(`  Average time per task: ${(duration / largeBatch.length).toFixed(2)}ms`);

// Check for errors
if (tasklets.batchHasError(largeBatch)) {
    console.log('  ⚠️  Some tasks had errors');
    const errors = tasklets.getBatchErrors(largeBatch);
    const errorCount = errors.filter(error => error).length;
    console.log(`  Error count: ${errorCount}`);
} else {
    console.log('  ✅ All tasks completed successfully');
}

// Get a sample of results
const sampleResults = tasklets.getBatchResults(largeBatch).slice(0, 5);
console.log('  Sample results:', sampleResults, '\n');

// =====================================================================
// System Monitoring
// =====================================================================

console.log('📊 Example 4: System monitoring');

// Get system status
const systemStatus = tasklets.getSystemStatus();
console.log('  System Status:');
console.log(`    Memory Manager: ${systemStatus.memory_manager_initialized ? '✅' : '❌'}`);
console.log(`    Auto Config: ${systemStatus.auto_config_initialized ? '✅' : '❌'}`);
console.log(`    Auto Scheduler: ${systemStatus.auto_scheduler_initialized ? '✅' : '❌'}`);
console.log(`    Multiprocessor: ${systemStatus.multiprocessor_initialized ? '✅' : '❌'}`);
console.log(`    Active Tasklets: ${systemStatus.active_tasklets.toString()}`);
console.log(`    Worker Threads: ${systemStatus.worker_threads.toString()}`);
console.log(`    Memory Usage: ${systemStatus.memory_usage_percent.toFixed(2)}%`);
console.log(`    CPU Utilization: ${systemStatus.cpu_utilization.toFixed(2)}%`);

// Get memory stats
const memoryStats = tasklets.getMemoryStats();
console.log('\n  Memory Stats:');
console.log(`    Active Tasklets: ${memoryStats.active_tasklets.toString()}`);
console.log(`    Total Created: ${memoryStats.total_tasklets_created.toString()}`);
console.log(`    Memory Usage: ${memoryStats.memory_usage_mb.toFixed(2)} MB`);
console.log(`    System Memory: ${memoryStats.system_memory_usage_percent.toFixed(2)}%`);

// Get thread pool stats
const stats = tasklets.getStats();
console.log('\n  Thread Pool Stats:');
console.log(`    Worker Threads: ${stats.worker_threads}`);
console.log(`    Active Jobs: ${stats.active_jobs}`);
console.log(`    Completed Jobs: ${stats.completed_jobs}`);
console.log(`    Failed Jobs: ${stats.failed_jobs}`);
console.log(`    Jobs per Second: ${stats.jobs_per_second.toFixed(2)}`);

// =====================================================================
// Auto-Configuration
// =====================================================================

console.log('\n🔧 Example 5: Auto-configuration');

// Get auto-config settings
const autoConfigSettings = tasklets.getAutoConfigSettings();
console.log('  Auto-Config Settings:');
console.log(`    Enabled: ${autoConfigSettings.is_enabled ? '✅' : '❌'}`);
console.log(`    Strategy: ${autoConfigSettings.strategy}`);

// Force analysis
console.log('  Forcing auto-configuration analysis...');
tasklets.forceAutoConfigAnalysis();

// Get metrics
const metrics = tasklets.getAutoConfigMetrics();
if (metrics.length > 0) {
    const latestMetric = metrics[metrics.length - 1];
    console.log('  Latest Metrics:');
    console.log(`    CPU Utilization: ${latestMetric.cpu_utilization.toFixed(2)}%`);
    console.log(`    Memory Usage: ${latestMetric.memory_usage_percent.toFixed(2)}%`);
    console.log(`    Throughput: ${latestMetric.throughput_tasks_per_sec.toFixed(2)} tasks/sec`);
    console.log(`    Success Rate: ${(latestMetric.success_rate * 100).toFixed(2)}%`);
}

console.log('\n🎉 Batch processing example completed!'); 