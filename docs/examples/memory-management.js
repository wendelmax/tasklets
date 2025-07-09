/**
 * @file memory-management.js
 * @description Example demonstrating proper memory management, cleanup, and shutdown practices
 * @author Jackson Wendel Santos Sá
 * @date 2025
 * 
 * This example shows how to properly handle memory management, cleanup,
 * and shutdown in different scenarios including test environments.
 */

const tasklets = require('../../lib');

async function demonstrateMemoryManagement() {
  console.log(' Tasklets - Memory Management Best Practices\n');

  try {
    // Configure for demonstration
    tasklets.config({
      workers: 4,
      timeout: 10000,
      logging: 'info'
    });

    // 1. Basic Memory Monitoring
    console.log('1. Basic Memory Monitoring:');
    const initialStats = tasklets.getMemoryStats();
    console.log('  Initial active tasklets:', initialStats.activeTasklets);
    console.log('  Initial object pool available:', initialStats.objectPool.available);
    console.log();

    // 2. Task Execution and Memory Tracking
    console.log('2. Task Execution and Memory Tracking:');
    
    const numTasks = 50;
    const tasks = Array.from({ length: numTasks }, (_, i) => () => {
      // Simulate some work
      let result = 0;
      for (let j = 0; j < 10000; j++) {
        result += Math.sqrt(j + i);
      }
      return `Task ${i}: ${result.toFixed(2)}`;
    });

    // Execute tasks
    const results = await tasklets.runAll(tasks);
    
    const afterExecutionStats = tasklets.getMemoryStats();
    console.log('  Tasks completed:', results.length);
    console.log('  Active tasklets after execution:', afterExecutionStats.activeTasklets);
    console.log('  Object pool available after execution:', afterExecutionStats.objectPool.available);
    console.log();

    // 3. Automatic vs Manual Cleanup
    console.log('3. Automatic vs Manual Cleanup:');
    
    // Wait for automatic cleanup
    console.log('  Waiting for automatic cleanup...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const afterAutoCleanup = tasklets.getMemoryStats();
    console.log('  Active tasklets after auto cleanup:', afterAutoCleanup.activeTasklets);
    console.log('  Note: Automatic cleanup timing may vary');
    
    // Force manual cleanup for immediate results
    console.log('  Forcing manual cleanup...');
    tasklets.forceCleanup();
    
    const afterManualCleanup = tasklets.getMemoryStats();
    console.log('  Active tasklets after manual cleanup:', afterManualCleanup.activeTasklets);
    console.log('  Object pool available after manual cleanup:', afterManualCleanup.objectPool.available);
    console.log('  Note: Small residual values are normal due to native delays');
    console.log();

    // 4. Batch Processing with Memory Awareness
    console.log('4. Batch Processing with Memory Awareness:');
    
    const batchSize = 20;
    const batchConfigs = Array.from({ length: batchSize }, (_, i) => ({
      name: `memory-task-${i}`,
      task: () => {
        // Simulate memory-intensive work
        const data = new Array(1000).fill(0).map(() => Math.random());
        return data.reduce((sum, val) => sum + val, 0);
      }
    }));

    const batchResults = await tasklets.batch(batchConfigs, {
      onProgress: (progress) => {
        process.stdout.write(`\r  Batch progress: ${progress.percentage}% (${progress.completed}/${progress.total})`);
      }
    });
    
    console.log('\n  Batch completed');
    console.log('  Note: Progress callback frequency may vary due to parallel execution');
    console.log('  Successful tasks:', batchResults.filter(r => r.success).length);
    console.log();

    // 5. Memory Stress Test
    console.log('5. Memory Stress Test:');
    
    const stressTasks = Array.from({ length: 100 }, (_, i) => () => {
      // Create some temporary data
      const tempData = new Array(500).fill(0).map(() => Math.random());
      const result = tempData.reduce((sum, val) => sum + val, 0);
      return `Stress task ${i}: ${result.toFixed(2)}`;
    });

    const stressResults = await tasklets.runAll(stressTasks);
    console.log('  Stress test completed:', stressResults.length, 'tasks');
    
    const stressStats = tasklets.getMemoryStats();
    console.log('  Active tasklets after stress test:', stressStats.activeTasklets);
    console.log('  Object pool available after stress test:', stressStats.objectPool.available);
    console.log();

    // 6. Proper Cleanup for Test Environments
    console.log('6. Proper Cleanup for Test Environments:');
    
    // This is especially important in test environments
    console.log('  Forcing cleanup for deterministic results...');
    tasklets.forceCleanup();
    
    const finalStats = tasklets.getMemoryStats();
    console.log('  Final active tasklets:', finalStats.activeTasklets);
    console.log('  Final object pool available:', finalStats.objectPool.available);
    console.log('  Note: In test environments, always call forceCleanup() for consistent results');
    console.log();

    // 7. Shutdown Behavior Demonstration
    console.log('7. Shutdown Behavior Demonstration:');
    
    // Set up event listener
    tasklets.on('shutdown', () => {
      console.log('  Shutdown event emitted');
    });

    console.log('  Initiating shutdown...');
    const shutdownStart = Date.now();
    await tasklets.shutdown({ timeout: 1000 });
    const shutdownTime = Date.now() - shutdownStart;
    console.log(`  First shutdown completed in ${shutdownTime}ms`);

    // Demonstrate idempotent behavior
    console.log('  Testing idempotent shutdown behavior...');
    const additionalStart = Date.now();
    await tasklets.shutdown();
    await tasklets.shutdown();
    const additionalTime = Date.now() - additionalStart;
    console.log(`  Additional shutdown calls completed in ${additionalTime}ms (should be < 100ms)`);
    console.log('  Note: Shutdown is idempotent - multiple calls return immediately');
    console.log();

    console.log(' Memory management demonstration completed successfully!');
    console.log('\n Best Practices Demonstrated:');
    console.log('  • Monitor memory usage during task execution');
    console.log('  • Use forceCleanup() for immediate results');
    console.log('  • Always call forceCleanup() in test environments');
    console.log('  • Handle shutdown properly with event listeners');
    console.log('  • Understand that shutdown is idempotent');
    console.log('  • Allow for small residual values in memory counters');
    console.log('  • Progress callbacks may vary in frequency');

  } catch (error) {
    console.error(' Error during memory management demonstration:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Ensure process terminates
    console.log('\n Exiting process...');
    process.exit(0);
  }
}

// Run the demonstration
demonstrateMemoryManagement().catch(console.error); 