/**
 * @file auto-scheduler-demo.js
 * @description This example demonstrates the intelligent auto-scheduler system
 * that automatically optimizes MicroJob and NativeThreadPool behavior based on
 * runtime metrics and workload patterns. It shows how the system automatically
 * adjusts worker threads, timeouts, priorities, and batching strategies.
 */

const tasklets = require('../../lib/tasklets');
const os = require('os');

console.log(' Tasklets 1.0.0 - Intelligent Auto-Scheduler Demo\n');

async function demonstrateAutoScheduler() {
    try {
        // Initialize auto-scheduler
        console.log('1. Initializing Auto-Scheduler:');
        console.log('   Enabling intelligent auto-scheduling...');
        tasklets.core.enable_auto_scheduling();
        
        console.log('   Auto-scheduling enabled:', tasklets.core.is_auto_scheduling_enabled());
        console.log('   System CPU cores:', os.cpus().length);
        console.log('   System memory:', Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB');

        // Show initial recommendations
        console.log('\n2. Initial Auto-Scheduling Recommendations:');
        const initialRecommendations = tasklets.core.get_auto_scheduling_recommendations();
        console.log('   Worker scaling:', initialRecommendations.should_scale_up ? 'Scale UP' : 
                   initialRecommendations.should_scale_down ? 'Scale DOWN' : 'Maintain');
        console.log('   Recommended workers:', initialRecommendations.recommended_worker_count);
        console.log('   Timeout adjustment:', initialRecommendations.should_adjust_timeout ? 'Yes' : 'No');
        console.log('   Priority adjustment:', initialRecommendations.should_adjust_priority ? 'Yes' : 'No');
        console.log('   Batching recommendation:', initialRecommendations.should_batch ? 'Yes' : 'No');

        // Demonstrate different workload patterns
        console.log('\n3. Demonstrating Workload Pattern Detection:');

        // CPU-intensive workload
        console.log('\n   CPU-Intensive Workload:');
        await demonstrateCPUIntensiveWorkload();

        // I/O-intensive workload
        console.log('\n   I/O-Intensive Workload:');
        await demonstrateIOIntensiveWorkload();

        // Memory-intensive workload
        console.log('\n   Memory-Intensive Workload:');
        await demonstrateMemoryIntensiveWorkload();

        // Burst workload
        console.log('\n   Burst Workload:');
        await demonstrateBurstWorkload();

        // Show final recommendations
        console.log('\n4. Final Auto-Scheduling Recommendations:');
        const finalRecommendations = tasklets.core.get_auto_scheduling_recommendations();
        console.log('   Worker scaling:', finalRecommendations.should_scale_up ? 'Scale UP' : 
                   finalRecommendations.should_scale_down ? 'Scale DOWN' : 'Maintain');
        console.log('   Recommended workers:', finalRecommendations.recommended_worker_count);
        console.log('   Worker scaling confidence:', (finalRecommendations.worker_scaling_confidence * 100).toFixed(1) + '%');
        console.log('   Timeout recommendation:', finalRecommendations.recommended_timeout_ms + 'ms');
        console.log('   Priority recommendation:', finalRecommendations.recommended_priority);
        console.log('   Batching recommendation:', finalRecommendations.recommended_batch_size + ' jobs/batch');

        // Apply recommendations
        console.log('\n5. Applying Auto-Scheduling Recommendations:');
        tasklets.core.apply_auto_scheduling_recommendations();
        
        // Show metrics history
        console.log('\n6. Auto-Scheduling Metrics History:');
        const metricsHistory = tasklets.core.get_auto_scheduling_metrics_history();
        console.log('   Total metrics recorded:', metricsHistory.length);
        
        if (metricsHistory.length > 0) {
            const recent = metricsHistory.slice(-3);
            recent.forEach((metrics, index) => {
                console.log(`   Sample ${index + 1}:`);
                console.log(`     Pattern: ${getPatternName(metrics.detected_pattern)}`);
                console.log(`     Complexity: ${getComplexityName(metrics.avg_complexity)}`);
                console.log(`     Worker utilization: ${metrics.worker_utilization.toFixed(1)}%`);
                console.log(`     Throughput: ${metrics.jobs_per_second.toFixed(1)} jobs/sec`);
                console.log(`     Load balance score: ${metrics.load_balance_score.toFixed(1)}`);
            });
        }

        // Demonstrate pattern detection accuracy
        console.log('\n7. Pattern Detection Analysis:');
        analyzePatternDetection(metricsHistory);

        console.log('\n Intelligent auto-scheduler demonstration completed successfully!');

    } catch (error) {
        console.error('Error in auto-scheduler demo:', error);
    }
}

async function demonstrateCPUIntensiveWorkload() {
    const cpuTasks = Array.from({ length: 30 }, (_, i) => () => {
        // Simulate CPU-intensive work
        let result = 0;
        for (let j = 0; j < 50000; j++) {
            result += Math.sqrt(j) * Math.sin(j) * Math.cos(j);
        }
        return result;
    });

    console.log('     Running 30 CPU-intensive tasks...');
    const startTime = Date.now();
    
    const results = await tasklets.runAll(cpuTasks);
    
    const endTime = Date.now();
    console.log('     Completed in', (endTime - startTime) + 'ms');
    console.log('     Results count:', results.length);
    
    // Show recommendations after CPU-intensive workload
    const recommendations = tasklets.core.get_auto_scheduling_recommendations();
    console.log('     Pattern detected:', getPatternName(recommendations.detected_pattern));
    console.log('     Worker scaling:', recommendations.should_scale_up ? 'Scale UP' : 'Maintain');
}

async function demonstrateIOIntensiveWorkload() {
    const ioTasks = Array.from({ length: 50 }, (_, i) => () => {
        // Simulate I/O-intensive work
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(`IO task ${i} completed`);
            }, Math.random() * 100 + 50); // 50-150ms delay
        });
    });

    console.log('     Running 50 I/O-intensive tasks...');
    const startTime = Date.now();
    
    const results = await tasklets.runAll(ioTasks);
    
    const endTime = Date.now();
    console.log('     Completed in', (endTime - startTime) + 'ms');
    console.log('     Results count:', results.length);
    
    // Show recommendations after I/O-intensive workload
    const recommendations = tasklets.core.get_auto_scheduling_recommendations();
    console.log('     Pattern detected:', getPatternName(recommendations.detected_pattern));
    console.log('     Worker scaling:', recommendations.should_scale_up ? 'Scale UP' : 'Maintain');
}

