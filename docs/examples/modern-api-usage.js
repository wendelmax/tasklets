/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 * 
 * @file modern-api-usage.js
 * @brief Example showcasing the modern user-friendly tasklets API
 */

const tasklets = require('../../lib/index');

async function modernApiExample() {
  console.log('=== Modern Tasklets API Example ===\n');

  // 1. Configure tasklets
  console.log('1. Configuring tasklets...');
  tasklets.config({
  workers: 'auto',  // Auto-detect CPU cores
  timeout: 10000,  // 10 second default timeout
  logging: 'info'  // Info level logging
  });

  // Show initial health status
  const initialHealth = tasklets.getHealth();
  console.log('Initial health:', initialHealth);
  console.log('');

  // 2. Run a single task
  console.log('2. Running a single task...');
  try {
  const result = await tasklets.run(() => {
  // Simulate heavy computation
  const start = Date.now();
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
  sum += Math.sqrt(i);
  }
  const duration = Date.now() - start;
  return { sum, duration };
  });

  console.log('Single task result:', result);
  } catch (error) {
  console.error('Single task failed:', error.message);
  }
  console.log('');

  // 3. Run multiple tasks in parallel
  console.log('3. Running multiple tasks in parallel...');
  try {
  const tasks = [
  () => fibonacci(35),
  () => fibonacci(36),
  () => fibonacci(37)
  ];

  const results = await tasklets.runAll(tasks);
  console.log('Parallel results:', results);
  } catch (error) {
  console.error('Parallel tasks failed:', error.message);
  }
  console.log('');

  // 4. Batch processing with progress tracking
  console.log('4. Batch processing with progress tracking...');
  try {
  const batchTasks = [
  { name: 'process-data-1', task: () => processData('dataset1') },
  { name: 'process-data-2', task: () => processData('dataset2') },
  { name: 'process-data-3', task: () => processData('dataset3') },
  { name: 'process-data-4', task: () => processData('dataset4') },
  { name: 'process-data-5', task: () => processData('dataset5') }
  ];

  const batchResults = await tasklets.batch(batchTasks, {
  onProgress: (progress) => {
  console.log(`Progress: ${progress.percentage}% (${progress.completed}/${progress.total})`);
  }
  });

  console.log('Batch results:', batchResults);
  } catch (error) {
  console.error('Batch processing failed:', error.message);
  }
  console.log('');

  // 5. Retry with exponential backoff
  console.log('5. Retry with exponential backoff...');
  try {
  const retryResult = await tasklets.retry(() => {
  // Simulate unreliable operation
  if (Math.random() < 0.7) {
  throw new Error('Random failure');
  }
  return 'Success after retry!';
  }, {
  attempts: 5,
  delay: 100,
  backoff: 2
  });

  console.log('Retry result:', retryResult);
  } catch (error) {
  console.error('Retry failed:', error.message);
  }
  console.log('');

  // 6. Get performance statistics
  console.log('6. Performance statistics...');
  const stats = tasklets.getStats();
  console.log('Current stats:', {
  workers: stats.workers,
  completedTasks: stats.tasks.completed,
  activeTasks: stats.tasks.active,
  throughput: stats.performance.throughput,
  cpuCores: stats.system.cpuCores,
  memoryUsage: Math.round(stats.system.memoryUsage.heapUsed / 1024 / 1024) + 'MB'
  });
  console.log('');

  // 7. Health check
  console.log('7. Health check...');
  const health = tasklets.getHealth();
  console.log('Health status:', health);
  console.log('');

  // 8. Graceful shutdown
  console.log('8. Graceful shutdown...');
  try {
  await tasklets.shutdown({ timeout: 5000 });
  console.log('Shutdown completed successfully');
  } catch (error) {
  console.error('Shutdown failed:', error.message);
  }
}

// Helper functions
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function processData(dataset) {
  // Simulate data processing
  const start = Date.now();
  let processed = 0;

  for (let i = 0; i < 100000; i++) {
  processed += Math.random() * 100;
  }

  const duration = Date.now() - start;
  return {
  dataset,
  processed: Math.round(processed),
  duration
  };
}

// Advanced usage examples
async function advancedExamples() {
  console.log('\n=== Advanced Usage Examples ===\n');

  // Task with custom timeout
  console.log('1. Task with custom timeout...');
  try {
  const result = await tasklets.run(() => {
  // This will timeout
  return new Promise(resolve => setTimeout(() => resolve('Done'), 2000));
  }, { timeout: 1000 });

  console.log('Custom timeout result:', result);
  } catch (error) {
  console.log('Expected timeout error:', error.message);
  }
  console.log('');

  // Error handling in batch
  console.log('2. Error handling in batch...');
  const mixedTasks = [
  { name: 'success-task', task: () => 'Success!' },
  { name: 'error-task', task: () => { throw new Error('Intentional error'); } },
  { name: 'another-success', task: () => 'Also success!' }
  ];

  const mixedResults = await tasklets.batch(mixedTasks);
  console.log('Mixed results:', mixedResults);
  console.log('');

  // Configuration chaining
  console.log('3. Configuration chaining...');
  const chainedConfig = tasklets
  .config({ workers: 4 })
  .config({ logging: 'debug' })
  .config({ timeout: 5000 });

  console.log('Chained configuration applied');
  console.log('');
}

// Error handling examples
async function errorHandlingExamples() {
  console.log('\n=== Error Handling Examples ===\n');

  // Try-catch with single task
  console.log('1. Try-catch with single task...');
  try {
  await tasklets.run(() => {
  throw new Error('Task failed');
  });
  } catch (error) {
  console.log('Caught error:', error.message);
  }
  console.log('');

  // Promise.allSettled equivalent
  console.log('2. Handle multiple task failures...');
  const unreliableTasks = [
  () => 'Success 1',
  () => { throw new Error('Failure 1'); },
  () => 'Success 2',
  () => { throw new Error('Failure 2'); }
  ];

  const settledResults = await Promise.allSettled(
  unreliableTasks.map(task => tasklets.run(task))
  );

  console.log('Settled results:', settledResults.map(result => ({
  status: result.status,
  value: result.value || result.reason?.message
  })));
  console.log('');
}

// Run all examples
async function runAllExamples() {
  try {
  await modernApiExample();
  await advancedExamples();
  await errorHandlingExamples();

  console.log('\n=== All Examples Completed Successfully ===');
  } catch (error) {
  console.error('Example failed:', error);
  }
}

// Export for testing
module.exports = {
  modernApiExample,
  advancedExamples,
  errorHandlingExamples,
  runAllExamples
};

// Run if called directly
if (require.main === module) {
  runAllExamples();
} 