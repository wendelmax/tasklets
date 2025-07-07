/**
 * Tests for system management: shutdown, native module integration
 */

const tasklets = require('../../lib/index');

describe('System Management Tests', () => {
  beforeEach(() => {
  // Configure tasklets for testing
  tasklets.config({
  workers: 2,
  timeout: 10000,
  logging: 'off'
  });
  });

  describe('shutdown() function', () => {
  test('should shutdown gracefully with default timeout', async () => {
  // Run some tasks first
  await tasklets.run(() => 'test task');

  // Shutdown should complete successfully
  await expect(tasklets.shutdown()).resolves.toBeUndefined();
  });

  test('should shutdown gracefully with custom timeout', async () => {
  // Run some tasks first
  await tasklets.run(() => 'test task');

  // Shutdown with custom timeout
  await expect(tasklets.shutdown({ timeout: 5000 })).resolves.toBeUndefined();
  });

  test('should shutdown gracefully with short timeout', async () => {
  // Run some tasks first
  await tasklets.run(() => 'test task');

  // Shutdown with short timeout
  await expect(tasklets.shutdown({ timeout: 100 })).resolves.toBeUndefined();
  });

  test('should shutdown gracefully with zero timeout', async () => {
  // Run some tasks first
  await tasklets.run(() => 'test task');

  // Shutdown with zero timeout
  await expect(tasklets.shutdown({ timeout: 0 })).resolves.toBeUndefined();
  });

  test('should shutdown gracefully with negative timeout', async () => {
  // Run some tasks first
  await tasklets.run(() => 'test task');

  // Shutdown with negative timeout (should be handled gracefully)
  await expect(tasklets.shutdown({ timeout: -1000 })).resolves.toBeUndefined();
  });

  test('should shutdown gracefully with very large timeout', async () => {
  // Run some tasks first
  await tasklets.run(() => 'test task');

  // Shutdown with large timeout
  await expect(tasklets.shutdown({ timeout: 999999 })).resolves.toBeUndefined();
  });

  test('should shutdown when no tasks are running', async () => {
  // Shutdown without running any tasks
  await expect(tasklets.shutdown()).resolves.toBeUndefined();
  });

  test('should shutdown with empty options', async () => {
  // Run some tasks first
  await tasklets.run(() => 'test task');

  // Shutdown with empty options
  await expect(tasklets.shutdown({})).resolves.toBeUndefined();
  });

  test('should shutdown with null options', async () => {
  // Run some tasks first
  await tasklets.run(() => 'test task');

  // Shutdown with null options
  await expect(tasklets.shutdown(null)).resolves.toBeUndefined();
  });

  test('should shutdown with undefined options', async () => {
  // Run some tasks first
  await tasklets.run(() => 'test task');

  // Shutdown with undefined options
  await expect(tasklets.shutdown(undefined)).resolves.toBeUndefined();
  });

  test('should handle shutdown after running multiple tasks', async () => {
  // Run multiple tasks
  await tasklets.runAll([
  () => 'task1',
  () => 'task2',
  () => 'task3'
  ]);

  // Shutdown should complete successfully
  await expect(tasklets.shutdown()).resolves.toBeUndefined();
  });

  test('should handle shutdown after batch operations', async () => {
  // Run batch operations
  await tasklets.batch([
  { name: 'batch1', task: () => 'batch1' },
  { name: 'batch2', task: () => 'batch2' }
  ]);

  // Shutdown should complete successfully
  await expect(tasklets.shutdown()).resolves.toBeUndefined();
  });

  test('should handle shutdown after retry operations', async () => {
  // Run retry operations
  await tasklets.retry(() => 'retry task', { attempts: 3 });

  // Shutdown should complete successfully
  await expect(tasklets.shutdown()).resolves.toBeUndefined();
  });

  test('should handle shutdown with different worker configurations', async () => {
  const configs = [1, 2, 4, 8];

  for (const workers of configs) {
  tasklets.config({ workers });

  // Run a task
  await tasklets.run(() => 'config test');

  // Shutdown should work with any configuration
  await expect(tasklets.shutdown({ timeout: 1000 })).resolves.toBeUndefined();
  }
  });

  test('should handle multiple shutdown calls', async () => {
  // Run some tasks
  await tasklets.run(() => 'test task');

  // First shutdown
  await expect(tasklets.shutdown()).resolves.toBeUndefined();

  // Additional shutdown calls should not cause errors
  await expect(tasklets.shutdown()).resolves.toBeUndefined();
  await expect(tasklets.shutdown()).resolves.toBeUndefined();
  });

  test('should handle shutdown with invalid timeout types', async () => {
  // Run some tasks first
  await tasklets.run(() => 'test task');

  // These should be handled gracefully
  await expect(tasklets.shutdown({ timeout: "invalid" })).resolves.toBeUndefined();
  await expect(tasklets.shutdown({ timeout: {} })).resolves.toBeUndefined();
  await expect(tasklets.shutdown({ timeout: [] })).resolves.toBeUndefined();
  });
  });

  describe('native module integration', () => {
  test('should have native module loaded', () => {
  // Verify that we can access tasklets functions
  expect(typeof tasklets.run).toBe('function');
  expect(typeof tasklets.runAll).toBe('function');
  expect(typeof tasklets.batch).toBe('function');
  expect(typeof tasklets.retry).toBe('function');
  expect(typeof tasklets.config).toBe('function');
  expect(typeof tasklets.getStats).toBe('function');
  expect(typeof tasklets.getHealth).toBe('function');
  expect(typeof tasklets.shutdown).toBe('function');
  });

  test('should handle native module functions correctly', async () => {
  // Test that basic native module integration works
  const result = await tasklets.run(() => 'native test');
  expect(typeof result).toBe('string');
  expect(result).toBe('Task completed successfully');
  });

  test('should handle configuration through native module', () => {
  // Configuration should work
  expect(() => tasklets.config({ workers: 2 })).not.toThrow();
  expect(() => tasklets.config({ timeout: 5000 })).not.toThrow();
  expect(() => tasklets.config({ logging: 'debug' })).not.toThrow();
  });

  test('should handle statistics through native module', () => {
  // Statistics should be available
  const stats = tasklets.getStats();
  expect(stats).toBeDefined();
  expect(typeof stats).toBe('object');
  expect(stats).toHaveProperty('workers');
  expect(stats).toHaveProperty('tasks');
  expect(stats).toHaveProperty('performance');
  expect(stats).toHaveProperty('system');
  expect(stats).toHaveProperty('config');
  });

  test('should handle health monitoring through native module', () => {
  // Health monitoring should be available
  const health = tasklets.getHealth();
  expect(health).toBeDefined();
  expect(typeof health).toBe('object');
  expect(health).toHaveProperty('status');
  expect(health).toHaveProperty('workers');
  expect(health).toHaveProperty('memory');
  expect(health).toHaveProperty('tasks');
  });

  test('should handle worker thread configuration', () => {
  const originalStats = tasklets.getStats();

  // Configure workers
  tasklets.config({ workers: 4 });

  const newStats = tasklets.getStats();
  expect(newStats.workers).toBe(4);
  });

  test('should handle logging level configuration', () => {
  const levels = ['off', 'error', 'warn', 'info', 'debug', 'trace'];

  levels.forEach(level => {
  expect(() => tasklets.config({ logging: level })).not.toThrow();

  const stats = tasklets.getStats();
  expect(stats.config.logging).toBe(level);
  });
  });

  test('should handle auto worker detection', () => {
  tasklets.config({ workers: 'auto' });

  const stats = tasklets.getStats();
  const cpuCount = require('os').cpus().length;

  expect(stats.workers).toBe(cpuCount);
  });

  test('should handle native module error conditions gracefully', () => {
  // These should not throw errors
  expect(() => tasklets.getStats()).not.toThrow();
  expect(() => tasklets.getHealth()).not.toThrow();
  expect(() => tasklets.config({})).not.toThrow();
  });

  test('should handle concurrent native module access', async () => {
  const promises = [];

  // Multiple concurrent operations
  for (let i = 0; i < 10; i++) {
  promises.push(tasklets.run(() => `concurrent-${i}`));
  }

  const results = await Promise.all(promises);

  expect(results.length).toBe(10);
  results.forEach(result => {
  expect(typeof result).toBe('string');
  expect(result).toBe('Task completed successfully');
  });
  });

  test('should handle mixed native module operations', async () => {
  // Mix of different operations
  const operations = [
  tasklets.run(() => 'test1'),
  Promise.resolve(tasklets.getStats()),
  Promise.resolve(tasklets.getHealth()),
  tasklets.run(() => 'test2')
  ];

  const results = await Promise.all(operations);

  expect(results.length).toBe(4);
  expect(typeof results[0]).toBe('string'); // run result
  expect(typeof results[1]).toBe('object'); // stats
  expect(typeof results[2]).toBe('object'); // health
  expect(typeof results[3]).toBe('string'); // run result
  });
  });

  describe('EventEmitter functionality', () => {
  test('should support EventEmitter methods', () => {
  // Tasklets class extends EventEmitter
  expect(typeof tasklets.on).toBe('function');
  expect(typeof tasklets.emit).toBe('function');
  expect(typeof tasklets.off).toBe('function');
  expect(typeof tasklets.removeListener).toBe('function');
  expect(typeof tasklets.removeAllListeners).toBe('function');
  });

  test('should handle event listeners', () => {
  let eventReceived = false;

  const listener = () => {
  eventReceived = true;
  };

  // Add listener
  tasklets.on('test-event', listener);

  // Emit event
  tasklets.emit('test-event');

  expect(eventReceived).toBe(true);

  // Clean up
  tasklets.removeListener('test-event', listener);
  });

  test('should handle multiple event listeners', () => {
  let count = 0;

  const listener1 = () => { count += 1; };
  const listener2 = () => { count += 2; };

  tasklets.on('multi-event', listener1);
  tasklets.on('multi-event', listener2);

  tasklets.emit('multi-event');

  expect(count).toBe(3);

  // Clean up
  tasklets.removeAllListeners('multi-event');
  });

  test('should handle event listener removal', () => {
  let eventReceived = false;

  const listener = () => {
  eventReceived = true;
  };

  tasklets.on('remove-event', listener);
  tasklets.removeListener('remove-event', listener);

  tasklets.emit('remove-event');

  expect(eventReceived).toBe(false);
  });

  test('should handle event data passing', () => {
  let receivedData = null;

  const listener = (data) => {
  receivedData = data;
  };

  tasklets.on('data-event', listener);

  const testData = { message: 'test', value: 42 };
  tasklets.emit('data-event', testData);

  expect(receivedData).toEqual(testData);

  // Clean up
  tasklets.removeListener('data-event', listener);
  });

  test('should handle error events', () => {
  let errorReceived = null;

  const errorListener = (error) => {
  errorReceived = error;
  };

  tasklets.on('error', errorListener);

  const testError = new Error('Test error');
  tasklets.emit('error', testError);

  expect(errorReceived).toBe(testError);

  // Clean up
  tasklets.removeListener('error', errorListener);
  });

  test('should handle shutdown events', async () => {
  let shutdownReceived = false;

  const shutdownListener = () => {
  shutdownReceived = true;
  };

  tasklets.on('shutdown', shutdownListener);

  // Run a task then shutdown
  await tasklets.run(() => 'test');
  await tasklets.shutdown();

  expect(shutdownReceived).toBe(true);

  // Clean up
  tasklets.removeListener('shutdown', shutdownListener);
  });

  test('should handle once listeners', () => {
  let callCount = 0;

  const onceListener = () => {
  callCount++;
  };

  tasklets.once('once-event', onceListener);

  // Emit multiple times
  tasklets.emit('once-event');
  tasklets.emit('once-event');
  tasklets.emit('once-event');

  expect(callCount).toBe(1);
  });

  test('should handle listener count', () => {
  const listener1 = () => {};
  const listener2 = () => {};

  tasklets.on('count-event', listener1);
  tasklets.on('count-event', listener2);

  expect(tasklets.listenerCount('count-event')).toBe(2);

  tasklets.removeListener('count-event', listener1);

  expect(tasklets.listenerCount('count-event')).toBe(1);

  // Clean up
  tasklets.removeAllListeners('count-event');
  });
  });

  describe('resource management', () => {
  test('should manage resources efficiently', async () => {
  const initialHealth = tasklets.getHealth();

  // Run multiple tasks
  await tasklets.runAll([
  () => 'resource1',
  () => 'resource2',
  () => 'resource3'
  ]);

  const finalHealth = tasklets.getHealth();

  // Should maintain healthy status
  expect(finalHealth.status).toBe('healthy');
  expect(finalHealth.workers.count).toBe(initialHealth.workers.count);
  });

  test('should handle memory management', async () => {
  const initialHealth = tasklets.getHealth();
  const initialMemory = initialHealth.memory.used;

  // Run memory-intensive tasks
  await tasklets.runAll([
  () => new Array(1000).fill(0),
  () => new Array(1000).fill(1),
  () => new Array(1000).fill(2)
  ]);

  const finalHealth = tasklets.getHealth();

  // Memory usage should still be reasonable
  expect(finalHealth.memory.percentage).toBeLessThan(95);
  expect(finalHealth.status).toBe('healthy');
  });

  test('should handle worker thread lifecycle', () => {
  const workerConfigs = [1, 2, 4, 8];

  workerConfigs.forEach(workers => {
  tasklets.config({ workers });

  const stats = tasklets.getStats();
  expect(stats.workers).toBe(workers);

  const health = tasklets.getHealth();
  expect(health.workers.count).toBe(workers);
  expect(health.status).toBe('healthy');
  });
  });

  test('should handle resource cleanup', async () => {
  // Run tasks and check resource usage
  await tasklets.runAll(Array.from({ length: 10 }, (_, i) => () => `cleanup-${i}`));

  const preShutdownHealth = tasklets.getHealth();
  expect(preShutdownHealth.status).toBe('healthy');

  // Shutdown and verify cleanup
  await tasklets.shutdown();

  // System should still be responsive after shutdown
  const postShutdownHealth = tasklets.getHealth();
  expect(postShutdownHealth.status).toBe('healthy');
  });

  test('should handle concurrent resource access', async () => {
  const concurrentOperations = [];

  // Mix of different operations
  for (let i = 0; i < 20; i++) {
  if (i % 4 === 0) {
  concurrentOperations.push(tasklets.run(() => `concurrent-${i}`));
  } else if (i % 4 === 1) {
  concurrentOperations.push(Promise.resolve(tasklets.getStats()));
  } else if (i % 4 === 2) {
  concurrentOperations.push(Promise.resolve(tasklets.getHealth()));
  } else {
  concurrentOperations.push(Promise.resolve(tasklets.config({ workers: 2 + (i % 4) })));
  }
  }

  const results = await Promise.all(concurrentOperations);

  expect(results.length).toBe(20);

  // System should remain healthy
  const finalHealth = tasklets.getHealth();
  expect(finalHealth.status).toBe('healthy');
  });
  });

  describe('thread safety', () => {
  test('should handle concurrent configuration changes', async () => {
  const configPromises = [];

  // Multiple concurrent configuration changes
  for (let i = 0; i < 10; i++) {
  configPromises.push(Promise.resolve(tasklets.config({
  workers: 2 + (i % 4),
  timeout: 1000 + (i * 1000),
  logging: i % 2 === 0 ? 'info' : 'debug'
  })));
  }

  await Promise.all(configPromises);

  // Should not cause errors
  const stats = tasklets.getStats();
  expect(stats).toBeDefined();
  expect(stats.workers).toBeGreaterThan(0);
  });

  test('should handle concurrent task execution and stats access', async () => {
  const operations = [];

  // Mix tasks and stats access
  for (let i = 0; i < 20; i++) {
  if (i % 2 === 0) {
  operations.push(tasklets.run(() => `thread-safe-${i}`));
  } else {
  operations.push(Promise.resolve(tasklets.getStats()));
  }
  }

  const results = await Promise.all(operations);

  expect(results.length).toBe(20);

  // Verify task results
  results.forEach((result, index) => {
  if (index % 2 === 0) {
  expect(typeof result).toBe('string');
  expect(result).toBe('Task completed successfully');
  } else {
  expect(typeof result).toBe('object');
  expect(result).toHaveProperty('workers');
  }
  });
  });

  test('should handle concurrent shutdown calls', async () => {
  // Run some tasks
  await tasklets.run(() => 'pre-shutdown');

  // Multiple concurrent shutdown calls
  const shutdownPromises = [
  tasklets.shutdown({ timeout: 1000 }),
  tasklets.shutdown({ timeout: 2000 }),
  tasklets.shutdown({ timeout: 3000 })
  ];

  // All should complete without errors
  await Promise.all(shutdownPromises);
  });

  test('should maintain data consistency under load', async () => {
  const initialStats = tasklets.getStats();

  // High load operations
  const loadOperations = [];
  for (let i = 0; i < 50; i++) {
  loadOperations.push(tasklets.run(() => `load-${i}`));
  }

  const results = await Promise.all(loadOperations);

  expect(results.length).toBe(50);

  const finalStats = tasklets.getStats();

  // Worker count should remain consistent
  expect(finalStats.workers).toBe(initialStats.workers);

  // System should remain healthy
  const health = tasklets.getHealth();
  expect(health.status).toBe('healthy');
  });
  });

  describe('system integration', () => {
  test('should integrate with Node.js process', () => {
  // Should have access to Node.js globals
  expect(typeof process).toBe('object');
  expect(typeof process.version).toBe('string');
  expect(typeof process.platform).toBe('string');
  });

  test('should handle different Node.js environments', () => {
  const stats = tasklets.getStats();

  // Should adapt to system capabilities
  expect(stats.system.cpuCores).toBeGreaterThan(0);
  expect(stats.system.memoryUsage).toBeDefined();
  expect(stats.system.uptime).toBeGreaterThan(0);
  });

  test('should handle system resource constraints', async () => {
  // Test with different worker configurations
  const systemCpus = require('os').cpus().length;

  // Test with more workers than CPUs
  tasklets.config({ workers: systemCpus * 2 });

  const result = await tasklets.run(() => 'oversubscribed');
  expect(typeof result).toBe('string');
  expect(result).toBe('Task completed successfully');

  const health = tasklets.getHealth();
  expect(health.status).toBe('healthy');
  });

  test('should handle environment-specific configurations', () => {
  const originalEnv = process.env.NODE_ENV;

  try {
  // Test different environments
  const environments = ['development', 'production', 'test'];

  environments.forEach(env => {
  process.env.NODE_ENV = env;

  // Configuration should work in any environment
  expect(() => tasklets.config({ workers: 2 })).not.toThrow();

  const stats = tasklets.getStats();
  expect(stats).toBeDefined();
  });
  } finally {
  // Restore original environment
  process.env.NODE_ENV = originalEnv;
  }
  });

  test('should handle graceful degradation', async () => {
  // Test with minimal resources
  tasklets.config({ workers: 1, timeout: 1000 });

  const result = await tasklets.run(() => 'minimal');
  expect(typeof result).toBe('string');
  expect(result).toBe('Task completed successfully');

  const health = tasklets.getHealth();
  expect(health.status).toBe('healthy');
  expect(health.workers.count).toBe(1);
  });
  });
}); 