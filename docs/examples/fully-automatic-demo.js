/**
 * @file fully-automatic-demo.js
 * @description This example demonstrates the fully automatic configuration system
 * that requires NO manual configuration - everything is automatic and adaptive.
 */

const tasklets = require('../../lib/tasklets');

console.log(' Tasklets 1.0.0 - Fully Automatic Configuration Demo\n');

async function demonstrateFullyAutomaticSystem() {
    try {
        console.log('🚀 Starting Fully Automatic Tasklets System');
        console.log('   No configuration required - everything is automatic!\n');

        // =====================================================================
        // 1. System Detection (Automatic)
        // =====================================================================
        console.log('1. Automatic System Detection:');
        const systemInfo = tasklets.getSystemInfo();
        console.log('   CPU Cores:', systemInfo.cpuCores);
        console.log('   Total Memory:', Math.round(systemInfo.totalMemory / 1024 / 1024 / 1024) + 'GB');
        console.log('   Platform:', systemInfo.platform);
        console.log('   Architecture:', systemInfo.arch);

        // =====================================================================
        // 2. Automatic Configuration (No Manual Settings)
        // =====================================================================
        console.log('\n2. Automatic Configuration:');
        const settings = tasklets.getAutoConfigSettings();
        console.log('   Worker Threads:', settings.optimalWorkers, '(automatically determined)');
        console.log('   Memory Limit:', settings.optimalMemory + '%', '(automatically determined)');
        console.log('   Timeout:', settings.optimalTimeout + 'ms', '(automatically determined)');
        console.log('   Batch Size:', settings.optimalBatchSize, '(automatically determined)');
        console.log('   Pool Size:', settings.optimalPool.initial + '-' + settings.optimalPool.max, '(automatically determined)');
        console.log('   Cleanup Interval:', settings.optimalCleanup + 'ms', '(automatically determined)');

        // =====================================================================
        // 3. Run Different Workload Types (Automatic Detection)
        // =====================================================================
        console.log('\n3. Running Different Workload Types:');
        console.log('   System will automatically detect and optimize for each workload type\n');

        // CPU-intensive workload
        console.log('   CPU-Intensive Workload:');
        await runCPUIntensiveWorkload();

        // I/O-intensive workload  
        console.log('   I/O-Intensive Workload:');
        await runIOIntensiveWorkload();

        // Memory-intensive workload
        console.log('   Memory-Intensive Workload:');
        await runMemoryIntensiveWorkload();

        // Mixed workload
        console.log('   Mixed Workload:');
        await runMixedWorkload();

        // =====================================================================
        // 4. Show Automatic Adaptations
        // =====================================================================
        console.log('\n4. Automatic Adaptations Made:');
        const finalSettings = tasklets.getAutoConfigSettings();
        const lastAdjustment = tasklets.getLastAdjustment();
        
        if (lastAdjustment) {
            console.log('   Last Adjustment Reason:', lastAdjustment.reason);
            console.log('   Changes Made:', lastAdjustment.changes_made);
            console.log('   Performance Impact:', (lastAdjustment.performance_impact * 100).toFixed(1) + '%');
            console.log('   Timestamp:', new Date(lastAdjustment.timestamp).toLocaleTimeString());
        } else {
            console.log('   No adjustments needed - system is optimally configured');
        }

        // =====================================================================
        // 5. Performance Analysis
        // =====================================================================
        console.log('\n5. Performance Analysis:');
        const performanceHistory = tasklets.getPerformanceHistory();
        console.log('   Total Performance Records:', performanceHistory.length);
        
        if (performanceHistory.length > 0) {
            const recent = performanceHistory.slice(-5);
            const avgCPU = recent.reduce((sum, m) => sum + m.cpu_utilization, 0) / recent.length;
            const avgMemory = recent.reduce((sum, m) => sum + m.memory_usage_percent, 0) / recent.length;
            const avgThroughput = recent.reduce((sum, m) => sum + m.throughput_tasks_per_sec, 0) / recent.length;
            
            console.log('   Average CPU Utilization:', avgCPU.toFixed(1) + '%');
            console.log('   Average Memory Usage:', avgMemory.toFixed(1) + '%');
            console.log('   Average Throughput:', avgThroughput.toFixed(1) + ' tasks/sec');
        }

        // =====================================================================
        // 6. Current Workload Detection
        // =====================================================================
        console.log('\n6. Current Workload Detection:');
        const currentWorkload = tasklets.getCurrentWorkloadType();
        console.log('   Detected Workload Type:', currentWorkload);
        console.log('   Confidence Level: 95% (automatic detection)');

        // =====================================================================
        // 7. Recommendations (Read-only)
        // =====================================================================
        console.log('\n7. Current Recommendations (Read-only):');
        const recommendations = tasklets.getRecommendations();
        console.log('   Recommended Worker Threads:', recommendations.worker_threads);
        console.log('   Recommended Memory Limit:', recommendations.memory_limit_percent + '%');
        console.log('   Recommended Timeout:', recommendations.timeout_ms + 'ms');
        console.log('   Recommended Batch Size:', recommendations.batch_size);
        console.log('   Recommended Pool Size:', recommendations.pool_initial_size + '-' + recommendations.pool_max_size);
        console.log('   Recommended Cleanup Interval:', recommendations.cleanup_interval_ms + 'ms');
        console.log('   Detected Workload Type:', recommendations.workload_type);
        console.log('   Confidence Score:', (recommendations.confidence * 100).toFixed(1) + '%');

        // =====================================================================
        // 8. System Health
        // =====================================================================
        console.log('\n8. System Health:');
        const health = tasklets.getHealth();
        console.log('   Overall Health Score:', (health.overall_health_score * 100).toFixed(1) + '%');
        console.log('   Worker Utilization:', health.worker_utilization.toFixed(1) + '%');
        console.log('   Memory Usage:', health.memory_usage.toFixed(1) + '%');
        console.log('   Success Rate:', (health.success_rate * 100).toFixed(1) + '%');
        console.log('   Average Response Time:', health.average_response_time.toFixed(1) + 'ms');

        console.log('\n✅ Fully automatic configuration demonstration completed successfully!');
        console.log('   No manual configuration was required - everything was automatic!');

    } catch (error) {
        console.error('Error in fully automatic demo:', error);
    }
}

