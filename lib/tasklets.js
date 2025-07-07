/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 * 
 * @file tasklets.js
 * @brief Modern user-friendly tasklets API for Node.js
 */

const EventEmitter = require('events');

// Load the native module
let nativeModule;
try {
  nativeModule = require('../build/Release/tasklets');
} catch (error) {
  console.error('Failed to load native tasklets module:', error.message);
  console.error('Make sure to build the project first with: npm run build');
  process.exit(1);
}

/**
 * Modern Tasklets API - Simple, Promise-based, and user-friendly
 */
class Tasklets extends EventEmitter {
  constructor() {
  super();
  this.nativeModule = nativeModule;
  this.defaultConfig = {
  workers: 'auto',
  timeout: 30000,
  logging: 'info',
  maxMemory: '1GB'
  };
  this.currentConfig = { ...this.defaultConfig };
  this._initializeDefaults();
  }

  /**
  * Initialize default configuration
  * @private
  */
  _initializeDefaults() {
  if (this.currentConfig.workers === 'auto') {
  // Auto-detect optimal worker count
  const cpuCount = require('os').cpus().length;
  this.nativeModule.setWorkerThreadCount(cpuCount);
  }

  // Set log level
  const logLevels = { off: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 5 };
  this.nativeModule.setLogLevel(logLevels[this.currentConfig.logging] || 3);
  }

  /**
  * Configure tasklets behavior
  * @param {Object} config - Configuration object
  * @param {number|string} config.workers - Number of workers or 'auto'
  * @param {number} config.timeout - Default timeout in milliseconds
  * @param {string} config.logging - Log level: 'off', 'error', 'warn', 'info', 'debug', 'trace'
  * @param {string} config.maxMemory - Maximum memory usage (not yet implemented)
  * @returns {Tasklets} This instance for chaining
  */
  config(config = {}) {
  this.currentConfig = { ...this.currentConfig, ...config };

  // Apply worker count
  if (config.workers !== undefined) {
  const workerCount = config.workers === 'auto'
  ? require('os').cpus().length
  : parseInt(config.workers);
  this.nativeModule.setWorkerThreadCount(workerCount);
  }

  // Apply log level
  if (config.logging !== undefined) {
  const logLevels = { off: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 5 };
  this.nativeModule.setLogLevel(logLevels[config.logging] || 3);
  }

  return this;
  }

  /**
  * Run a single task
  * @param {Function} task - Task function to execute
  * @param {Object} options - Options for the task
  * @param {number} options.timeout - Timeout in milliseconds
  * @returns {Promise} Promise that resolves with the task result
  */
  async run(task, options = {}) {
  if (typeof task !== 'function') {
  throw new Error('Task must be a function');
  }

  const timeout = options.timeout || this.currentConfig.timeout;

  return new Promise((resolve, reject) => {
  let taskletId;
  let timeoutId;

  // Set up timeout
  if (timeout && timeout > 0) {
  timeoutId = setTimeout(() => {
  reject(new Error(`Task timed out after ${timeout}ms`));
  }, timeout);
  }

  try {
  taskletId = this.nativeModule.spawn(task, options);

  // Check completion
  const checkCompletion = () => {
  try {
  if (this.nativeModule.hasError(taskletId)) {
  clearTimeout(timeoutId);
  reject(new Error(this.nativeModule.getError(taskletId)));
  return;
  }

  try {
  const result = this.nativeModule.getResult(taskletId);
  clearTimeout(timeoutId);
  resolve(result);
  } catch (error) {
  // Task still running, check again
  setImmediate(checkCompletion);
  }
  } catch (error) {
  clearTimeout(timeoutId);
  reject(error);
  }
  };

  setImmediate(checkCompletion);

  } catch (error) {
  clearTimeout(timeoutId);
  reject(error);
  }
  });
  }

  /**
  * Run multiple tasks in parallel
  * @param {Array<Function>} tasks - Array of task functions
  * @param {Object} options - Options for the tasks
  * @returns {Promise<Array>} Promise that resolves with array of results
  */
  async runAll(tasks, options = {}) {
  if (!Array.isArray(tasks)) {
  throw new Error('Tasks must be an array of functions');
  }

  return Promise.all(tasks.map(task => this.run(task, options)));
  }

  /**
  * Run tasks in batches with progress tracking
  * @param {Array<Object>} taskConfigs - Array of task configurations
  * @param {Object} options - Batch options
  * @param {Function} options.onProgress - Progress callback
  * @returns {Promise<Array>} Promise that resolves with array of results
  */
  async batch(taskConfigs, options = {}) {
  if (!Array.isArray(taskConfigs)) {
  throw new Error('Task configurations must be an array');
  }

  const results = [];
  const total = taskConfigs.length;
  let completed = 0;

  for (const config of taskConfigs) {
  if (typeof config.task !== 'function') {
  throw new Error('Each task configuration must have a task function');
  }

  try {
  const result = await this.run(config.task, config.options);
  results.push({
  name: config.name || `task-${completed}`,
  result,
  success: true
  });
  } catch (error) {
  results.push({
  name: config.name || `task-${completed}`,
  error: error.message,
  success: false
  });
  }

  completed++;

  if (options.onProgress) {
  options.onProgress({
  completed,
  total,
  percentage: Math.round((completed / total) * 100)
  });
  }
  }

  return results;
  }

