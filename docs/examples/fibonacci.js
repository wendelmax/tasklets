/**
 * @file fibonacci.js
 * @description This example demonstrates the computation of Fibonacci numbers in parallel using Tasklets.
 * It showcases several features of the library:
 * - A performance comparison between sequential and parallel computation of Fibonacci numbers.
 * - Batch processing of Fibonacci calculations with progress tracking using `tasklets.batch()`.
 * - Error handling and retry logic for unreliable computations using `tasklets.retry()`.
 * - A demonstration of an advanced parallel map pattern.
 * This example highlights how CPU-bound recursive tasks can be parallelized to improve performance.
 */
const tasklets = require('../../lib');

console.log(' Tasklets 1.0.0 - Fibonacci Computation Example\n');

// Fibonacci function (recursive for CPU-intensive work)
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Additional computational work to simulate real-world scenario
function computeWithWork(n) {
  const fib = fibonacci(n);

  // Add some additional computational work
  let sum = 0;
  for (let i = 0; i < 50000; i++) {
  sum += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
  }

  return {n, fibonacci: fib, additionalWork: Math.round(sum)};
}

async function runFibonacciExamples() {
  // Configure tasklets for optimal performance
  tasklets.config({
  workers: 'auto',
  timeout: 30000,
  logging: 'info'
  });

  // Test numbers for computation (reduced for faster execution)
  const numbers = [20, 21, 22, 23, 24];

  // Example 1: Sequential computation
  console.log('1. Sequential Fibonacci computation:');
  const startSeq = Date.now();
  const sequentialResults = [];
  for (const n of numbers) {
  console.log(`  Computing fibonacci(${n}) sequentially...`);
  const result = computeWithWork(n);
  sequentialResults.push(result);
  }
  const seqTime = Date.now() - startSeq;

  console.log('  Results:', sequentialResults.map(r => `fib(${r.n})=${r.fibonacci}`));
  console.log(`  Sequential time: ${seqTime}ms\n`);

  // Example 2: Parallel computation with modern API
  console.log('2. Parallel Fibonacci computation with tasklets:');
  const startPar = Date.now();

  const parallelResults = await tasklets.runAll(
  numbers.map(n => () => {
  console.log(`  Computing fibonacci(${n}) in parallel...`);
  const result = computeWithWork(n);
  console.log(`  fibonacci(${n}) = ${result.fibonacci} completed`);
  return result;
  })
  );

  const parTime = Date.now() - startPar;

  console.log('  Results:', parallelResults.map(r => `fib(${r.n})=${r.fibonacci}`));
  console.log(`  Parallel time: ${parTime}ms`);
  console.log(`  Speedup: ${(seqTime / parTime).toFixed(2)}x\n`);

  // Example 3: Batch processing with progress tracking
  console.log('3. Batch processing with progress tracking:');
  const batchNumbers = Array.from({length: 10}, (_, i) => 15 + i);

  const batchTasks = batchNumbers.map(n => ({
  name: `fibonacci-${n}`,
  task: () => {
  console.log(`  Processing fibonacci(${n})...`);
  return computeWithWork(n);
  }
  }));

  const startBatch = Date.now();
  const batchResults = await tasklets.batch(batchTasks, {
  onProgress: (progress) => {
  process.stdout.write(`\r  Progress: ${progress.percentage}% (${progress.completed}/${progress.total})`);
  }
  });
  const batchTime = Date.now() - startBatch;

  console.log(`\n  Batch completed in ${batchTime}ms`);
  console.log('  Note: Progress callback frequency may vary due to parallel execution');
  console.log('  Results summary:');
  batchResults.forEach(result => {
  if (result.success) {
  console.log(`  fib(${result.result.n}) = ${result.result.fibonacci}`);
  } else {
  console.log(`  ${result.name} failed: ${result.error}`);
  }
  });
  console.log();

  // Example 4: Error handling and retry
  console.log('4. Error handling and retry:');
  try {
  const unreliableResult = await tasklets.retry(() => {
  const n = 20;
  // Simulate unreliable computation
  if (Math.random() < 0.6) {
  throw new Error('Computation temporarily failed');
  }
  return computeWithWork(n);
  }, {
  attempts: 5,
  delay: 500,
  backoff: 2
  });

  console.log(`  Reliable result: fibonacci(${unreliableResult.n}) = ${unreliableResult.fibonacci}`);
  } catch (error) {
  console.log(`  Failed after retries: ${error.message}`);
  }
  console.log();

  // Example 5: Performance comparison and statistics
  console.log('5. Performance analysis:');
  const stats = tasklets.getStats();
  const health = tasklets.getHealth();

  console.log('  Performance stats:', {
  workers: stats.workers,
  completedTasks: stats.tasks.completed,
  throughput: stats.performance.throughput,
  avgExecutionTime: stats.performance.averageExecutionTime
  });

  console.log('  🏥 System health:', {
  status: health.status,
  memoryUsage: `${health.memory.used}MB (${health.memory.percentage}%)`,
  workerUtilization: `${Math.round(health.workers.utilization * 100)}%`
  });

  console.log('  Comparison summary:');
  console.log(`  Sequential: ${seqTime}ms`);
  console.log(`  Parallel: ${parTime}ms`);
  console.log(`  Speedup: ${(seqTime / parTime).toFixed(2)}x`);
  console.log();

  // Cleanup and shutdown
  console.log('6. Cleanup and Shutdown:');
  tasklets.forceCleanup();
  const finalStats = tasklets.getMemoryStats();
  console.log('  Final active tasklets:', finalStats.activeTasklets);
  console.log('  Note: Small residual values are normal due to native delays');
  
  await tasklets.shutdown({ timeout: 1000 });
  console.log('  System shutdown completed');
  console.log();

  console.log(' Fibonacci computation demonstration completed successfully!');
  console.log('\n Key Features Demonstrated:');
  console.log('  • Parallel computation with automatic thread management');
  console.log('  • Batch processing with progress tracking');
  console.log('  • Error handling and retry logic');
  console.log('  • Performance monitoring and health checks');
  console.log('  • Memory management and cleanup');
  console.log('  • Graceful shutdown handling');
}

// Show performance benefits
function showPerformanceBenefits() {
  console.log(' Performance Benefits of Modern API:');
  console.log();
  console.log('•  Simplified Code: No manual ID management');
  console.log('•  Automatic Error Handling: Built-in error propagation');
  console.log('•  Progress Tracking: Real-time batch progress');
  console.log('•  Retry Logic: Exponential backoff for reliability');
  console.log('• 💚 Health Monitoring: System health checks');
  console.log('•  True Parallelism: Leverages all CPU cores');
  console.log();
}

// Run the examples
(async () => {
  try {
  showPerformanceBenefits();
  await runFibonacciExamples();
  } catch (error) {
  console.error(' Fibonacci example failed:', error.message);
  } finally {
  // Ensure process terminates
  console.log('\n Exiting process...');
  process.exit(0);
  }
})(); 