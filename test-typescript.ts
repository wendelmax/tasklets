/**
 * TypeScript compatibility test for the modular Tasklets library
 * 
 * This file tests:
 * - Import/export compatibility
 * - Type definitions
 * - API method signatures
 * - Configuration options
 * - Performance and automation features
 */

import tasklets, { 
  Tasklets, 
  TaskletConfig, 
  TaskOptions, 
  BatchTaskConfig, 
  BatchOptions, 
  RetryOptions,
  TaskletStats,
  TaskletHealth,
  ShutdownOptions,
  BatchProgress,
  BatchResult
} from './lib/index';

// Test basic imports and types
console.log('✅ TypeScript imports working correctly');

// Test configuration types
const config: TaskletConfig = {
  workers: 'auto',
  timeout: 30000,
  logging: 'info',
  maxMemory: '1GB'
};

// Test task options
const taskOptions: TaskOptions = {
  timeout: 5000
};

// Test batch configuration
const batchConfig: BatchTaskConfig = {
  name: 'test-task',
  task: () => 'Hello from TypeScript!',
  options: taskOptions
};

// Test batch options
const batchOptions: BatchOptions = {
  onProgress: (progress: BatchProgress) => {
    console.log(`Progress: ${progress.percentage}% (${progress.completed}/${progress.total})`);
  }
};

// Test retry options
const retryOptions: RetryOptions = {
  attempts: 3,
  delay: 1000,
  backoff: 1.5,
  timeout: 10000
};

// Test shutdown options
const shutdownOptions: ShutdownOptions = {
  timeout: 5000
};

// Test API methods with proper typing
async function testTypeScriptAPI() {
  console.log('🧪 Testing TypeScript API compatibility...');

  // Test configuration
  tasklets.config(config);
  console.log('✅ Configuration working');

  // Test basic task execution
  const result = await tasklets.run(() => {
    return 'TypeScript task completed';
  }, taskOptions);
  console.log('✅ Basic task execution:', result);

  // Test runAll with proper typing
  const results = await tasklets.runAll([
    () => 'Task 1',
    () => 'Task 2',
    () => 'Task 3'
  ], taskOptions);
  console.log('✅ runAll working:', results);

  // Test batch processing
  const batchResults = await tasklets.batch([
    batchConfig,
    {
      name: 'another-task',
      task: () => 'Another task result'
    }
  ], batchOptions);
  console.log('✅ Batch processing working:', batchResults);

  // Test retry functionality
  const retryResult = await tasklets.retry(() => {
    return 'Retry task completed';
  }, retryOptions);
  console.log('✅ Retry functionality working:', retryResult);

  // Test statistics
  const stats: TaskletStats = tasklets.getStats();
  console.log('✅ Statistics working:', {
    workers: stats.workers,
    tasks: stats.tasks,
    performance: stats.performance
  });

  // Test health monitoring
  const health: TaskletHealth = tasklets.getHealth();
  console.log('✅ Health monitoring working:', {
    status: health.status,
    workers: health.workers,
    memory: health.memory
  });

  // Test performance summary
  const performanceSummary = tasklets.getPerformanceSummary();
  console.log('✅ Performance summary working:', performanceSummary);

  // Test automation features
  tasklets.enableAutomation();
  const automationStatus = tasklets.getAutomationStatus();
  console.log('✅ Automation features working:', automationStatus);

  // Test workload optimization
  tasklets.optimizeForCPU();
  tasklets.optimizeForIO();
  tasklets.optimizeForMemory();
  tasklets.optimizeForBalanced();
  console.log('✅ Workload optimization working');

  // Test optimization status
  const optimizationStatus = tasklets.getOptimizationStatus();
  console.log('✅ Optimization status working:', optimizationStatus);

  // Test advanced processing methods
  const items = Array.from({ length: 10 }, (_, i) => i);
  const processor = (item: number) => item * 2;
  
  const adaptiveResults = await tasklets.processBatchAdaptive(items, processor);
  console.log('✅ Adaptive batch processing working:', adaptiveResults);

  const cpuResults = await tasklets.processCPUIntensive(items, processor);
  console.log('✅ CPU-intensive processing working:', cpuResults);

  const ioResults = await tasklets.processIOIntensive(items, processor);
  console.log('✅ I/O-intensive processing working:', ioResults);

  const memoryResults = await tasklets.processMemoryIntensive(items, processor);
  console.log('✅ Memory-intensive processing working:', memoryResults);

  const memoryAwareResults = await tasklets.processWithMemoryAwareness(items, processor);
  console.log('✅ Memory-aware processing working:', memoryAwareResults);

  // Test optimized execution methods
  const optimizedResult = await tasklets.runOptimized(() => 'Optimized task');
  console.log('✅ Optimized execution working:', optimizedResult);

  const optimizedBatchResults = await tasklets.batchOptimized([
    { name: 'opt-task', task: () => 'Optimized batch task' }
  ]);
  console.log('✅ Optimized batch working:', optimizedBatchResults);

  const workloadOptimizedResult = await tasklets.runWithWorkloadOptimization(
    () => 'Workload optimized task',
    'cpu-intensive'
  );
  console.log('✅ Workload optimization working:', workloadOptimizedResult);

  const memoryAwareResult = await tasklets.runWithMemoryAwareness(() => 'Memory aware task');
  console.log('✅ Memory-aware execution working:', memoryAwareResult);

  // Test memory management
  const memoryStats = tasklets.getMemoryStats();
  console.log('✅ Memory management working:', memoryStats);

  // Test cleanup
  tasklets.forceCleanup();
  console.log('✅ Cleanup working');

  // Test shutdown
  await tasklets.shutdown(shutdownOptions);
  console.log('✅ Shutdown working');

  console.log('🎉 All TypeScript API tests passed!');
}

