/**
 * @file user-friendly-apis.js
 * @brief Example demonstrating the user-friendly promise-based APIs
 * @author Jackson Wendel Santos Sá
 * @date 2025
 * 
 * This example shows how to use the simplified APIs that return
 * promises and consistent JavaScript objects.
 */

const tasklets = require('../../lib');

async function demonstrateAdvancedAPIs() {
  console.log(' Tasklets - Advanced APIs Demo\n');

  try {
  // 1. Single Task Execution
  console.log('1. Single Task Execution:');
  const singleResult = await tasklets.run(() => {
    return 'Hello from single task!';
  });
  console.log('  Result:', singleResult);
  console.log();

  // 2. Parallel Task Execution
  console.log('2. Parallel Task Execution:');
  const arrayResult = await tasklets.runAll([
    () => 'Task 1 completed',
    () => 'Task 2 completed',
    () => 'Task 3 completed',
    () => 'Task 4 completed'
  ]);
  console.log('  Total Tasks:', arrayResult.length);
  console.log('  Results:', arrayResult.slice(0, 3), '...');
  console.log();

  // 3. Batch Processing
  console.log('3. Batch Processing:');
  const batchConfigs = Array.from({ length: 10 }, (_, i) => ({
    name: `task-${i}`,
    task: () => `Task ${i}: ${Math.pow(i, 2)}`
  }));
  
  const batchResult = await tasklets.batch(batchConfigs, {
    progress: (completed, total, name) => {
      console.log(`  Progress: ${completed}/${total} - ${name}`);
    }
  });
  console.log('  Total Tasks:', batchResult.length);
  console.log('  Sample Results:', batchResult.slice(0, 3), '...');
  console.log();

  // 4. System Statistics
  console.log('4. System Statistics:');
  const stats = tasklets.getStats();
  const health = tasklets.getHealth();
  console.log('  Stats:', stats);
  console.log('  Health Status:', health.status);
  console.log();

  // 5. Configuration
  console.log('5. Configuration:');
  tasklets.config({
    workers: 4,
    timeout: 30000,
    logging: 'info'
  });
  console.log('  Worker Threads:', tasklets.getWorkerThreadCount());
  console.log('  Log Level:', tasklets.getLogLevel());
  console.log();

  // 6. Retry Logic
  console.log('6. Retry Logic:');
  const retryResult = await tasklets.retry(() => {
    if (Math.random() > 0.7) {
      throw new Error('Random failure');
    }
    return 'Success after retry';
  }, {
    attempts: 3,
    delay: 1000
  });
  console.log('  Retry Result:', retryResult);
  console.log();

  // 7. Memory Management and Cleanup
  console.log('7. Memory Management and Cleanup:');
  
  // Run some tasks to demonstrate cleanup
  const cleanupTasks = Array.from({ length: 20 }, (_, i) => () => `Task ${i}`);
  await tasklets.runAll(cleanupTasks);
  
  // Show memory stats before cleanup
  const statsBefore = tasklets.getMemoryStats();
  console.log('  Active tasklets before cleanup:', statsBefore.activeTasklets);
  
  // Force cleanup for immediate results (especially useful in tests)
  tasklets.forceCleanup();
  
  // Show memory stats after cleanup
  const statsAfter = tasklets.getMemoryStats();
  console.log('  Active tasklets after cleanup:', statsAfter.activeTasklets);
  console.log('  Note: Small residual values are normal due to native delays');
  console.log();

  // 8. Shutdown Behavior (Idempotent)
  console.log('8. Shutdown Behavior:');
  
  // Set up shutdown event listener
  tasklets.on('shutdown', () => {
    console.log('  Shutdown event emitted');
  });
  
  // Demonstrate idempotent shutdown
  console.log('  Initiating shutdown...');
  await tasklets.shutdown({ timeout: 1000 });
  
  // Multiple shutdown calls should return immediately
  console.log('  Making additional shutdown calls (should return immediately)...');
  const startTime = Date.now();
  await tasklets.shutdown();
  await tasklets.shutdown();
  const endTime = Date.now();
  console.log(`  Additional shutdown calls completed in ${endTime - startTime}ms (should be < 100ms)`);
  console.log();

  console.log(' All API demonstrations completed successfully!');
  console.log('\n Summary of Available APIs:');
  console.log('  • run(taskFunction, options?) - Execute single task');
  console.log('  • runAll(tasks, options?) - Execute tasks in parallel');
  console.log('  • batch(taskConfigs, options?) - Batch processing with progress');
  console.log('  • retry(task, options?) - Retry with exponential backoff');
  console.log('  • config(options) - Configure tasklets');
  console.log('  • getStats() - Get performance statistics');
  console.log('  • getHealth() - Get system health');
  console.log('  • forceCleanup() - Force immediate cleanup (useful in tests)');
  console.log('  • shutdown(options?) - Graceful shutdown (idempotent)');
  console.log('\n Important Notes:');
  console.log('  • Progress callbacks in batch operations may vary in frequency');
  console.log('  • Memory counters may have small residual values (normal)');
  console.log('  • Shutdown is idempotent: multiple calls return immediately');
  console.log('  • Use forceCleanup() for deterministic results in tests');

  } catch (error) {
  console.error(' Error during demonstration:', error.message);
  console.error('Stack trace:', error.stack);
  } finally {
  // Ensure process terminates
  console.log('\n Exiting process...');
  process.exit(0);
  }
}

// Run the demonstration
demonstrateAdvancedAPIs().catch(console.error); 