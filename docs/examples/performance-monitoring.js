/**
 * @file performance-monitoring.js
 * @description This example showcases the built-in performance monitoring capabilities of Tasklets.
 * It demonstrates how to:
 * - Create a custom performance monitor to periodically sample and analyze performance data.
 * - Use `tasklets.getStats()` to retrieve detailed statistics about workers, tasks, and performance.
 * - Use `tasklets.getHealth()` to get a high-level overview of the system's health, including memory and worker utilization.
 * - Monitor the system during different workloads, such as basic task execution and batch processing.
 */

const tasklets = require('../../lib');

console.log(' Tasklets 1.0.0 - Performance Monitoring Example\n');

// Enhanced performance monitor with new API features
class TaskletPerformanceMonitor {
  constructor() {
  this.samples = [];
  this.interval = null;
  this.startTime = Date.now();
  }

  startMonitoring(intervalMs = 100) {
  this.interval = setInterval(() => {
  this.recordSample();
  }, intervalMs);
  console.log(`  Monitoring started (${intervalMs}ms intervals)`);
  }

  stopMonitoring() {
  if (this.interval) {
  clearInterval(this.interval);
  this.interval = null;
  console.log('  Monitoring stopped');
  }
  }

  recordSample() {
  const stats = tasklets.getStats();
  const health = tasklets.getHealth();
  const memoryInfo = process.memoryUsage();

  this.samples.push({
  timestamp: Date.now(),
  stats,
  health,
  memory: memoryInfo,
  runtime: Date.now() - this.startTime
  });
  }

  getAnalysis() {
  if (this.samples.length === 0) return null;

  const latest = this.samples[this.samples.length - 1];
  const memoryUsage = this.samples.map(s => s.memory.heapUsed);
  const workerUtilization = this.samples.map(s => s.health.workers.utilization);

  return {
  runtime: latest.runtime,
  totalSamples: this.samples.length,
  currentStats: latest.stats,
  currentHealth: latest.health,
  memory: {
  current: latest.memory.heapUsed,
  peak: Math.max(...memoryUsage),
  average: memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length,
  trend: this.calculateTrend(memoryUsage)
  },
  performance: {
  avgUtilization: workerUtilization.reduce((a, b) => a + b, 0) / workerUtilization.length,
  peakUtilization: Math.max(...workerUtilization),
  throughputHistory: this.samples.map(s => s.stats.performance.throughput)
  }
  };
  }

  calculateTrend(values) {
  if (values.length < 2) return 'stable';
  const recent = values.slice(-5);
  const older = values.slice(-10, -5);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;

  const change = (recentAvg - olderAvg) / olderAvg;
  if (change > 0.1) return 'increasing';
  if (change < -0.1) return 'decreasing';
  return 'stable';
  }

  printReport() {
  const analysis = this.getAnalysis();
  if (!analysis) {
  console.log('  No data available');
  return;
  }

  console.log('  Performance Report:');
  console.log(`  Runtime: ${analysis.runtime}ms`);
  console.log(`  Samples: ${analysis.totalSamples}`);
  console.log(`  Workers: ${analysis.currentStats.workers}`);
  console.log(`  Completed Tasks: ${analysis.currentStats.tasks.completed}`);
  console.log(`  Throughput: ${analysis.currentStats.performance.throughput} ops/sec`);
  console.log(`  Memory: ${(analysis.memory.current / 1024 / 1024).toFixed(2)}MB (${analysis.memory.trend})`);
  console.log(`  Worker Utilization: ${(analysis.performance.avgUtilization * 100).toFixed(1)}%`);
  console.log(`  System Health: ${analysis.currentHealth.status}`);
  console.log();
  }
}

