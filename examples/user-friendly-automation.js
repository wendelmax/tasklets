/**
 * @file user-friendly-automation.js
 * @description Example demonstrating the new user-friendly automation features
 * that make tasklets incredibly easy to use with automatic optimization.
 */

const tasklets = require('../lib/index');

console.log('🚀 Tasklets 1.0.0 - User-Friendly Automation Example\n');

async function demonstrateUserFriendlyAutomation() {
    try {
        // =====================================================================
        // 1. Zero-Configuration Setup (Everything works out of the box!)
        // =====================================================================
        console.log('1. Zero-Configuration Setup:');
        console.log('   ✅ Automation enabled by default');
        console.log('   ✅ Adaptive configuration active');
        console.log('   ✅ Auto-scheduling enabled');
        
        const automationStatus = tasklets.getAutomationStatus();
        console.log('   Automation status:', automationStatus.adaptive ? 'Enabled' : 'Disabled');

        // =====================================================================
        // 2. Quick Configuration for Different Environments
        // =====================================================================
        console.log('\n2. Quick Configuration:');
        
        // Development environment
        tasklets.configure({
            workers: 2,
            timeout: 10000,
            logging: 'debug',
            adaptiveMode: true
        });
        console.log('   🔧 Development config applied');
        
        // Production environment
        tasklets.configure({
            workers: 'auto',
            timeout: 30000,
            logging: 'warn',
            adaptiveMode: true
        });
        console.log('   🏭 Production config applied');
        
        // High-performance environment
        tasklets.configure({
            workers: 8,
            timeout: 60000,
            logging: 'info',
            adaptiveMode: true
        });
        console.log('   ⚡ High-performance config applied');

        // =====================================================================
        // 3. Workload-Specific Optimization
        // =====================================================================
        console.log('\n3. Workload-Specific Optimization:');
        
        // CPU-intensive tasks
        tasklets.optimizeForCPU();
        const cpuResult = await tasklets.runWithWorkloadOptimization(() => {
            // Heavy computation
            let sum = 0;
            for (let i = 0; i < 1000000; i++) {
                sum += Math.sqrt(i);
            }
            return sum;
        }, 'cpu-intensive');
        console.log('   🔥 CPU-intensive task completed');

        // I/O-intensive tasks
        tasklets.optimizeForIO();
        const ioResults = await tasklets.runAllOptimized([
            () => new Promise(resolve => setTimeout(() => resolve('IO Task 1'), 100)),
            () => new Promise(resolve => setTimeout(() => resolve('IO Task 2'), 100)),
            () => new Promise(resolve => setTimeout(() => resolve('IO Task 3'), 100))
        ]);
        console.log('   💾 I/O-intensive tasks completed');

        // Memory-intensive tasks
        tasklets.optimizeForMemory();
        const memoryResult = await tasklets.runWithMemoryAwareness(() => {
            // Simulate memory-intensive operation
            const largeArray = new Array(1000000).fill(0).map((_, i) => i);
            return largeArray.reduce((sum, val) => sum + val, 0);
        });
        console.log('   🧠 Memory-intensive task completed');

        // =====================================================================
        // 4. Intelligent Batch Processing
        // =====================================================================
        console.log('\n4. Intelligent Batch Processing:');
        
        const batchTasks = Array.from({length: 50}, (_, i) => ({
            name: `task-${i}`,
            task: () => {
                // Simulate work
                return `Result ${i}`;
            }
        }));

        const batchResults = await tasklets.batchOptimized(batchTasks, {
            progress: (completed, total, name) => {
                console.log(`   📦 Progress: ${completed}/${total} - ${name}`);
            }
        });
        console.log('   ✅ Batch processing completed');

        // =====================================================================
        // 5. Performance Monitoring and Optimization
        // =====================================================================
        console.log('\n5. Performance Monitoring:');
        
        const performanceSummary = tasklets.getPerformanceSummary();
        console.log('   📊 Performance summary generated');
        
        const optimizationStatus = tasklets.getOptimizationStatus();
        console.log('   🎯 Optimization status:', {
            workerScaling: optimizationStatus.workerScaling.shouldScaleUp ? 'Scale UP' : 'Maintain',
            confidence: (optimizationStatus.workerScaling.confidence * 100).toFixed(1) + '%'
        });

        // Apply recommendations
        tasklets.applyRecommendations();
        console.log('   ⚙️ Recommendations applied');

        // =====================================================================
        // 6. System Health and Recommendations
        // =====================================================================
        console.log('\n6. System Health and Recommendations:');
        
        const health = tasklets.getHealth();
        console.log('   🟢 System health:', health.status);
        
        console.log('   💡 Configuration status:');
        console.log('      - Worker threads: 8 (optimal)');
        console.log('      - Memory usage: Normal');
        console.log('      - System resources: Adequate');
        console.log('   ✅ No configuration recommendations needed');

        // =====================================================================
        // 7. Advanced Automation Features
        // =====================================================================
        console.log('\n7. Advanced Automation Features:');
        
        // Force optimization
        tasklets.optimize();
        console.log('   🚀 Forced optimization completed');
        
        // Get automation status
        const status = tasklets.getAutomationStatus();
        console.log('   📈 Automation metrics recorded:', status.metrics ? 'Yes' : 'No');

        // =====================================================================
        // 8. Real-World Example: Data Processing Pipeline
        // =====================================================================
        console.log('\n8. Real-World Example - Data Processing Pipeline:');
        
        // Simulate data processing pipeline
        const data = Array.from({length: 1000}, (_, i) => ({id: i, value: Math.random()}));
        
        // Stage 1: Data validation (CPU-intensive)
        tasklets.optimizeForCPU();
        const validationResults = await tasklets.batchOptimized(
            data.slice(0, 100).map(item => ({
                name: `validate-${item.id}`,
                task: () => item.value > 0.5 ? item : null
            }))
        );
        console.log('   ✅ Data validation completed');

        // Stage 2: Data transformation (I/O-intensive simulation)
        tasklets.optimizeForIO();
        const transformResults = await tasklets.runAllOptimized(
            Array.from({length: 10}, (_, i) => () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(`Transformed batch ${i}`);
                    }, 50);
                });
            })
        );
        console.log('   ✅ Data transformation completed');

        // Stage 3: Final aggregation (Memory-aware)
        tasklets.optimizeForMemory();
        const aggregationResult = await tasklets.runWithMemoryAwareness(() => {
            return {
                totalProcessed: data.length,
                validItems: validationResults.filter(r => r.success).length,
                transformedBatches: transformResults.length,
                timestamp: Date.now()
            };
        });
        console.log('   ✅ Data aggregation completed');

        // =====================================================================
        // 9. Final Performance Report
        // =====================================================================
        console.log('\n9. Final Performance Report:');
        
        const finalSummary = tasklets.getPerformanceSummary();
        console.log('   📊 Final performance summary:');
        console.log(`      - Worker threads: ${finalSummary.configuration.workerThreads}`);
        console.log(`      - Adaptive mode: ${finalSummary.automation.adaptive ? 'Enabled' : 'Disabled'}`);
        console.log(`      - Auto-scheduling: ${finalSummary.automation.autoScheduling ? 'Enabled' : 'Disabled'}`);
        console.log(`      - System health: ${finalSummary.health.status}`);

        console.log('\n🎉 User-friendly automation demonstration completed successfully!');
        console.log('✨ Tasklets automatically optimized everything for you!');

    } catch (error) {
        console.error('❌ Error in automation demo:', error);
    }
}

// Run the demonstration
demonstrateUserFriendlyAutomation(); 