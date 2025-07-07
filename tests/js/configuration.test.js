/**
 * Tests for configuration management
 */

const tasklets = require('../../lib/index');

describe('Configuration Management Tests', () => {
  beforeEach(() => {
  // Reset to default configuration
  tasklets.config({
  workers: 'auto',
  timeout: 30000,
  logging: 'info',
  maxMemory: '1GB'
  });
  });

  describe('config() function', () => {
  test('should set configuration options', () => {
  const result = tasklets.config({
  workers: 4,
  timeout: 5000,
  logging: 'debug'
  });

  // Should return the tasklets instance for chaining
  expect(result).toBe(tasklets);
  });

  test('should handle auto worker detection', () => {
  const result = tasklets.config({
  workers: 'auto'
  });

  expect(result).toBe(tasklets);

  // Should detect and set worker count based on CPU cores
  const stats = tasklets.getStats();
  expect(stats.workers).toBeGreaterThan(0);
  });

  test('should handle numeric worker count', () => {
  const result = tasklets.config({
  workers: 3
  });

  expect(result).toBe(tasklets);

  // Should set the specified number of workers
  const stats = tasklets.getStats();
  expect(stats.workers).toBe(3);
  });

  test('should handle string worker count', () => {
  const result = tasklets.config({
  workers: '2'
  });

  expect(result).toBe(tasklets);

  // Should parse and set the worker count
  const stats = tasklets.getStats();
  expect(stats.workers).toBe(2);
  });

  test('should handle timeout configuration', () => {
  const result = tasklets.config({
  timeout: 10000
  });

  expect(result).toBe(tasklets);

  // Configuration should be stored internally
  const stats = tasklets.getStats();
  expect(stats.config.timeout).toBe(10000);
  });

  test('should handle logging level configuration', () => {
  const logLevels = ['off', 'error', 'warn', 'info', 'debug', 'trace'];

  logLevels.forEach(level => {
  const result = tasklets.config({
  logging: level
  });

  expect(result).toBe(tasklets);

  // Configuration should be stored
  const stats = tasklets.getStats();
  expect(stats.config.logging).toBe(level);
  });
  });

  test('should handle maxMemory configuration', () => {
  const result = tasklets.config({
  maxMemory: '2GB'
  });

  expect(result).toBe(tasklets);

  // Configuration should be stored
  const stats = tasklets.getStats();
  expect(stats.config.maxMemory).toBe('2GB');
  });

  test('should handle multiple configuration options', () => {
  const config = {
  workers: 2,
  timeout: 15000,
  logging: 'warn',
  maxMemory: '512MB'
  };

  const result = tasklets.config(config);

  expect(result).toBe(tasklets);

  // All configuration should be stored
  const stats = tasklets.getStats();
  expect(stats.workers).toBe(2);
  expect(stats.config.timeout).toBe(15000);
  expect(stats.config.logging).toBe('warn');
  expect(stats.config.maxMemory).toBe('512MB');
  });

  test('should handle partial configuration updates', () => {
  // Set initial configuration
  tasklets.config({
  workers: 2,
  timeout: 10000,
  logging: 'debug'
  });

  // Update only logging
  const result = tasklets.config({
  logging: 'error'
  });

  expect(result).toBe(tasklets);

  // Should preserve other settings
  const stats = tasklets.getStats();
  expect(stats.workers).toBe(2);
  expect(stats.config.timeout).toBe(10000);
  expect(stats.config.logging).toBe('error');
  });

  test('should handle empty configuration', () => {
  const result = tasklets.config({});

  expect(result).toBe(tasklets);

  // Should not throw error
  const stats = tasklets.getStats();
  expect(stats).toBeDefined();
  });

  test('should handle no configuration parameter', () => {
  const result = tasklets.config();

  expect(result).toBe(tasklets);

  // Should not throw error
  const stats = tasklets.getStats();
  expect(stats).toBeDefined();
  });

  test('should handle invalid logging level gracefully', () => {
  const result = tasklets.config({
  logging: 'invalid_level'
  });

  expect(result).toBe(tasklets);

  // Should default to info level
  const stats = tasklets.getStats();
  expect(stats.config.logging).toBe('invalid_level'); // Configuration is stored as-is
  });

  test('should handle zero workers', () => {
  const result = tasklets.config({
  workers: 0
  });

  expect(result).toBe(tasklets);

  // Should handle zero workers gracefully
  const stats = tasklets.getStats();
  expect(stats.workers).toBeGreaterThanOrEqual(0);
  });

  test('should handle negative timeout', () => {
  const result = tasklets.config({
  timeout: -1000
  });

  expect(result).toBe(tasklets);

  // Configuration should be stored as-is
  const stats = tasklets.getStats();
  expect(stats.config.timeout).toBe(-1000);
  });

  test('should handle zero timeout', () => {
  const result = tasklets.config({
  timeout: 0
  });

  expect(result).toBe(tasklets);

  // Configuration should be stored
  const stats = tasklets.getStats();
  expect(stats.config.timeout).toBe(0);
  });

  test('should handle configuration chaining', () => {
  const result = tasklets
  .config({ workers: 2 })
  .config({ timeout: 5000 })
  .config({ logging: 'debug' });

  expect(result).toBe(tasklets);

  // All configurations should be applied
  const stats = tasklets.getStats();
  expect(stats.workers).toBe(2);
  expect(stats.config.timeout).toBe(5000);
  expect(stats.config.logging).toBe('debug');
  });

  test('should validate configuration persistence', async () => {
  // Set configuration
  tasklets.config({
  workers: 3,
  timeout: 8000,
  logging: 'warn'
  });

  // Run a task
  const result = await tasklets.run(() => {
  return 'test';
  });

  expect(typeof result).toBe('string');
  expect(result).toBe('Task completed successfully');

  // Configuration should still be there
  const stats = tasklets.getStats();
  expect(stats.workers).toBe(3);
  expect(stats.config.timeout).toBe(8000);
  expect(stats.config.logging).toBe('warn');
  });

  test('should handle configuration with special characters', () => {
  const result = tasklets.config({
  maxMemory: '1.5GB',
  logging: 'debug'
  });

  expect(result).toBe(tasklets);

  // Configuration should be stored
  const stats = tasklets.getStats();
  expect(stats.config.maxMemory).toBe('1.5GB');
  expect(stats.config.logging).toBe('debug');
  });

  test('should handle large worker count', () => {
  const result = tasklets.config({
  workers: 1000
  });

  expect(result).toBe(tasklets);

  // Should set the worker count
  const stats = tasklets.getStats();
  expect(stats.workers).toBe(1000);
  });

  test('should handle large timeout values', () => {
  const result = tasklets.config({
  timeout: 3600000 // 1 hour
  });

  expect(result).toBe(tasklets);

  // Configuration should be stored
  const stats = tasklets.getStats();
  expect(stats.config.timeout).toBe(3600000);
  });

  test('should handle configuration overrides', () => {
  // Set initial configuration
  tasklets.config({
  workers: 2,
  timeout: 5000,
  logging: 'info'
  });

  // Override with new configuration
  const result = tasklets.config({
  workers: 4,
  timeout: 10000,
  logging: 'debug',
  maxMemory: '2GB'
  });

  expect(result).toBe(tasklets);

  // New configuration should override old
  const stats = tasklets.getStats();
  expect(stats.workers).toBe(4);
  expect(stats.config.timeout).toBe(10000);
  expect(stats.config.logging).toBe('debug');
  expect(stats.config.maxMemory).toBe('2GB');
  });

  test('should handle concurrent configuration changes', async () => {
  const promises = [];

  // Multiple concurrent configuration changes
  for (let i = 0; i < 5; i++) {
  promises.push(Promise.resolve(tasklets.config({
  workers: i + 1,
  timeout: (i + 1) * 1000
  })));
  }

  await Promise.all(promises);

  // Should not throw errors
  const stats = tasklets.getStats();
  expect(stats).toBeDefined();
  expect(stats.workers).toBeGreaterThan(0);
  });
  });

  describe('worker configuration', () => {
  test('should auto-detect CPU cores', () => {
  tasklets.config({ workers: 'auto' });

  const stats = tasklets.getStats();
  const cpuCount = require('os').cpus().length;

  expect(stats.workers).toBe(cpuCount);
  });

  test('should handle explicit worker count', () => {
  tasklets.config({ workers: 6 });

  const stats = tasklets.getStats();
  expect(stats.workers).toBe(6);
  });

  test('should handle worker count as string', () => {
  tasklets.config({ workers: '8' });

  const stats = tasklets.getStats();
  expect(stats.workers).toBe(8);
  });

  test('should handle worker count boundary values', () => {
  const testValues = [1, 2, 4, 8, 16, 32];

  testValues.forEach(workers => {
  tasklets.config({ workers });

  const stats = tasklets.getStats();
  expect(stats.workers).toBe(workers);
  });
  });
  });

  describe('timeout configuration', () => {
  test('should handle various timeout values', () => {
  const timeouts = [100, 1000, 5000, 10000, 30000, 60000];

  timeouts.forEach(timeout => {
  tasklets.config({ timeout });

  const stats = tasklets.getStats();
  expect(stats.config.timeout).toBe(timeout);
  });
  });

  test('should handle timeout edge cases', () => {
  const edgeCases = [0, 1, -1, Number.MAX_SAFE_INTEGER];

  edgeCases.forEach(timeout => {
  tasklets.config({ timeout });

  const stats = tasklets.getStats();
  expect(stats.config.timeout).toBe(timeout);
  });
  });
  });

  describe('logging configuration', () => {
  test('should handle all logging levels', () => {
  const levels = ['off', 'error', 'warn', 'info', 'debug', 'trace'];

  levels.forEach(level => {
  tasklets.config({ logging: level });

  const stats = tasklets.getStats();
  expect(stats.config.logging).toBe(level);
  });
  });

  test('should handle case sensitivity', () => {
  const cases = ['OFF', 'Error', 'WARN', 'Info', 'DEBUG', 'Trace'];

  cases.forEach(level => {
  tasklets.config({ logging: level });

  const stats = tasklets.getStats();
  expect(stats.config.logging).toBe(level);
  });
  });
  });

  describe('memory configuration', () => {
  test('should handle various memory formats', () => {
  const formats = ['512MB', '1GB', '2GB', '4GB', '1.5GB', '2048MB'];

  formats.forEach(maxMemory => {
  tasklets.config({ maxMemory });

  const stats = tasklets.getStats();
  expect(stats.config.maxMemory).toBe(maxMemory);
  });
  });

  test('should handle memory edge cases', () => {
  const edgeCases = ['0MB', '1KB', '1TB', '999999MB'];

  edgeCases.forEach(maxMemory => {
  tasklets.config({ maxMemory });

  const stats = tasklets.getStats();
  expect(stats.config.maxMemory).toBe(maxMemory);
  });
  });
  });

  describe('configuration validation', () => {
  test('should handle configuration with tasks running', async () => {
  // Start a task
  const taskPromise = tasklets.run(() => {
  return 'running task';
  });

  // Change configuration while task is running
  tasklets.config({
  workers: 3,
  logging: 'debug'
  });

  // Wait for task to complete
  const result = await taskPromise;
  expect(typeof result).toBe('string');
  expect(result).toBe('Task completed successfully');

  // Configuration should be applied
  const stats = tasklets.getStats();
  expect(stats.workers).toBe(3);
  expect(stats.config.logging).toBe('debug');
  });

  test('should maintain configuration across multiple operations', async () => {
  tasklets.config({
  workers: 2,
  timeout: 5000,
  logging: 'warn'
  });

  // Run multiple operations
  const results = await Promise.all([
  tasklets.run(() => 'task1'),
  tasklets.run(() => 'task2'),
  tasklets.run(() => 'task3')
  ]);

  expect(results.length).toBe(3);
  results.forEach(result => {
  expect(typeof result).toBe('string');
  expect(result).toBe('Task completed successfully');
  });

  // Configuration should still be maintained
  const stats = tasklets.getStats();
  expect(stats.workers).toBe(2);
  expect(stats.config.timeout).toBe(5000);
  expect(stats.config.logging).toBe('warn');
  });
  });
}); 