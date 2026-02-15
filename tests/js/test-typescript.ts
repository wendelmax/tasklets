/**
 * TypeScript compatibility test for the modular Tasklets library
 * 
 * This file tests:
 * - Import/export compatibility
 * - Type definitions
 * - API method signatures
 * - Configuration options
 */

import tasklets, {
  Tasklets
} from '../../lib/index';
import type {
  TaskletsConfig,
  TaskletStats
} from '../../lib/index';

// Test basic imports and types
console.log('✅ TypeScript imports working correctly');

// Test configuration types
const config: TaskletsConfig = {
  maxWorkers: 'auto',
  timeout: 30000,
  logging: 'info',
  maxMemory: 80
};

// Test API methods with proper typing
async function testTypeScriptAPI() {
  console.log('🧪 Testing TypeScript API compatibility...');

  // Test configuration
  tasklets.configure(config);
  console.log('✅ Configuration working');

  // Test basic task execution
  const result = await tasklets.run(() => {
    return 'TypeScript task completed';
  }, { timeout: 5000 });
  console.log('✅ Basic task execution:', result);

  // Test runAll with proper typing
  const results = await tasklets.runAll([
    () => 'Task 1',
    () => 'Task 2',
    () => 'Task 3'
  ]);
  console.log('✅ runAll working:', results);

  // Test batch processing
  const batchResults = await tasklets.batch([
    { name: 'test-task', task: () => 'Hello from TypeScript!' }
  ], {
    onProgress: (progress: any) => {
      console.log(`Progress: ${progress.percentage}%`);
    }
  });
  console.log('✅ Batch processing working:', batchResults);

  // Test retry functionality
  const retryResult = await tasklets.retry(() => {
    return 'Retry task completed';
  }, { attempts: 3, delay: 1000 });
  console.log('✅ Retry functionality working:', retryResult);

  // Test statistics
  const stats: TaskletStats = tasklets.getStats();
  console.log('✅ Statistics working:', {
    maxWorkers: stats.config.maxWorkers,
    activeTasks: stats.activeTasks
  });

  // Test health monitoring
  const health = tasklets.getHealth();
  console.log('✅ Health monitoring working:', {
    status: health.status,
    workers: health.workers,
    memory: health.memoryUsagePercent
  });

  // Test automation features
  tasklets.enableAdaptiveMode();
  console.log('✅ Adaptive mode working');

  // Test workload optimization
  tasklets.setWorkloadType('cpu');
  console.log('✅ Workload optimization working');

  // Test shutdown
  await tasklets.shutdown();
  console.log('✅ Shutdown working');

  console.log('🎉 All TypeScript API tests passed!');
}

// Test class instantiation
function testClassInstantiation() {
  console.log('🧪 Testing class instantiation...');

  const taskletsInstance = new Tasklets();

  // Test instance methods
  taskletsInstance.configure(config);
  console.log('✅ Class instantiation working');

  return taskletsInstance;
}

// Run all tests
async function runAllTests() {
  try {
    console.log('🚀 Starting TypeScript compatibility tests...\n');

    // Test class instantiation
    testClassInstantiation();
    console.log('');

    // Test main API
    await testTypeScriptAPI();
    console.log('');

    console.log('🎉 All TypeScript compatibility tests completed successfully!');

  } catch (error) {
    console.error('❌ TypeScript compatibility test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
} 