// Test class instantiation
function testClassInstantiation() {
  console.log('🧪 Testing class instantiation...');

  const taskletsInstance = new Tasklets();
  
  // Test instance methods
  taskletsInstance.config(config);
  console.log('✅ Class instantiation working');

  // Test event emitter functionality
  taskletsInstance.on('test-event', () => {
    console.log('✅ Event emitter working');
  });
  
  taskletsInstance.emit('test-event');
  
  return taskletsInstance;
}

// Test utility functions
function testUtilityFunctions() {
  console.log('🧪 Testing utility functions...');

  // Test configuration helpers
  const configuredTasklets = tasklets.config({
    workers: 4,
    timeout: 10000,
    logging: 'debug'
  });
  console.log('✅ Configuration chaining working');

  // Test automation helpers
  const automatedTasklets = tasklets.enableAutomation();
  console.log('✅ Automation helper working');

  // Test performance helpers
  const performanceSummary = tasklets.getPerformanceSummary();
  console.log('✅ Performance helper working');

  // Test workload helpers
  const cpuOptimized = tasklets.optimizeForCPU();
  const ioOptimized = tasklets.optimizeForIO();
  const memoryOptimized = tasklets.optimizeForMemory();
  const balancedOptimized = tasklets.optimizeForBalanced();
  console.log('✅ Workload helpers working');

  return {
    configuredTasklets,
    automatedTasklets,
    performanceSummary,
    cpuOptimized,
    ioOptimized,
    memoryOptimized,
    balancedOptimized
  };
}

// Run all tests
async function runAllTests() {
  try {
    console.log('🚀 Starting TypeScript compatibility tests...\n');

    // Test class instantiation
    const instance = testClassInstantiation();
    console.log('');

    // Test utility functions
    const utilities = testUtilityFunctions();
    console.log('');

    // Test main API
    await testTypeScriptAPI();
    console.log('');

    console.log('🎉 All TypeScript compatibility tests completed successfully!');
    console.log('✅ The modular Tasklets library is fully TypeScript compatible!');

  } catch (error) {
    console.error('❌ TypeScript compatibility test failed:', error);
    process.exit(1);
  }
}

// Export for potential use in other tests
export {
  testTypeScriptAPI,
  testClassInstantiation,
  testUtilityFunctions,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
} 