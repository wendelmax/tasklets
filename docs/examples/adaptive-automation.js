/**
 * @file adaptive-automation.js
 * @description This example demonstrates the automated adaptive configuration system
 * that intelligently adjusts settings based on runtime performance metrics and system conditions.
 * It shows how the system automatically optimizes worker threads, memory limits, and other
 * parameters without manual intervention.
 */

const tasklets = require('../../lib');
const os = require('os');

console.log(' Tasklets 1.0.0 - Automated Adaptive Configuration Example\n');

async function demonstrateAdaptiveAutomation() {
  try {
    // Initialize tasklets with adaptive mode
    console.log('1. Initializing Adaptive Configuration:');
    console.log('  Enabling automated adaptive configuration...');
    tasklets.enableAdaptiveMode();

    console.log('  Adaptive mode enabled:', tasklets.isAdaptiveModeEnabled());
    console.log('  System CPU cores:', os.cpus().length);
    console.log('  System memory:', Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB');

    // Show initial adaptive settings
    console.log('\n2. Initial Adaptive Settings:');
    const initialSettings = tasklets.getAdaptiveSettings();
    console.log('  Worker threads:', initialSettings.workerThreads);
    console.log('  Memory limit:', initialSettings.memoryLimitPercent + '%');
    console.log('  Batch size:', initialSettings.batchSize);
    console.log('  Poll interval:', initialSettings.pollIntervalMs + 'ms');

    // Demonstrate automatic adjustment under different workloads
    console.log('\n3. Demonstrating Automatic Adjustments:');

    // CPU-intensive workload
    console.log('\n  CPU-Intensive Workload:');
    await demonstrateCPUIntensiveWorkload();

    // Memory-intensive workload
    console.log('\n  Memory-Intensive Workload:');
    await demonstrateMemoryIntensiveWorkload();

    // Mixed workload
    console.log('\n  Mixed Workload:');
    await demonstrateMixedWorkload();

    // Show final adaptive metrics
    console.log('\n4. Final Adaptive Metrics:');
    const finalMetrics = tasklets.getAdaptiveMetrics();
    const lastAdjustment = tasklets.getLastAdjustment();

    console.log('  Total metrics recorded:', finalMetrics.length);
    console.log('  Last adjustment reason:', lastAdjustment.reason);
    console.log('  Last adjustment changes:', lastAdjustment.changes_made);
    console.log('  Performance impact score:', lastAdjustment.performance_impact.toFixed(2));

    // Show performance trends
    console.log('\n5. Performance Trends:');
    if (finalMetrics.length >= 2) {
      const recent = finalMetrics.slice(-5);
      const avgCPU = recent.reduce((sum, m) => sum + m.cpu_utilization, 0) / recent.length;
      const avgMemory = recent.reduce((sum, m) => sum + m.memory_usage_percent, 0) / recent.length;
      const avgThroughput = recent.reduce((sum, m) => sum + m.throughput_tasks_per_sec, 0) / recent.length;

      console.log('  Average CPU utilization:', avgCPU.toFixed(1) + '%');
      console.log('  Average memory usage:', avgMemory.toFixed(1) + '%');
      console.log('  Average throughput:', avgThroughput.toFixed(1) + ' tasks/sec');
    }

    // Demonstrate manual adjustment trigger
    console.log('\n6. Manual Adjustment Trigger:');
    console.log('  Forcing immediate adaptive adjustment...');
    tasklets.forceAdaptiveAdjustment();

    const forcedAdjustment = tasklets.getLastAdjustment();
    console.log('  Forced adjustment reason:', forcedAdjustment.reason);
    console.log('  Forced adjustment changes:', forcedAdjustment.changes_made);

    // Show configuration summary
    console.log('\n7. Configuration Summary:');
    const summary = tasklets.getConfigurationSummary();
    console.log('  Current worker threads:', summary.workerThreads);
    console.log('  Current memory limit:', summary.memoryLimitPercent + '%');
    console.log('  Current batch size:', summary.batchSize);
    console.log('  Adaptive mode:', summary.adaptiveMode ? 'Enabled' : 'Disabled');

    console.log('\n Automated adaptive configuration demonstration completed successfully!');

  } catch (error) {
    console.error('Error in adaptive automation demo:', error);
  }
}

async function demonstrateCPUIntensiveWorkload() {
  const cpuTasks = Array.from({ length: 50 }, (_, i) => () => {
    // Simulate CPU-intensive work
    let result = 0;
    for (let j = 0; j < 100000; j++) {
      result += Math.sqrt(j) * Math.sin(j) * Math.cos(j);
    }
    return result;
  });

  console.log('  Running 50 CPU-intensive tasks...');
  const startTime = Date.now();

  const results = await tasklets.runAll(cpuTasks);

  const endTime = Date.now();
  console.log('  Completed in', (endTime - startTime) + 'ms');
  console.log('  Results count:', results.length);

  // Show metrics after CPU-intensive workload
  const metrics = tasklets.getAdaptiveMetrics();
  if (metrics.length > 0) {
    const latest = metrics[metrics.length - 1];
    console.log('  CPU utilization:', latest.cpu_utilization.toFixed(1) + '%');
    console.log('  Worker utilization:', latest.worker_utilization.toFixed(1) + '%');
    console.log('  Throughput:', latest.throughput_tasks_per_sec.toFixed(1) + ' tasks/sec');
  }
}

async function demonstrateMemoryIntensiveWorkload() {
  const memoryTasks = Array.from({ length: 20 }, (_, i) => () => {
    // Simulate memory-intensive work
    const largeArray = new Array(100000).fill(0).map((_, j) => Math.random());
    const result = largeArray.reduce((sum, val) => sum + val, 0);
    return result;
  });

  console.log('  Running 20 memory-intensive tasks...');
  const startTime = Date.now();

  const results = await tasklets.runAll(memoryTasks);

  const endTime = Date.now();
  console.log('  Completed in', (endTime - startTime) + 'ms');
  console.log('  Results count:', results.length);

  // Show metrics after memory-intensive workload
  const metrics = tasklets.getAdaptiveMetrics();
  if (metrics.length > 0) {
    const latest = metrics[metrics.length - 1];
    console.log('  Memory usage:', latest.memory_usage_percent.toFixed(1) + '%');
    console.log('  Active tasklets:', latest.active_tasklets);
    console.log('  Queued tasklets:', latest.queued_tasklets);
  }
}

async function demonstrateMixedWorkload() {
  const mixedTasks = Array.from({ length: 30 }, (_, i) => {
    if (i % 3 === 0) {
      // CPU-intensive
      return () => {
        let result = 0;
        for (let j = 0; j < 50000; j++) {
          result += Math.sqrt(j);
        }
        return result;
      };
    } else if (i % 3 === 1) {
      // Memory-intensive
      return () => {
        const array = new Array(50000).fill(0).map(() => Math.random());
        return array.reduce((sum, val) => sum + val, 0);
      };
    } else {
      // I/O simulation
      return () => {
        return new Promise(resolve => {
          setTimeout(() => resolve(Math.random()), Math.random() * 100);
        });
      };
    }
  });

  console.log('  Running 30 mixed workload tasks...');
  const startTime = Date.now();

  const results = await tasklets.runAll(mixedTasks);

  const endTime = Date.now();
  console.log('  Completed in', (endTime - startTime) + 'ms');
  console.log('  Results count:', results.length);

  // Show metrics after mixed workload
  const metrics = tasklets.getAdaptiveMetrics();
  if (metrics.length > 0) {
    const latest = metrics[metrics.length - 1];
    console.log('  Success rate:', (latest.success_rate * 100).toFixed(1) + '%');
    console.log('  Average execution time:', latest.average_execution_time_ms.toFixed(2) + 'ms');
    console.log('  Overall system health:', latest.overall_health_score?.toFixed(1) || 'N/A');
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateAdaptiveAutomation().then(() => {
    console.log('\n Demonstration completed successfully!');
  }).catch(console.error);
} 