async function demonstrateMemoryIntensiveWorkload() {
    const memoryTasks = Array.from({ length: 15 }, (_, i) => () => {
        // Simulate memory-intensive work
        const largeArray = new Array(100000).fill(0).map((_, j) => Math.random());
        const result = largeArray.reduce((sum, val) => sum + val, 0);
        return result;
    });

    console.log('     Running 15 memory-intensive tasks...');
    const startTime = Date.now();
    
    const results = await tasklets.runAll(memoryTasks);
    
    const endTime = Date.now();
    console.log('     Completed in', (endTime - startTime) + 'ms');
    console.log('     Results count:', results.length);
    
    // Show recommendations after memory-intensive workload
    const recommendations = tasklets.core.get_auto_scheduling_recommendations();
    console.log('     Pattern detected:', getPatternName(recommendations.detected_pattern));
    console.log('     Batching recommendation:', recommendations.should_batch ? 'Yes' : 'No');
}

async function demonstrateBurstWorkload() {
    // Simulate burst workload with varying task complexity
    const burstTasks = [];
    
    // Add many simple tasks
    for (let i = 0; i < 40; i++) {
        burstTasks.push(() => {
            return Math.random() * 100;
        });
    }
    
    // Add some complex tasks
    for (let i = 0; i < 10; i++) {
        burstTasks.push(() => {
            let result = 0;
            for (let j = 0; j < 10000; j++) {
                result += Math.sqrt(j);
            }
            return result;
        });
    }

    console.log('     Running 50 burst workload tasks...');
    const startTime = Date.now();
    
    const results = await tasklets.runAll(burstTasks);
    
    const endTime = Date.now();
    console.log('     Completed in', (endTime - startTime) + 'ms');
    console.log('     Results count:', results.length);
    
    // Show recommendations after burst workload
    const recommendations = tasklets.core.get_auto_scheduling_recommendations();
    console.log('     Pattern detected:', getPatternName(recommendations.detected_pattern));
    console.log('     Load balancing:', recommendations.should_rebalance ? 'Yes' : 'No');
}

function getPatternName(pattern) {
    const patterns = {
        0: 'CPU_INTENSIVE',
        1: 'IO_INTENSIVE', 
        2: 'MEMORY_INTENSIVE',
        3: 'MIXED',
        4: 'BURST',
        5: 'STEADY'
    };
    return patterns[pattern] || 'UNKNOWN';
}

function getComplexityName(complexity) {
    const complexities = {
        0: 'TRIVIAL',
        1: 'SIMPLE',
        2: 'MODERATE',
        3: 'COMPLEX',
        4: 'HEAVY'
    };
    return complexities[complexity] || 'UNKNOWN';
}

function analyzePatternDetection(metricsHistory) {
    if (metricsHistory.length < 2) {
        console.log('   Insufficient data for pattern analysis');
        return;
    }

    const patterns = metricsHistory.map(m => m.detected_pattern);
    const patternCounts = {};
    
    patterns.forEach(pattern => {
        const name = getPatternName(pattern);
        patternCounts[name] = (patternCounts[name] || 0) + 1;
    });

    console.log('   Pattern distribution:');
    Object.entries(patternCounts).forEach(([pattern, count]) => {
        const percentage = (count / patterns.length * 100).toFixed(1);
        console.log(`     ${pattern}: ${count} times (${percentage}%)`);
    });

    // Analyze complexity trends
    const complexities = metricsHistory.map(m => m.avg_complexity);
    const avgComplexity = complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
    console.log('   Average complexity:', getComplexityName(Math.round(avgComplexity)));
}

// Run the demonstration
if (require.main === module) {
    demonstrateAutoScheduler().then(() => {
        console.log('\n Auto-scheduler demonstration completed successfully!');
        process.exit(0);
    }).catch(error => {
        console.error('Auto-scheduler demonstration failed:', error);
        process.exit(1);
    });
}

module.exports = {
    demonstrateAutoScheduler,
    demonstrateCPUIntensiveWorkload,
    demonstrateIOIntensiveWorkload,
    demonstrateMemoryIntensiveWorkload,
    demonstrateBurstWorkload
}; 