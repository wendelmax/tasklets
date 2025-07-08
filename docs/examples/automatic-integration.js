const tasklets = require('../../lib/tasklets');

async function demonstrateAutomaticIntegration() {
    console.log('🚀 Tasklets - Automatic Integration Demo\n');

    try {
        // 1. Single Task (Auto-Scheduler records metrics automatically)
        console.log('1️⃣ Single Task - Auto-Scheduler Integration:');
        const singleResult = await tasklets.run(() => {
            // Simulate some work
            let sum = 0;
            for (let i = 0; i < 1000000; i++) {
                sum += Math.sqrt(i);
            }
            return `Sum: ${sum.toFixed(2)}`;
        });
        console.log('   Result:', singleResult.data);
        console.log('   Auto-Scheduler automatically recorded job metrics');
        console.log();

        // 2. Small Array Batch (Auto-Config records pattern)
        console.log('2️⃣ Small Array Batch - Auto-Config Integration:');
        const smallBatchResult = await tasklets.run([
            () => 'Task 1',
            () => 'Task 2',
            () => 'Task 3',
            () => 'Task 4',
            () => 'Task 5'
        ]);
        console.log('   Total Tasks:', smallBatchResult.totalTasks);
        console.log('   Auto-Config automatically recorded batch pattern');
        console.log();

        // 3. Large Batch (Multiprocessor + Auto-Config integration)
        console.log('3️⃣ Large Batch - Multiprocessor + Auto-Config Integration:');
        const startTime = Date.now();
        
        const largeBatchResult = await tasklets.run(5000, (index) => {
            // Simulate CPU-intensive work
            let result = 0;
            for (let i = 0; i < 10000; i++) {
                result += Math.pow(index + i, 2);
            }
            return `Task ${index}: ${result}`;
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('   Total Tasks:', largeBatchResult.totalTasks);
        console.log('   Execution Time:', duration, 'ms');
        console.log('   Tasks per second:', Math.round(5000 / (duration / 1000)));
        console.log('   Auto-Config recorded large batch pattern');
        console.log('   Multiprocessor optimization was applied');
        console.log();

        // 4. Check Auto-Config Recommendations
        console.log('4️⃣ Auto-Config Recommendations (After Batch Processing):');
        const autoConfigRecs = await tasklets.getAutoConfigRecommendations();
        console.log('   Recommended Worker Count:', autoConfigRecs.recommendedWorkerCount);
        console.log('   Should Scale Up:', autoConfigRecs.shouldScaleUp);
        console.log('   Should Scale Down:', autoConfigRecs.shouldScaleDown);
        console.log('   Worker Scaling Confidence:', autoConfigRecs.workerScalingConfidence);
        console.log('   Should Adjust Memory:', autoConfigRecs.shouldAdjustMemory);
        console.log('   Memory Confidence:', autoConfigRecs.memoryConfidence);
        console.log('   Should Adjust Timeout:', autoConfigRecs.shouldAdjustTimeout);
        console.log('   Timeout Confidence:', autoConfigRecs.timeoutConfidence);
        console.log();

        // 5. Check Auto-Scheduler Recommendations
        console.log('5️⃣ Auto-Scheduler Recommendations (After Job Execution):');
        const autoSchedulerRecs = await tasklets.getAutoSchedulerRecommendations();
        console.log('   Recommended Worker Count:', autoSchedulerRecs.recommendedWorkerCount);
        console.log('   Should Scale Up:', autoSchedulerRecs.shouldScaleUp);
        console.log('   Should Scale Down:', autoSchedulerRecs.shouldScaleDown);
        console.log('   Worker Scaling Confidence:', autoSchedulerRecs.workerScalingConfidence);
        console.log('   Recommended Batch Size:', autoSchedulerRecs.recommendedBatchSize);
        console.log('   Should Batch:', autoSchedulerRecs.shouldBatch);
        console.log('   Batching Confidence:', autoSchedulerRecs.batchingConfidence);
        console.log('   Should Rebalance:', autoSchedulerRecs.shouldRebalance);
        console.log('   Load Balance Confidence:', autoSchedulerRecs.loadBalanceConfidence);
        console.log();

        // 6. Check Workload Pattern Detection
        console.log('6️⃣ Workload Pattern Detection:');
        const workloadPattern = await tasklets.getWorkloadPattern();
        console.log('   Detected Pattern:', workloadPattern.pattern);
        console.log('   Description:', workloadPattern.description);
        console.log('   Pattern detected automatically based on job execution');
        console.log();

        // 7. Check Multiprocessor Statistics
        console.log('7️⃣ Multiprocessor Statistics:');
        const multiprocessorStats = await tasklets.getMultiprocessorStats();
        console.log('   Enabled:', multiprocessorStats.enabled);
        console.log('   Optimal Thread Count:', multiprocessorStats.optimalThreadCount);
        console.log('   Total Operations:', multiprocessorStats.totalOperations);
        console.log('   Successful Operations:', multiprocessorStats.successfulOperations);
        console.log('   Failed Operations:', multiprocessorStats.failedOperations);
        console.log('   Average Processing Time (ms):', multiprocessorStats.averageProcessingTimeMs);
        console.log('   Operations per Second:', multiprocessorStats.operationsPerSecond);
        console.log();

        // 8. Performance Metrics History
        console.log('8️⃣ Performance Metrics History:');
        const performanceMetrics = await tasklets.getPerformanceMetrics();
        console.log('   Auto-Config Metrics Count:', performanceMetrics.autoConfig.length);
        console.log('   Auto-Scheduler Metrics Count:', performanceMetrics.autoScheduler.length);
        
        if (performanceMetrics.autoConfig.length > 0) {
            const latestConfig = performanceMetrics.autoConfig[performanceMetrics.autoConfig.length - 1];
            console.log('   Latest Auto-Config Metrics:');
            console.log('     CPU Utilization:', latestConfig.cpuUtilization + '%');
            console.log('     Memory Usage:', latestConfig.memoryUsagePercent + '%');
            console.log('     Worker Count:', latestConfig.workerCount);
            console.log('     Active Jobs:', latestConfig.activeJobs);
            console.log('     Completed Jobs:', latestConfig.completedJobs);
            console.log('     Failed Jobs:', latestConfig.failedJobs);
            console.log('     Worker Utilization:', (latestConfig.workerUtilization * 100).toFixed(2) + '%');
            console.log('     Average Execution Time:', latestConfig.averageExecutionTimeMs + 'ms');
        }
        console.log();

        // 9. Force Optimization Analysis
        console.log('9️⃣ Force Optimization Analysis:');
        const optimizationResult = await tasklets.forceOptimization();
        console.log('   Success:', optimizationResult.success);
        console.log('   Message:', optimizationResult.message);
        console.log('   Timestamp:', new Date(optimizationResult.timestamp).toISOString());
        console.log('   Forced immediate analysis of all systems');
        console.log();

        // 10. Comprehensive System Status
        console.log('🔟 Comprehensive System Status:');
        const systemInfo = await tasklets.getSystemInfo();
        console.log('   All Systems Initialized:');
        console.log('     Memory Manager:', systemInfo.status.memory_manager_initialized);
        console.log('     Auto Config:', systemInfo.status.auto_config_initialized);
        console.log('     Auto Scheduler:', systemInfo.status.auto_scheduler_initialized);
        console.log('     Multiprocessor:', systemInfo.status.multiprocessor_initialized);
        console.log('   Current Performance:');
        console.log('     CPU Utilization:', systemInfo.status.cpu_utilization + '%');
        console.log('     Memory Usage:', systemInfo.status.memory_usage_percent + '%');
        console.log('     Active Tasks:', systemInfo.status.active_tasklets.toString());
        console.log('     Worker Threads:', systemInfo.status.worker_threads);
        console.log();

        console.log('✅ Automatic Integration Demo Completed Successfully!');
        console.log('\n📊 Summary of Automatic Features:');
        console.log('   ✅ Auto-Scheduler: Records job metrics automatically');
        console.log('   ✅ Auto-Config: Records batch patterns automatically');
        console.log('   ✅ Multiprocessor: Optimizes large batches automatically');
        console.log('   ✅ Workload Detection: Analyzes patterns automatically');
        console.log('   ✅ Performance Monitoring: Tracks metrics automatically');
        console.log('   ✅ Optimization: Provides recommendations automatically');
        console.log('\n🎯 The system is now fully integrated and self-optimizing!');

    } catch (error) {
        console.error('❌ Error during automatic integration demonstration:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the demonstration
demonstrateAutomaticIntegration().catch(console.error); 