async function runPerformanceExamples() {
  // Configure tasklets for monitoring
  tasklets.config({
  workers: 'auto',
  timeout: 30000,
  logging: 'info'
  });

  // Example 1: Basic performance monitoring
  console.log('1. Basic performance monitoring:');
  const monitor1 = new TaskletPerformanceMonitor();
  monitor1.startMonitoring(100);

  // Run a series of tasks with varying complexity
  const basicTasks = Array.from({length: 10}, (_, i) => () => {
  console.log(`  Task ${i} running...`);
  const iterations = 100000 + (i * 20000);
  let result = 0;
  for (let j = 0; j < iterations; j++) {
  result += Math.sqrt(j);
  }
  console.log(`  Task ${i} completed`);
  return Math.round(result);
  });

  const basicResults = await tasklets.runAll(basicTasks);
  monitor1.stopMonitoring();

  console.log('  Basic monitoring results:');
  monitor1.printReport();

  // Example 2: Built-in statistics monitoring
  console.log('2. Built-in statistics monitoring:');

  // Get initial stats
  const initialStats = tasklets.getStats();
  console.log('  Initial stats:', {
  workers: initialStats.workers,
  completedTasks: initialStats.tasks.completed,
  systemCores: initialStats.system.cpuCores,
  memoryUsage: Math.round(initialStats.system.memoryUsage.heapUsed / 1024 / 1024) + 'MB'
  });

  // Run tasks and monitor in real-time
  const computeTasks = Array.from({length: 15}, (_, i) => () => {
  // Simulate CPU-intensive work
  let sum = 0;
  for (let j = 0; j < 200000; j++) {
  sum += Math.sqrt(j) * Math.sin(j);
  }
  return sum;
  });

  console.log('  Running compute tasks...');
  const computeStart = Date.now();
  const computeResults = await tasklets.runAll(computeTasks);
  const computeTime = Date.now() - computeStart;

  const finalStats = tasklets.getStats();
  console.log('  Final stats:', {
  completedTasks: finalStats.tasks.completed,
  throughput: finalStats.performance.throughput,
  averageExecutionTime: finalStats.performance.averageExecutionTime,
  totalTime: computeTime
  });
  console.log();

  // Example 3: Health monitoring during batch processing
  console.log('3. Health monitoring during batch processing:');

  const batchTasks = Array.from({length: 20}, (_, i) => ({
  name: `compute-task-${i}`,
  task: () => {
  // Simulate work with random complexity
  const complexity = 50000 + Math.random() * 100000;
  let result = 0;
  for (let j = 0; j < complexity; j++) {
  result += Math.sqrt(j) * Math.cos(j);
  }

  // Simulate occasional memory-intensive operations
  if (Math.random() < 0.3) {
  const largeArray = new Array(10000).fill(0).map(() => Math.random());
  result += largeArray.reduce((a, b) => a + b, 0);
  }

  return Math.round(result);
  }
  }));

  // Monitor health during batch processing
  const healthMonitor = setInterval(() => {
  const health = tasklets.getHealth();
  console.log(`  💚 Health: ${health.status} | Memory: ${health.memory.used}MB (${health.memory.percentage}%) | Workers: ${Math.round(health.workers.utilization * 100)}%`);
  }, 500);

  const batchResults = await tasklets.batch(batchTasks, {
  onProgress: (progress) => {
  process.stdout.write(`\r  Batch progress: ${progress.percentage}% (${progress.completed}/${progress.total}) `);
  }
  });

  clearInterval(healthMonitor);
  console.log('\n  Batch processing completed');
  console.log('  Note: Progress callback frequency may vary due to parallel execution');

  // Analyze batch results
  const successful = batchResults.filter(r => r.success).length;
  const failed = batchResults.filter(r => !r.success).length;
  console.log(`  Batch results: ${successful} successful, ${failed} failed`);
  console.log();

  // Example 4: Error monitoring and retry analysis
  console.log('4. Error monitoring and retry analysis:');

  let retryAttempts = 0;
  let retrySuccesses = 0;

  try {
  const unreliableResult = await tasklets.retry(() => {
  retryAttempts++;
  console.log(`  Retry attempt ${retryAttempts}`);

  // Simulate unreliable operation
  if (Math.random() < 0.7) {
  throw new Error('Simulated network failure');
  }

  retrySuccesses++;
  return 'Success after retries';
  }, {
  attempts: 5,
  delay: 200,
  backoff: 1.5
  });

  console.log(`  Retry successful: ${unreliableResult}`);
  } catch (error) {
  console.log(`  Retry failed: ${error.message}`);
  }

  console.log(`  Retry analysis: ${retryAttempts} attempts, ${retrySuccesses} successes`);
  console.log();

  // Example 5: Performance comparison and optimization
  console.log('5. Performance comparison and optimization:');

  // Test different workload sizes
  const workloadSizes = [50, 100, 200, 500];
  const performanceData = [];

  for (const size of workloadSizes) {
  console.log(`  Testing workload size: ${size}`);

  const tasks = Array.from({length: size}, () => () => {
  let sum = 0;
  for (let i = 0; i < 10000; i++) {
  sum += Math.sqrt(i);
  }
  return sum;
  });

  const startTime = Date.now();
  await tasklets.runAll(tasks);
  const endTime = Date.now();

  const stats = tasklets.getStats();
  const health = tasklets.getHealth();

  performanceData.push({
  workloadSize: size,
  executionTime: endTime - startTime,
  throughput: stats.performance.throughput,
  memoryUsage: health.memory.used,
  workerUtilization: health.workers.utilization
  });
  }

  console.log('  Performance comparison:');
  performanceData.forEach(data => {
  console.log(`  ${data.workloadSize} tasks: ${data.executionTime}ms, ${data.throughput} ops/sec, ${data.memoryUsage}MB, ${Math.round(data.workerUtilization * 100)}% utilization`);
  });
  console.log();

  // Example 6: Real-time monitoring dashboard
  console.log('6. Real-time monitoring dashboard:');

  console.log('  Starting real-time dashboard (5 seconds)...');
  const dashboardMonitor = setInterval(() => {
  const stats = tasklets.getStats();
  const health = tasklets.getHealth();

  process.stdout.write('\r' + ' '.repeat(80)); // Clear line
  process.stdout.write(`\r  Workers: ${stats.workers} | Tasks: ${stats.tasks.completed} | Throughput: ${stats.performance.throughput} ops/s | Memory: ${health.memory.used}MB | Health: ${health.status}`);
  }, 200);

  // Run some background tasks for the dashboard
  const backgroundTasks = Array.from({length: 50}, () => () => {
  const work = Math.random() * 50000;
  let result = 0;
  for (let i = 0; i < work; i++) {
  result += Math.sqrt(i);
  }
  return result;
  });

  await tasklets.runAll(backgroundTasks);

  setTimeout(() => {
  clearInterval(dashboardMonitor);
  console.log('\n  Dashboard monitoring completed');
  console.log();

  // Final system health report
  const finalHealth = tasklets.getHealth();
  const finalStats = tasklets.getStats();

  console.log('7. Final system health report:');
  console.log('  🏥 System Health Summary:');
  console.log(`  Status: ${finalHealth.status}`);
  console.log(`  Workers: ${finalStats.workers} (${Math.round(finalHealth.workers.utilization * 100)}% utilized)`);
  console.log(`  Memory: ${finalHealth.memory.used}MB / ${finalHealth.memory.total}MB (${finalHealth.memory.percentage}%)`);
  console.log(`  Total Tasks Completed: ${finalStats.tasks.completed}`);
  console.log(`  Current Throughput: ${finalStats.performance.throughput} operations/second`);
  console.log(`  System Uptime: ${Math.round(finalStats.system.uptime / 1000)}s`);
  console.log();

  console.log('  Performance monitoring demonstration completed successfully!');
  console.log('\n Key Monitoring Features:');
  console.log('  • Real-time performance metrics collection');
  console.log('  • Health monitoring during task execution');
  console.log('  • Error tracking and retry analysis');
  console.log('  • Memory usage monitoring');
  console.log('  • Worker utilization tracking');
  console.log('  • Batch progress monitoring');
  console.log('  • System health checks');

  // Cleanup and shutdown
  console.log('\n7. Cleanup and Shutdown:');
  tasklets.forceCleanup();
  const finalMemoryStats = tasklets.getMemoryStats();
  console.log('  Final active tasklets:', finalMemoryStats.activeTasklets);
  console.log('  Note: Small residual values are normal due to native delays');
  
  await tasklets.shutdown({ timeout: 1000 });
  console.log('  System shutdown completed');
  }, 5000);
}

// Show monitoring capabilities
function showMonitoringCapabilities() {
  console.log(' Built-in Monitoring Capabilities:');
  console.log();
  console.log('•  Real-time Statistics: getStats() provides comprehensive metrics');
  console.log('• 🏥 Health Monitoring: getHealth() checks system wellness');
  console.log('•  Progress Tracking: Built-in progress callbacks for batch operations');
  console.log('•  Retry Analytics: Automatic retry with exponential backoff');
  console.log('• 💾 Memory Tracking: Real-time memory usage monitoring');
  console.log('•  Performance Metrics: Throughput and execution time tracking');
  console.log('• 👷 Worker Utilization: Monitor worker thread efficiency');
  console.log();
}

// Run the examples
(async () => {
  try {
  showMonitoringCapabilities();
  await runPerformanceExamples();
  } catch (error) {
  console.error(' Performance monitoring example failed:', error.message);
  }
})(); 