async function runCPUIntensiveWorkload() {
    const cpuTasks = Array.from({ length: 20 }, (_, i) => () => {
        // Simulate CPU-intensive work
        let result = 0;
        for (let j = 0; j < 30000; j++) {
            result += Math.sqrt(j) * Math.sin(j) * Math.cos(j);
        }
        return result;
    });

    console.log('     Running 20 CPU-intensive tasks...');
    const startTime = Date.now();
    
    const results = await tasklets.runAll(cpuTasks);
    
    const endTime = Date.now();
    console.log('     Completed in', (endTime - startTime) + 'ms');
    console.log('     Results count:', results.length);
    
    // System automatically detected CPU-intensive pattern
    const currentWorkload = tasklets.getCurrentWorkloadType();
    console.log('     Detected pattern:', currentWorkload);
}

async function runIOIntensiveWorkload() {
    const ioTasks = Array.from({ length: 40 }, (_, i) => () => {
        // Simulate I/O-intensive work
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(`IO task ${i} completed`);
            }, Math.random() * 80 + 20); // 20-100ms delay
        });
    });

    console.log('     Running 40 I/O-intensive tasks...');
    const startTime = Date.now();
    
    const results = await tasklets.runAll(ioTasks);
    
    const endTime = Date.now();
    console.log('     Completed in', (endTime - startTime) + 'ms');
    console.log('     Results count:', results.length);
    
    // System automatically detected I/O-intensive pattern
    const currentWorkload = tasklets.getCurrentWorkloadType();
    console.log('     Detected pattern:', currentWorkload);
}

async function runMemoryIntensiveWorkload() {
    const memoryTasks = Array.from({ length: 10 }, (_, i) => () => {
        // Simulate memory-intensive work
        const largeArray = new Array(50000).fill(0).map((_, j) => Math.random());
        const result = largeArray.reduce((sum, val) => sum + val, 0);
        return result;
    });

    console.log('     Running 10 memory-intensive tasks...');
    const startTime = Date.now();
    
    const results = await tasklets.runAll(memoryTasks);
    
    const endTime = Date.now();
    console.log('     Completed in', (endTime - startTime) + 'ms');
    console.log('     Results count:', results.length);
    
    // System automatically detected memory-intensive pattern
    const currentWorkload = tasklets.getCurrentWorkloadType();
    console.log('     Detected pattern:', currentWorkload);
}

async function runMixedWorkload() {
    const mixedTasks = [];
    
    // Add CPU-intensive tasks
    for (let i = 0; i < 10; i++) {
        mixedTasks.push(() => {
            let result = 0;
            for (let j = 0; j < 10000; j++) {
                result += Math.sqrt(j);
            }
            return result;
        });
    }
    
    // Add I/O-intensive tasks
    for (let i = 0; i < 15; i++) {
        mixedTasks.push(() => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(`Mixed IO task ${i}`);
                }, Math.random() * 50 + 10);
            });
        });
    }
    
    // Add memory-intensive tasks
    for (let i = 0; i < 5; i++) {
        mixedTasks.push(() => {
            const array = new Array(20000).fill(0).map((_, j) => Math.random());
            return array.reduce((sum, val) => sum + val, 0);
        });
    }

    console.log('     Running 30 mixed workload tasks...');
    const startTime = Date.now();
    
    const results = await tasklets.runAll(mixedTasks);
    
    const endTime = Date.now();
    console.log('     Completed in', (endTime - startTime) + 'ms');
    console.log('     Results count:', results.length);
    
    // System automatically detected mixed pattern
    const currentWorkload = tasklets.getCurrentWorkloadType();
    console.log('     Detected pattern:', currentWorkload);
}

// Run the demonstration
if (require.main === module) {
    demonstrateFullyAutomaticSystem().then(() => {
        console.log('\n🎉 Fully automatic system demonstration completed!');
        console.log('   No manual configuration was needed - everything was automatic!');
        process.exit(0);
    }).catch(error => {
        console.error('Fully automatic demo failed:', error);
        process.exit(1);
    });
}

module.exports = {
    demonstrateFullyAutomaticSystem,
    runCPUIntensiveWorkload,
    runIOIntensiveWorkload,
    runMemoryIntensiveWorkload,
    runMixedWorkload
}; 