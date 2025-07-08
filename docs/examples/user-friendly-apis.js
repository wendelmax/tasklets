/**
 * @file user-friendly-apis.js
 * @brief Example demonstrating the new user-friendly promise-based APIs
 * @author Jackson Wendel Santos Sá
 * @date 2025
 * 
 * This example shows how to use the new simplified APIs that return
 * promises and consistent JavaScript objects.
 */

const tasklets = require('../../lib/tasklets');

async function demonstrateAdvancedAPIs() {
    console.log('🚀 Tasklets - Advanced APIs Demo\n');

    try {
        // 1. Unified Run API (Single Task)
        console.log('1️⃣ Unified Run API - Single Task:');
        const singleResult = await tasklets.run(() => {
            return 'Hello from single task!';
        });
        console.log('   Result:', singleResult);
        console.log('   Type:', singleResult.type);
        console.log();

        // 2. Unified Run API - Array of Tasks (Auto-batch)
        console.log('2️⃣ Unified Run API - Array of Tasks (Auto-batch):');
        const arrayResult = await tasklets.run([
            () => 'Task 1 completed',
            () => 'Task 2 completed',
            () => 'Task 3 completed',
            () => 'Task 4 completed'
        ]);
        console.log('   Type:', arrayResult.type);
        console.log('   Total Tasks:', arrayResult.totalTasks);
        console.log('   Successful:', arrayResult.successfulTasks);
        console.log('   Failed:', arrayResult.failedTasks);
        console.log('   Results:', arrayResult.results.slice(0, 3), '...');
        console.log();

        // 3. Unified Run API - Batch with Count (Auto-batch)
        console.log('3️⃣ Unified Run API - Batch with Count (Auto-batch):');
        const batchResult = await tasklets.run(1000, (index) => {
            const result = Math.pow(index, 2);
            return `Task ${index}: ${result}`;
        });
        console.log('   Type:', batchResult.type);
        console.log('   Total Tasks:', batchResult.totalTasks);
        console.log('   Successful:', batchResult.successfulTasks);
        console.log('   Failed:', batchResult.failedTasks);
        console.log('   Sample Results:', batchResult.results.slice(0, 3), '...');
        console.log();

        // 4. Comprehensive System Information
        console.log('4️⃣ Comprehensive System Information:');
        const systemInfo = await tasklets.getSystemInfo();
        console.log('   CPU Cores:', systemInfo.cpuCores);
        console.log('   Thread Pool Size:', systemInfo.threadPoolSize);
        console.log('   Memory Usage:', systemInfo.memoryUsage);
        console.log('   Active Tasks:', systemInfo.activeTasks);
        console.log('   Completed Tasks:', systemInfo.completedTasks);
        console.log('   Failed Tasks:', systemInfo.failedTasks);
        console.log();

        // 5. Auto-Configuration Recommendations
        console.log('5️⃣ Auto-Configuration Recommendations:');
        const autoConfigRecs = await tasklets.getAutoConfigRecommendations();
        console.log('   Enabled:', autoConfigRecs.enabled);
        console.log('   Recommended Worker Count:', autoConfigRecs.recommendedWorkerCount);
        console.log('   Should Scale Up:', autoConfigRecs.shouldScaleUp);
        console.log('   Should Scale Down:', autoConfigRecs.shouldScaleDown);
        console.log('   Worker Scaling Confidence:', autoConfigRecs.workerScalingConfidence);
        console.log('   Recommended Memory Limit %:', autoConfigRecs.recommendedMemoryLimitPercent);
        console.log('   Should Adjust Memory:', autoConfigRecs.shouldAdjustMemory);
        console.log('   Memory Confidence:', autoConfigRecs.memoryConfidence);
        console.log('   Recommended Timeout (ms):', autoConfigRecs.recommendedTimeoutMs);
        console.log('   Should Adjust Timeout:', autoConfigRecs.shouldAdjustTimeout);
        console.log('   Timeout Confidence:', autoConfigRecs.timeoutConfidence);
        console.log();

        // 6. Auto-Scheduler Recommendations
        console.log('6️⃣ Auto-Scheduler Recommendations:');
        const autoSchedulerRecs = await tasklets.getAutoSchedulerRecommendations();
        console.log('   Enabled:', autoSchedulerRecs.enabled);
        console.log('   Recommended Worker Count:', autoSchedulerRecs.recommendedWorkerCount);
        console.log('   Should Scale Up:', autoSchedulerRecs.shouldScaleUp);
        console.log('   Should Scale Down:', autoSchedulerRecs.shouldScaleDown);
        console.log('   Worker Scaling Confidence:', autoSchedulerRecs.workerScalingConfidence);
        console.log('   Recommended Timeout (ms):', autoSchedulerRecs.recommendedTimeoutMs);
        console.log('   Should Adjust Timeout:', autoSchedulerRecs.shouldAdjustTimeout);
        console.log('   Timeout Confidence:', autoSchedulerRecs.timeoutConfidence);
        console.log('   Recommended Priority:', autoSchedulerRecs.recommendedPriority);
        console.log('   Should Adjust Priority:', autoSchedulerRecs.shouldAdjustPriority);
        console.log('   Priority Confidence:', autoSchedulerRecs.priorityConfidence);
        console.log('   Recommended Batch Size:', autoSchedulerRecs.recommendedBatchSize);
        console.log('   Should Batch:', autoSchedulerRecs.shouldBatch);
        console.log('   Batching Confidence:', autoSchedulerRecs.batchingConfidence);
        console.log('   Should Rebalance:', autoSchedulerRecs.shouldRebalance);
        console.log('   Load Balance Confidence:', autoSchedulerRecs.loadBalanceConfidence);
        console.log();

        // 7. Workload Pattern Detection
        console.log('7️⃣ Workload Pattern Detection:');
        const workloadPattern = await tasklets.getWorkloadPattern();
        console.log('   Pattern:', workloadPattern.pattern);
        console.log('   Description:', workloadPattern.description);
        console.log('   Timestamp:', new Date(workloadPattern.timestamp).toISOString());
        console.log();

        // 8. Multiprocessor Statistics
        console.log('8️⃣ Multiprocessor Statistics:');
        const multiprocessorStats = await tasklets.getMultiprocessorStats();
        console.log('   Enabled:', multiprocessorStats.enabled);
        console.log('   Optimal Thread Count:', multiprocessorStats.optimalThreadCount);
        console.log('   Process Count:', multiprocessorStats.processCount);
        console.log('   Total Operations:', multiprocessorStats.totalOperations);
        console.log('   Successful Operations:', multiprocessorStats.successfulOperations);
        console.log('   Failed Operations:', multiprocessorStats.failedOperations);
        console.log('   Average Processing Time (ms):', multiprocessorStats.averageProcessingTimeMs);
        console.log('   Total Processing Time (ms):', multiprocessorStats.totalProcessingTimeMs);
        console.log('   Operations per Second:', multiprocessorStats.operationsPerSecond);
        console.log();

        // 9. Performance Metrics History
        console.log('9️⃣ Performance Metrics History:');
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

        // 10. Force Optimization
        console.log('🔟 Force Optimization:');
        const optimizationResult = await tasklets.forceOptimization();
        console.log('   Success:', optimizationResult.success);
        console.log('   Message:', optimizationResult.message);
        console.log('   Timestamp:', new Date(optimizationResult.timestamp).toISOString());
        console.log();

        // 11. Advanced System Status
        console.log('1️⃣1️⃣ Advanced System Status:');
        console.log('   Status:', systemInfo.status);
        console.log('   Memory:', systemInfo.memory);
        console.log('   Thread Pool:', systemInfo.threadPool);
        console.log('   Auto Config:', systemInfo.autoConfig);
        console.log('   Auto Scheduler:', systemInfo.autoScheduler);
        console.log('   Multiprocessor:', systemInfo.multiprocessor);
        console.log();

        console.log('✅ All advanced API demonstrations completed successfully!');
        console.log('\n📊 Summary of Available APIs:');
        console.log('   • run(task | tasks | count, task) - Unified execution API');
        console.log('   • getSystemInfo() - Comprehensive system information');
        console.log('   • getAutoConfigRecommendations() - Auto-configuration recommendations');
        console.log('   • getAutoSchedulerRecommendations() - Auto-scheduler recommendations');
        console.log('   • getWorkloadPattern() - Workload pattern detection');
        console.log('   • getMultiprocessorStats() - Multiprocessor statistics');
        console.log('   • getPerformanceMetrics() - Performance metrics history');
        console.log('   • forceOptimization() - Force immediate optimization analysis');

    } catch (error) {
        console.error('❌ Error during demonstration:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the demonstration
demonstrateAdvancedAPIs().catch(console.error); 