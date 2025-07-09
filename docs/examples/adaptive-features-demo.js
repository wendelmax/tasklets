/**
 * @file adaptive-features-demo.js
 * @description Demonstrates the comprehensive adaptive features in the Tasklets lib
 */

const tasklets = require('../../lib/index');
const os = require('os');

console.log('=== Tasklets Adaptive Features Demo ===\n');

async function demonstrateAdaptiveFeatures() {
    try {
        // =====================================================================
        // 1. System Information and Adaptive Settings
        // =====================================================================
        console.log('1. System Information and Adaptive Settings:');
        console.log('=============================================');
        
        const systemInfo = tasklets.getSystemInfo();
        const adaptiveSettings = tasklets.getAdaptiveSettings();
        
        console.log(`System: ${systemInfo.cpu.count} cores, ${systemInfo.memory.totalMB}MB RAM`);
        console.log(`Platform: ${systemInfo.platform} (${systemInfo.arch})`);
        console.log(`System Type: ${systemInfo.isHighEnd ? 'High-end' : systemInfo.isMidRange ? 'Mid-range' : 'Low-end'}`);
        console.log();
        
        console.log('Adaptive Settings:');
        console.log(`├─ Optimal Worker Threads: ${adaptiveSettings.workerThreads}`);
        console.log(`├─ Adaptive Batch Size: ${adaptiveSettings.batchSize}`);
        console.log(`├─ Adaptive Poll Interval: ${adaptiveSettings.pollIntervalMs}ms`);
        console.log(`├─ Memory Limit: ${adaptiveSettings.memoryLimitMB}MB (${adaptiveSettings.memoryLimitPercent}%)`);
        console.log(`├─ Per-Task Memory Limit: ${adaptiveSettings.perTaskMemoryLimitMB}MB`);
        console.log(`└─ Stack Size: ${adaptiveSettings.stackSize / 1024}KB`);
        console.log();

        // =====================================================================
        // 2. Configuration Summary and Recommendations
        // =====================================================================
        console.log('2. Configuration Summary and Recommendations:');
        console.log('=============================================');
        
        const configSummary = tasklets.getConfigurationSummary();
        const recommendations = tasklets.getRecommendations();
        
        console.log('Current Configuration:');
        console.log(`├─ Workers: ${configSummary.current.workers}`);
        console.log(`├─ Memory Limit: ${configSummary.current.memoryLimitPercent}%`);
        console.log(`├─ Adaptive Mode: ${configSummary.current.adaptiveMode ? 'Enabled' : 'Disabled'}`);
        console.log(`└─ Workload Type: ${configSummary.current.workloadType}`);
        console.log();
        
        if (recommendations.length > 0) {
            console.log('System Recommendations:');
            recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec.type.toUpperCase()}: ${rec.message}`);
                console.log(`   Suggested: Workers=${rec.suggested.workers}, Batch=${rec.suggested.batchSize}, Memory=${rec.suggested.memoryLimitPercent}%`);
            });
            console.log();
        }

        // =====================================================================
        // 3. Workload-Specific Processing
        // =====================================================================
        console.log('3. Workload-Specific Processing:');
        console.log('================================');
        
        const testData = Array.from({ length: 1000 }, (_, i) => i);
        
        // CPU-Intensive Processing
        console.log('CPU-Intensive Processing:');
        const cpuStart = Date.now();
        const cpuResults = await tasklets.processCPUIntensive(testData, (item) => {
            // Simulate CPU-intensive work
            let result = 0;
            for (let i = 0; i < 10000; i++) {
                result += Math.sqrt(item + i);
            }
            return result;
        });
        const cpuTime = Date.now() - cpuStart;
        console.log(`├─ Processed ${cpuResults.length} items in ${cpuTime}ms`);
        console.log(`├─ Workload Type: ${tasklets.getWorkloadType()}`);
        console.log(`└─ Batch Size: ${tasklets.getAdaptiveBatchSize() * 2}`);
        console.log();

        // I/O-Intensive Processing
        console.log('I/O-Intensive Processing:');
        const ioStart = Date.now();
        const ioResults = await tasklets.processIOIntensive(testData, async (item) => {
            // Simulate I/O work
            await new Promise(resolve => setTimeout(resolve, 1));
            return item * 2;
        });
        const ioTime = Date.now() - ioStart;
        console.log(`├─ Processed ${ioResults.length} items in ${ioTime}ms`);
        console.log(`├─ Workload Type: ${tasklets.getWorkloadType()}`);
        console.log(`└─ Batch Size: ${Math.max(50, tasklets.getAdaptiveBatchSize() * 0.4)}`);
        console.log();

        // Memory-Intensive Processing
        console.log('Memory-Intensive Processing:');
        const memStart = Date.now();
        const memResults = await tasklets.processMemoryIntensive(testData, (item) => {
            // Simulate memory-intensive work
            const largeArray = new Array(1000).fill(item);
            return largeArray.reduce((sum, val) => sum + val, 0);
        });
        const memTime = Date.now() - memStart;
        console.log(`├─ Processed ${memResults.length} items in ${memTime}ms`);
        console.log(`├─ Workload Type: ${tasklets.getWorkloadType()}`);
        console.log(`└─ Batch Size: ${Math.max(25, tasklets.getAdaptiveBatchSize() * 0.2)}`);
        console.log();

        // =====================================================================
        // 4. Memory-Aware Processing
        // =====================================================================
        console.log('4. Memory-Aware Processing:');
        console.log('===========================');
        
        const memoryThreshold = tasklets.getMemoryPressureThreshold();
        console.log(`Memory Thresholds: Warning=${memoryThreshold.warning.toFixed(1)}%, Critical=${memoryThreshold.critical.toFixed(1)}%`);
        
        const memAwareStart = Date.now();
        const memAwareResults = await tasklets.processWithMemoryAwareness(testData, (item) => {
            // Simulate variable memory usage
            const memoryUsage = Math.random() > 0.5 ? new Array(500).fill(item) : new Array(50).fill(item);
            return memoryUsage.reduce((sum, val) => sum + val, 0);
        });
        const memAwareTime = Date.now() - memAwareStart;
        console.log(`├─ Processed ${memAwareResults.length} items in ${memAwareTime}ms`);
        console.log(`└─ Adaptive batch sizing based on memory pressure`);
        console.log();

        // =====================================================================
        // 5. Performance Monitoring
        // =====================================================================
        console.log('5. Performance Monitoring:');
        console.log('===========================');
        
        const performanceHistory = tasklets.getPerformanceHistory();
        console.log(`Performance History Entries: ${performanceHistory.length}`);
        
        if (performanceHistory.length > 0) {
            const recent = performanceHistory.slice(-5);
            console.log('Recent Performance Metrics:');
            recent.forEach((metric, index) => {
                console.log(`${index + 1}. Throughput: ${metric.throughput?.toFixed(2) || 'N/A'}/ms, Memory: ${metric.memoryUsage?.toFixed(1) || 'N/A'}MB`);
            });
        }
        console.log();

        // =====================================================================
        // 6. CPU Affinity and Advanced Settings
        // =====================================================================
        console.log('6. CPU Affinity and Advanced Settings:');
        console.log('=======================================');
        
        const cpuAffinity = tasklets.getCPUAffinitySettings();
        console.log(`CPU Affinity: ${cpuAffinity.enabled ? 'Enabled' : 'Disabled'}`);
        console.log(`Strategy: ${cpuAffinity.strategy}`);
        console.log(`Cores: ${cpuAffinity.cores.join(', ')}`);
        console.log();
        
        console.log('Advanced Settings:');
        console.log(`├─ Optimal Workers: ${tasklets.getOptimalWorkerThreads()}`);
        console.log(`├─ Adaptive Buffer Size: ${tasklets.getAdaptiveBufferSize()}`);
        console.log(`├─ Default Stack Size: ${tasklets.getDefaultStackSize() / 1024}KB`);
        console.log(`└─ Max Stack Size: ${tasklets.getMaxStackSize() / 1024}KB`);
        console.log();

        // =====================================================================
        // 7. Adaptive Mode Control
        // =====================================================================
        console.log('7. Adaptive Mode Control:');
        console.log('=========================');
        
        console.log(`Current Adaptive Mode: ${tasklets.isAdaptiveModeEnabled() ? 'Enabled' : 'Disabled'}`);
        
        // Disable adaptive mode
        tasklets.disableAdaptiveMode();
        console.log(`After disabling: ${tasklets.isAdaptiveModeEnabled() ? 'Enabled' : 'Disabled'}`);
        
        // Re-enable adaptive mode
        tasklets.enableAdaptiveMode();
        console.log(`After re-enabling: ${tasklets.isAdaptiveModeEnabled() ? 'Enabled' : 'Disabled'}`);
        console.log();

        // =====================================================================
        // 8. Real-World Example: Adaptive Batch Processing
        // =====================================================================
        console.log('8. Real-World Example: Adaptive Batch Processing');
        console.log('================================================');
        
        const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
            id: i,
            data: Math.random() * 1000,
            timestamp: Date.now()
        }));
        
        console.log(`Processing ${largeDataset.length} items with adaptive batch processing...`);
        
        const adaptiveStart = Date.now();
        const adaptiveResults = await tasklets.processBatchAdaptive(largeDataset, (item) => {
            // Simulate real-world data processing
            const processed = {
                id: item.id,
                result: Math.sqrt(item.data) * Math.PI,
                processedAt: Date.now()
            };
            return processed;
        });
        const adaptiveTime = Date.now() - adaptiveStart;
        
        console.log(`├─ Processed ${adaptiveResults.length} items in ${adaptiveTime}ms`);
        console.log(`├─ Average time per item: ${(adaptiveTime / adaptiveResults.length).toFixed(2)}ms`);
        console.log(`├─ Throughput: ${(adaptiveResults.length / adaptiveTime * 1000).toFixed(2)} items/second`);
        console.log(`└─ Batch size used: ${tasklets.getAdaptiveBatchSize()}`);
        console.log();

        console.log('=== Adaptive Features Demo Complete ===');
        console.log('\nKey Benefits Demonstrated:');
        console.log('├─ Automatic system capability detection');
        console.log('├─ Workload-specific optimization');
        console.log('├─ Memory-aware processing');
        console.log('├─ Performance monitoring and adaptation');
        console.log('├─ CPU affinity and resource management');
        console.log('└─ Zero manual configuration required');

    } catch (error) {
        console.error('Error in adaptive features demo:', error);
    }
}

// Run the demo
demonstrateAdaptiveFeatures().catch(console.error); 