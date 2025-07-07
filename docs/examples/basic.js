/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 * 
 * @file basic.js
 * @brief Basic example showcasing the modern tasklets API
 */

const tasklets = require('../../lib');

console.log(' Tasklets 1.0.0 - Modern API Basic Example\n');

async function runBasicExamples() {
  // Configure tasklets (optional - has smart defaults)
  tasklets.config({
  workers: 'auto',
  timeout: 10000,
  logging: 'info'
  });

  // Example 1: Simple task execution
  console.log('1. Simple task execution:');
  const result = await tasklets.run(() => {
  console.log('  Running task in parallel...');
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
  sum += Math.sqrt(i);
  }
  console.log('  Task completed!');
  return Math.round(sum);
  });
  console.log(`  Result: ${result}\n`);

  // Example 2: Multiple tasks in parallel
  console.log('2. Multiple tasks in parallel:');
  const results = await tasklets.runAll([
  () => {
  console.log('  Task A started');
  let sum = 0;
  for (let i = 0; i < 500000; i++) sum += Math.sqrt(i);
  console.log('  Task A completed');
  return 'Result A';
  },
  () => {
  console.log('  Task B started');
  let product = 1;
  for (let i = 1; i < 1000; i++) product = (product * i) % 1000000;
  console.log('  Task B completed');
  return 'Result B';
  },
  () => {
  console.log('  Task C started');
  let fibonacci = [1, 1];
  for (let i = 2; i < 30; i++) {
  fibonacci[i] = fibonacci[i - 1] + fibonacci[i - 2];
  }
  console.log('  Task C completed');
  return 'Result C';
  }
  ]);
  console.log('  Results:', results, '\n');

  // Example 3: Error handling
  console.log('3. Error handling:');
  try {
  await tasklets.run(() => {
  if (Math.random() > 0.5) {
  throw new Error('Random failure occurred');
  }
  return 'Success!';
  });
  console.log('  Task succeeded');
  } catch (error) {
  console.log(`  Task failed: ${error.message}`);
  }
  console.log();

  // Example 4: Task with timeout
  console.log('4. Task with custom timeout:');
  try {
  const fastResult = await tasklets.run(() => {
  // Fast operation
  return 'Quick result';
  }, { timeout: 1000 });
  console.log(`  Fast task result: ${fastResult}`);
  } catch (error) {
  console.log(`  Timeout error: ${error.message}`);
  }
  console.log();

  // Example 5: Performance statistics
  console.log('5. Performance statistics:');
  const stats = tasklets.getStats();
  console.log('  Current stats:', {
  workers: stats.workers,
  completedTasks: stats.tasks.completed,
  activeTasks: stats.tasks.active,
  throughput: stats.performance.throughput,
  cpuCores: stats.system.cpuCores,
  memoryUsage: Math.round(stats.system.memoryUsage.heapUsed / 1024 / 1024) + 'MB'
  });
  console.log();

  // Example 6: System health
  console.log('6. System health check:');
  const health = tasklets.getHealth();
  console.log('  🏥 Health status:', health.status);
  console.log('  💾 Memory usage:', `${health.memory.used}MB (${health.memory.percentage}%)`);
  console.log('  👷 Worker utilization:', `${Math.round(health.workers.utilization * 100)}%`);
  console.log();

  // Example 7: Performance comparison
  console.log('7. Performance comparison:');

  // Synchronous execution
  console.log('  🐌 Running tasks synchronously...');
  const syncStart = Date.now();
  const syncResults = [];
  for (let i = 0; i < 3; i++) {
  let sum = 0;
  for (let j = 0; j < 200000; j++) {
  sum += Math.sqrt(j);
  }
  syncResults.push(`Sync ${i}`);
  }
  const syncTime = Date.now() - syncStart;

  // Parallel execution with tasklets
  console.log('  Running tasks in parallel...');
  const parallelStart = Date.now();
  const parallelResults = await tasklets.runAll([
  () => {
  let sum = 0;
  for (let j = 0; j < 200000; j++) {
  sum += Math.sqrt(j);
  }
  return 'Parallel 0';
  },
  () => {
  let sum = 0;
  for (let j = 0; j < 200000; j++) {
  sum += Math.sqrt(j);
  }
  return 'Parallel 1';
  },
  () => {
  let sum = 0;
  for (let j = 0; j < 200000; j++) {
  sum += Math.sqrt(j);
  }
  return 'Parallel 2';
  }
  ]);
  const parallelTime = Date.now() - parallelStart;

  console.log(`  Synchronous time: ${syncTime}ms`);
  console.log(`  Parallel time: ${parallelTime}ms`);
  console.log(`  Speedup: ${(syncTime / parallelTime).toFixed(2)}x\n`);

  console.log(' Basic example completed successfully!\n');
}

// Show API comparison
function showAPIComparison() {
  console.log(' API Comparison - Old vs New:');
  console.log();
  console.log(' Old API (0.x) - Complex:');
  console.log('  const taskId = tasklets.spawn(() => work());');
  console.log('  tasklets.join(taskId);');
  console.log('  if (tasklets.hasError(taskId)) {');
  console.log('  throw new Error(tasklets.getError(taskId));');
  console.log('  }');
  console.log('  const result = tasklets.getResult(taskId);');
  console.log();
  console.log(' New API (1.0.0) - Simple:');
  console.log('  const result = await tasklets.run(() => work());');
  console.log();
  console.log(' 80% less code, 100% more readable!\n');
}

// Run the examples
(async () => {
  try {
  showAPIComparison();
  await runBasicExamples();
  } catch (error) {
  console.error(' Example failed:', error.message);
  }
})(); 