  /**
  * Retry a task with exponential backoff
  * @param {Function} task - Task function to retry
  * @param {Object} options - Retry options
  * @param {number} options.attempts - Maximum number of attempts (default: 3)
  * @param {number} options.delay - Initial delay in milliseconds (default: 1000)
  * @param {number} options.backoff - Backoff multiplier (default: 2)
  * @returns {Promise} Promise that resolves with the task result
  */
  async retry(task, options = {}) {
  const { attempts = 3, delay = 1000, backoff = 2 } = options;

  let lastError;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= attempts; attempt++) {
  try {
  return await this.run(task, options);
  } catch (error) {
  lastError = error;

  if (attempt === attempts) {
  throw new Error(`Task failed after ${attempts} attempts. Last error: ${error.message}`);
  }

  // Wait before retry
  await new Promise(resolve => setTimeout(resolve, currentDelay));
  currentDelay *= backoff;
  }
  }
  }

  /**
  * Get system performance and statistics
  * @returns {Object} Performance statistics
  */
  getStats() {
  try {
  const nativeStats = this.nativeModule.getStats();
  const workerCount = this.nativeModule.getWorkerThreadCount();
  const logLevel = this.nativeModule.getLogLevel();

  return {
  workers: workerCount,
  tasks: {
  completed: nativeStats.completedTasklets || 0,
  active: nativeStats.activeTasklets || 0,
  queued: 0, // Not provided by native module
  total: nativeStats.totalTaskletsCreated || 0,
  failed: nativeStats.failedTasklets || 0
  },
  performance: {
  throughput: nativeStats.throughput || 0,
  averageExecutionTime: nativeStats.averageExecutionTimeMs || 0,
  totalExecutionTime: nativeStats.totalExecutionTimeMs || 0,
  successRate: nativeStats.successRate || 0
  },
  system: {
  cpuCores: require('os').cpus().length,
  memoryUsage: process.memoryUsage(),
  uptime: process.uptime()
  },
  config: this.currentConfig
  };
  } catch (error) {
  this.emit('error', error);
  throw error;
  }
  }

  /**
  * Get health status of the tasklets system
  * @returns {Object} Health information
  */
  getHealth() {
  try {
  const stats = this.getStats();
  const memUsage = process.memoryUsage();

  return {
  status: 'healthy',
  workers: {
  count: stats.workers,
  utilization: stats.tasks.active / stats.workers
  },
  memory: {
  used: Math.round(memUsage.heapUsed / 1024 / 1024),
  total: Math.round(memUsage.heapTotal / 1024 / 1024),
  percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
  },
  tasks: {
  completed: stats.tasks.completed,
  active: stats.tasks.active,
  queued: stats.tasks.queued
  }
  };
  } catch (error) {
  return {
  status: 'unhealthy',
  error: error.message
  };
  }
  }

  /**
  * Gracefully shutdown the tasklets system
  * @param {Object} options - Shutdown options
  * @param {number} options.timeout - Timeout to wait for tasks to complete
  * @returns {Promise} Promise that resolves when shutdown is complete
  */
  async shutdown(options = {}) {
  const { timeout = 10000 } = options;

  return new Promise((resolve, reject) => {
  const shutdownTimeout = setTimeout(() => {
  reject(new Error('Shutdown timed out'));
  }, timeout);

  try {
  // Wait for all tasks to complete
  this.nativeModule.joinAll();
  clearTimeout(shutdownTimeout);
  this.emit('shutdown');
  resolve();
  } catch (error) {
  clearTimeout(shutdownTimeout);
  reject(error);
  }
  });
  }
}

// Create the modern API instance
const tasklets = new Tasklets();

// Export the modern API
module.exports = tasklets;
module.exports.Tasklets = Tasklets;
module.exports.default = tasklets;

// Modern API exports
module.exports.run = tasklets.run.bind(tasklets);
module.exports.runAll = tasklets.runAll.bind(tasklets);
module.exports.batch = tasklets.batch.bind(tasklets);
module.exports.retry = tasklets.retry.bind(tasklets);
module.exports.config = tasklets.config.bind(tasklets);
module.exports.getStats = tasklets.getStats.bind(tasklets);
module.exports.getHealth = tasklets.getHealth.bind(tasklets);
module.exports.shutdown = tasklets.shutdown.bind(tasklets); 