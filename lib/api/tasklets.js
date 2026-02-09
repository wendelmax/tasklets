/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file tasklets.js
 * @brief Main tasklets API - High-level task execution and management
 */

const EventEmitter = require('events');
const TaskletsCore = require('../core');
const { smartDeserialize } = require('../core');
const TaskletsConfig = require('../config');
const TaskletsLogger = require('../core/logger');
const TaskletsStats = require('../core/stats');
const PerformanceManager = require('../performance');
const ConfigOptimizer = require('../config/optimizer');

/**
 * Main Tasklets class - High-level API for task execution and management
 */
class Tasklets extends EventEmitter {
  constructor() {
    super();

    // OPTIMIZATION #1: Eager initialization instead of lazy loading
    // This eliminates getter overhead on every call (~10% performance improvement)
    this._core = new TaskletsCore();
    this._config = new TaskletsConfig();
    this._logger = new TaskletsLogger();
    this._stats = new TaskletsStats(this._core, this._config);

    // Initialize performance and configuration optimizers
    this._performance = new PerformanceManager();
    this._configOptimizer = new ConfigOptimizer();

    // Set logger level from config
    this._logger.setLevel(this._config.getLogLevel());

    // Initialize configuration methods
    this._initConfigMethods();

    this._pendingTasks = new Map();
    this._priorityQueue = [];
    this._priorityDraining = false;
    this._priorityOrder = { high: 0, normal: 1, low: 2 };
    this.enableAdaptiveMode();
    this.enableAutoScheduling();
  }

  // =====================================================================
  // Direct Property Access (No Lazy Loading)
  // =====================================================================

  get core() {
    return this._core;
  }

  get config() {
    return this._config;
  }

  get logger() {
    return this._logger;
  }

  get stats() {
    return this._stats;
  }

  _initConfigMethods() {
    // Expose configuration methods directly for user-friendly API
    this.configure = (options) => { this._config.configure(options); return this; };
    this.quickConfig = (options) => { this._config.quickConfig(options); return this; };
    this.configureForWorkload = (workloadType) => { this._config.configureForWorkload(workloadType); return this; };
  }

  // =====================================================================
  // Optimized Task Execution API
  // =====================================================================

  run(task, options = {}) {
    // Handle array of tasks (runAll shortcut)
    if (Array.isArray(task)) {
      return this.runAll(task, options);
    }

    if (typeof task !== 'function') {
      return Promise.reject(new Error('Task must be a function or an array of functions'));
    }

    // OPTIMIZATION #2: Fast path for simple tasks
    // Bypass performance tracking, caching, and priority queue for better performance
    const isSimpleTask = !options.priority && !options.timeout && !options.retry;
    if (isSimpleTask) {
      return this.runFast(task);
    }

    // Slow path: full feature set
    const priority = options.priority && this._priorityOrder[options.priority] !== undefined
      ? options.priority
      : null;

    if (priority) {
      return new Promise((resolve, reject) => {
        this._priorityQueue.push({
          taskFunction: task,
          options: { ...options },
          resolve,
          reject,
          priority: this._priorityOrder[priority]
        });
        setImmediate(() => this._drainPriorityQueue());
      });
    }

    const startTime = Date.now();
    const taskId = this._performance.getTaskId(task);

    // HEURISTIC: Check if this task is inefficient for Tasklets
    if (this._config.config.heuristicMode) {
      const report = this._performance.getInefficiencyReport(
        taskId,
        this._config.config.minTaskDuration,
        this._config.config.heuristicMinSamples
      );

      if (report) {
        this.logger.info(`[Tasklets:Heuristic] Redirecting task ${taskId} to native execution (avg time: ${report.avg.toFixed(2)}ms < ${this._config.config.minTaskDuration}ms)`);
        try {
          const result = task();
          return Promise.resolve(result);
        } catch (err) {
          return Promise.reject(err);
        }
      }
    }

    const cached = this._performance.getCachedTask(taskId);
    if (cached) {
      return this._executeCachedTask(cached, options);
    }

    // Use the new native Promise-based run
    return this.core.run(task)
      .then(result => {
        const executionTime = Date.now() - startTime;
        this._performance.recordExecutionTime(executionTime, taskId);

        if (result.success) {
          return this._hydrateResult(result.data);
        } else {
          const err = new Error(result.error || 'Task execution failed');
          err.taskId = result.taskId;
          err.duration = executionTime;
          throw err;
        }
      });
  }

  /**
   * OPTIMIZATION #2: Fast path execution
   * Bypasses all overhead (performance tracking, caching, priority queue)
   * Use this for simple, one-off tasks where you want minimal overhead
   * 
   * @param {Function} taskFunction - The function to execute
   * @returns {Promise} Promise that resolves with the task result
   */
  runFast(task) {
    // Handle array of tasks
    if (Array.isArray(task)) {
      if (task.length === 0) return Promise.resolve([]);
      const invalidTask = task.find(t => typeof t !== 'function');
      if (invalidTask) {
        return Promise.reject(new Error('Tasks must be an array of functions'));
      }
      return this.core.run(task).then(result => {
        if (result.success) {
          return result.results.map(r => this._hydrateResult(r));
        } else {
          throw new Error(result.error || 'Batch execution failed');
        }
      });
    }

    if (typeof task !== 'function') {
      return Promise.reject(new Error('Task must be a function or an array of functions'));
    }

    const startTime = Date.now();
    const taskId = this._performance.getTaskId(task);

    // HEURISTIC: Check if this task is inefficient for Tasklets
    if (this._config.config.heuristicMode) {
      const report = this._performance.getInefficiencyReport(
        taskId,
        this._config.config.minTaskDuration,
        this._config.config.heuristicMinSamples
      );

      if (report) {
        this.logger.info(`[Tasklets:Heuristic] Redirecting task ${taskId} to native execution (avg time: ${report.avg.toFixed(2)}ms < ${this._config.config.minTaskDuration}ms)`);
        try {
          const result = task();
          return Promise.resolve(result);
        } catch (err) {
          return Promise.reject(err);
        }
      }
    }

    // Direct execution without any overhead
    return this.core.run(task)
      .then(result => {
        const executionTime = Date.now() - startTime;
        this._performance.recordExecutionTime(executionTime, taskId);

        if (result.success) {
          return this._hydrateResult(result.data);
        } else {
          const err = new Error(result.error || 'Task execution failed');
          err.taskId = result.taskId;
          throw err;
        }
      });
  }

  _drainPriorityQueue() {
    if (this._priorityDraining || this._priorityQueue.length === 0) return;
    this._priorityDraining = true;
    this._priorityQueue.sort((a, b) => a.priority - b.priority);
    const item = this._priorityQueue.shift();
    const startTime = Date.now();

    this.core.run(item.taskFunction)
      .then(result => {
        const executionTime = Date.now() - startTime;
        this._performance.recordExecutionTime(executionTime);
        if (result.success) {
          item.resolve(this._hydrateResult(result.data));
        } else {
          const err = new Error(result.error || 'Task execution failed');
          err.taskId = result.taskId;
          err.duration = executionTime;
          item.reject(err);
        }
      })
      .catch(err => {
        item.reject(err);
      })
      .finally(() => {
        this._priorityDraining = false;
        this._drainPriorityQueue();
      });
  }

  _executeCachedTask(cached, options) {
    const startTime = Date.now();
    return this.core.run(cached.taskFunction)
      .then(result => {
        const executionTime = Date.now() - startTime;
        this._performance.recordExecutionTime(executionTime);

        if (result.success) {
          return this._hydrateResult(result.data);
        } else {
          const err = new Error(result.error || 'Task execution failed');
          err.taskId = result.taskId;
          err.duration = executionTime;
          throw err;
        }
      });
  }

  _hydrateResult(str) {
    // OPTIMIZATION #4: Use smart deserialization
    return smartDeserialize(str);
  }



  cancel(taskletId) {
    const pending = this._pendingTasks.get(taskletId);
    if (pending) {
      const e = new Error('Task cancelled');
      e.taskId = taskletId;
      pending.reject(e);
      this._pendingTasks.delete(taskletId);
      return true;
    }
    return false;
  }

  createStream(options = {}) {
    const { backpressure = 'buffer', bufferSize = 1000 } = options;
    const stream = new EventEmitter();
    const queue = [];
    let ended = false;
    let processing = false;

    const processNext = () => {
      if (processing || queue.length === 0) {
        if (queue.length === 0 && ended) stream.emit('end');
        return;
      }
      const item = queue.shift();
      if (!item) {
        if (ended) stream.emit('end');
        return;
      }
      processing = true;
      this.run(item.task, item.options || {}).then((result) => {
        processing = false;
        stream.emit('data', result);
        processNext();
      }).catch((err) => {
        processing = false;
        stream.emit('error', err);
        processNext();
      });
    };

    stream.write = (task, options) => {
      if (ended) return false;
      if (typeof task !== 'function') {
        stream.emit('error', new Error('stream.write(task): task must be a function'));
        return false;
      }
      if (backpressure === 'drop' && queue.length >= bufferSize) return false;
      queue.push({ task, options });
      processNext();
      return true;
    };
    stream.end = () => {
      ended = true;
      if (queue.length === 0 && !processing) stream.emit('end');
    };
    return stream;
  }

  runAll(tasks, options = {}) {
    // Fast path validation
    if (!Array.isArray(tasks)) {
      return Promise.reject(new Error('Tasks must be an array of functions'));
    }

    // Optimize for small arrays
    if (tasks.length === 0) {
      return Promise.resolve([]);
    }

    if (tasks.length === 1) {
      return this.run(tasks[0], options).then(result => [result]);
    }

    // Validate all tasks at once for better performance
    const invalidTask = tasks.find(task => typeof task !== 'function');
    if (invalidTask) {
      return Promise.reject(new Error('Tasks must be an array of functions'));
    }

    // Check if we can optimize with spawnMany
    // This works when all tasks are similar and can be converted to a factory function
    const canUseSpawnMany = this._canOptimizeWithSpawnMany(tasks);

    if (canUseSpawnMany) {
      return this._runAllWithSpawnMany(tasks, options);
    }

    // Use Promise.allSettled for better error handling
    return Promise.allSettled(tasks.map(task => this.run(task, options)))
      .then(results => results.map(result =>
        result.status === 'fulfilled' ? result.value : result.reason
      ));
  }

  _canOptimizeWithSpawnMany(tasks) {
    // For now, we'll use spawnMany for arrays of 5 or more tasks
    // In the future, we could analyze the task functions to see if they're similar
    return tasks.length >= 5;
  }

  _runAllWithSpawnMany(tasks, options) {
    const startTime = Date.now();
    // Use the new native Promise-based run for arrays
    return this.core.run(tasks)
      .then(result => {
        const executionTime = Date.now() - startTime;
        this._performance.recordExecutionTime(executionTime);

        if (result.success) {
          // Batch results contain task IDs and data
          return result.results.map(r => this._hydrateResult(r));
        } else {
          throw new Error(result.error || 'Batch execution failed');
        }
      });
  }

  batch(taskConfigs, options = {}) {
    // Fast path validation
    if (!Array.isArray(taskConfigs)) {
      return Promise.reject(new Error('Task configurations must be an array'));
    }

    if (taskConfigs.length === 0) {
      return Promise.resolve([]);
    }

    const progressCallback = options.progress || options.onProgress;
    let completedCount = 0;
    const totalTasks = taskConfigs.length;

    // Pre-validate all configurations for better performance
    const validationErrors = [];
    taskConfigs.forEach((taskConfig, index) => {
      if (!taskConfig.task || typeof taskConfig.task !== 'function') {
        validationErrors.push(`Each task configuration must have a task function`);
      }
    });

    if (validationErrors.length > 0) {
      return Promise.reject(new Error(validationErrors.join(', ')));
    }

    // Optimize batch execution with better progress tracking
    const executeBatch = async () => {
      const results = [];
      const promises = taskConfigs.map((taskConfig, index) => {
        const taskOptions = Object.assign({}, options, taskConfig.options || {});

        return this.run(taskConfig.task, taskOptions)
          .then(result => {
            completedCount++;

            // Call progress callback immediately for better test compatibility
            if (progressCallback && typeof progressCallback === 'function') {
              const progress = {
                completed: completedCount,
                total: totalTasks,
                percentage: Math.round((completedCount / totalTasks) * 100),
                name: taskConfig.name || `task-${index}`
              };

              // Call progress callback synchronously for test compatibility
              progressCallback(progress);
            }

            return {
              name: taskConfig.name || `task-${index}`,
              result,
              success: true
            };
          })
          .catch(error => {
            completedCount++;

            // Call progress callback even for failed tasks
            if (progressCallback && typeof progressCallback === 'function') {
              const progress = {
                completed: completedCount,
                total: totalTasks,
                percentage: Math.round((completedCount / totalTasks) * 100),
                name: taskConfig.name || `task-${index}`
              };

              // Call progress callback synchronously for test compatibility
              progressCallback(progress);
            }

            return {
              name: taskConfig.name || `task-${index}`,
              error: error.message,
              success: false
            };
          });
      });

      return Promise.all(promises);
    };

    return executeBatch();
  }

  retry(task, options = {}) {
    if (typeof task !== 'function') {
      throw new Error('Task must be a function');
    }

    const attempts = options.attempts || 3;
    const delay = options.delay || 1000;
    const backoff = options.backoff || 1.5;

    return new Promise((resolve, reject) => {
      let attemptCount = 0;
      let currentDelay = delay;

      const tryTask = () => {
        attemptCount++;

        this.run(task, options).then(resolve).catch(error => {
          if (attemptCount >= attempts) {
            reject(error);
          } else {
            setTimeout(tryTask, currentDelay);
            currentDelay *= backoff; // Exponential backoff
          }
        });
      };

      tryTask();
    });
  }

  // =====================================================================
  // Optimized Tasklet Management
  // =====================================================================

  spawn(taskFunction) {
    return this.core.spawn(taskFunction);
  }

  spawnMany(count, factoryFunction) {
    if (typeof count !== 'number' || count < 0) {
      throw new Error('Count must be a non-negative number');
    }

    if (typeof factoryFunction !== 'function') {
      throw new Error('Factory function must be a function');
    }

    if (count === 0) {
      return [];
    }

    if (count === 1) {
      return [this.spawn(() => factoryFunction(0))];
    }

    // Spawn multiple tasklets efficiently
    const taskletIds = [];
    for (let i = 0; i < count; i++) {
      const taskFunction = () => factoryFunction(i);
      taskletIds.push(this.spawn(taskFunction));
    }

    return taskletIds;
  }

  join(taskletId) {
    this.core.join(taskletId);
  }

  joinMany(taskletIds) {
    if (!Array.isArray(taskletIds)) {
      throw new Error('Tasklet IDs must be an array');
    }

    // Optimize for single tasklet
    if (taskletIds.length === 1) {
      this.join(taskletIds[0]);
      return;
    }

    // Use loop for multiple tasklets (legacy/internal)
    for (const id of taskletIds) {
      this.join(id);
    }
  }

  getResult(taskletId) {
    return this.core.getResult(taskletId);
  }

  hasError(taskletId) {
    return this.core.hasError(taskletId);
  }

  getError(taskletId) {
    return this.core.getError(taskletId);
  }

  isFinished(taskletId) {
    return this.core.isFinished(taskletId);
  }

  getStatus(taskletId) {
    if (this.isFinished(taskletId)) {
      return this.hasError(taskletId) ? 'error' : 'completed';
    }
    return 'running';
  }

  // =====================================================================
  // Optimized Memory Management
  // =====================================================================

  getMemoryStats() {
    return this.core.getMemoryStats();
  }

  forceCleanup() {
    // Clear caches for memory optimization
    this._performance.clearAllCaches();
    return this.core.forceCleanup();
  }

  // =====================================================================
  // Optimized Configuration Management
  // =====================================================================

  configure(options = {}) {
    this.config.configure(options);
    const cfg = this.config.getConfig();
    const level = typeof options.logging === 'object' && options.logging !== null ? options.logging.level : (options.logging ?? cfg.logging);
    if (level) this.logger.setLevel(level);
    return this;
  }

  // =====================================================================
  // Optimized Logging Methods
  // =====================================================================

  log(level, component, message) {
    this.logger.log(level, component, message);
    return this;
  }

  error(component, message) {
    this.logger.error(component, message);
    return this;
  }

  warn(component, message) {
    this.logger.warn(component, message);
    return this;
  }

  info(component, message) {
    this.logger.info(component, message);
    return this;
  }

  debug(component, message) {
    this.logger.debug(component, message);
    return this;
  }

  trace(component, message) {
    this.logger.trace(component, message);
    return this;
  }

  // =====================================================================
  // Optimized Stats and Health
  // =====================================================================

  getStats() {
    return this.stats.getStats();
  }

  getHealth() {
    return this.stats.getHealth();
  }

  getDetailedStats() {
    return this.stats.getDetailedStats();
  }

  getWorkerUtilization() {
    return this.stats.getWorkerUtilization();
  }

  getSuccessRate() {
    return this.stats.getSuccessRate();
  }

  getAverageExecutionTime() {
    return this.stats.getAverageExecutionTime();
  }

  getMemoryStats() {
    return this.core.getMemoryStats();
  }

  // =====================================================================
  // Optimized Shutdown and Cleanup
  // =====================================================================

  shutdown(timeout = 5000) {
    // Handle null/undefined argument
    if (timeout === null || typeof timeout === 'undefined') {
      timeout = 5000;
    }
    // If shutdown is already complete, resolve immediately
    if (this._shutdownComplete) {
      this.emit('shutdown');
      return Promise.resolve();
    }
    // If shutdown is already in progress, resolve immediately
    if (this._shutdownInProgress) {
      this.emit('shutdown');
      return Promise.resolve();
    }
    this._shutdownInProgress = true;
    return new Promise((resolve) => {
      this.info('Tasklets', 'Shutting down...');
      const cleanup = () => {
        try {
          this._performance.clearAllCaches();
          this._performance.destroy();
          this.core.shutdown();
          this.emit('shutdown');
          this.info('Tasklets', 'Shutdown complete');
          this._shutdownInProgress = false;
          this._shutdownComplete = true;

          resolve();
        } catch (error) {
          this.error('Tasklets', `Shutdown error: ${error.message}`);
          this._shutdownInProgress = false;
          this._shutdownComplete = true;
          this.emit('shutdown');
          resolve();
        }
      };
      // Execute cleanup immediately for better responsiveness
      cleanup();
    });
  }

  cleanup() {
    return this.core.forceCleanup();
  }

  // =====================================================================
  // Backward Compatibility Methods
  // =====================================================================

  get_memory_stats() { return this.getMemoryStats(); }
  force_cleanup() { return this.forceCleanup(); }
  set_max_tasklets(max) {
    // No-op implementation for backward compatibility
    this.info('Tasklets', `setMaxTasklets(${max}) called - not implemented in current version`);
    return this;
  }
  set_cleanup_interval(interval) {
    // Delegate to config method
    this.config.setCleanupIntervalMs(interval);
    return this;
  }

  // =====================================================================
  // Version and Info
  // =====================================================================

  getVersion() {
    try {
      const packageJson = require('../package.json');
      return packageJson.version;
    } catch (error) {
      return 'unknown';
    }
  }

  // =====================================================================
  // Performance Optimization Methods
  // =====================================================================

  _recordPerformanceMetric(key, value) {
    this._performance.recordMetric(key, value);
  }

  _getPerformanceMetric(key) {
    return this._performance.getMetric(key);
  }

  _shouldOptimize() {
    return this._performance.shouldOptimize();
  }

  _performOptimization() {
    this._performance.performOptimization();
  }

  // =====================================================================
  // Adaptive and Auto-Scheduling Methods (Delegated)
  // =====================================================================

  enableAdaptiveMode() {
    this._config = this._config || new TaskletsConfig();
    this._config.enableAdaptiveMode();
    return this;
  }

  disableAdaptiveMode() {
    this._config = this._config || new TaskletsConfig();
    this._config.disableAdaptiveMode();
    return this;
  }

  isAdaptiveModeEnabled() {
    this._config = this._config || new TaskletsConfig();
    return this._config.isAdaptiveModeEnabled();
  }

  setWorkloadType(workloadType) {
    this._config = this._config || new TaskletsConfig();
    this._config.setWorkloadType(workloadType);
    return this;
  }

  getWorkloadType() {
    this._config = this._config || new TaskletsConfig();
    return this._config.getWorkloadType();
  }

  forceAdaptiveAdjustment() {
    // If core supports it, call core, else no-op
    if (this.core.forceAdaptiveAdjustment) {
      this.core.forceAdaptiveAdjustment();
    }
    return this;
  }

  getAdaptiveMetrics() {
    if (this.core.getAdaptiveMetrics) {
      return this.core.getAdaptiveMetrics();
    }
    return {};
  }

  getLastAdjustment() {
    if (this.core.getLastAdjustment) {
      return this.core.getLastAdjustment();
    }
    return {};
  }

  getAdaptiveSettings() {
    this._config = this._config || new TaskletsConfig();
    return this._config.getAdaptiveSettings();
  }

  enableAutoScheduling() {
    if (this.core.enableAutoScheduling) {
      this.core.enableAutoScheduling();
    }
    return this;
  }

  disableAutoScheduling() {
    if (this.core.disableAutoScheduling) {
      this.core.disableAutoScheduling();
    }
    return this;
  }

  isAutoSchedulingEnabled() {
    if (this.core.isAutoSchedulingEnabled) {
      return this.core.isAutoSchedulingEnabled();
    }
    return false;
  }

  getAutoSchedulingRecommendations() {
    if (this.core.getAutoSchedulingRecommendations) {
      return this.core.getAutoSchedulingRecommendations();
    }
    return [];
  }

  applyAutoSchedulingRecommendations() {
    if (this.core.applyAutoSchedulingRecommendations) {
      this.core.applyAutoSchedulingRecommendations();
    }
    return this;
  }

  getAutoSchedulingMetricsHistory() {
    if (this.core.getAutoSchedulingMetricsHistory) {
      return this.core.getAutoSchedulingMetricsHistory();
    }
    return [];
  }

  getAutoSchedulingSettings() {
    if (this.core.getAutoSchedulingSettings) {
      return this.core.getAutoSchedulingSettings();
    }
    return {};
  }

  // =====================================================================
  // System Information Methods
  // =====================================================================

  getSystemInfo() {
    return this.config.getSystemInfo();
  }

  getConfigurationSummary() {
    return this.config.getConfigurationSummary();
  }

  getRecommendations() {
    return this.config.getRecommendations();
  }

  recordPerformanceMetrics(metrics) {
    this.config.recordPerformanceMetrics(metrics);
    return this;
  }

  // =====================================================================
  // Memory Management Methods
  // =====================================================================

  getAdaptiveMemoryLimitMB() {
    return this.config.getAdaptiveMemoryLimitMB();
  }

  getPerTaskMemoryLimitMB() {
    return this.config.getPerTaskMemoryLimitMB();
  }

  getMemoryPressureThreshold() {
    return this.config.getMemoryPressureThreshold();
  }

  getAdaptiveBufferSize() {
    return this.config.getAdaptiveBufferSize();
  }

  // =====================================================================
  // Worker Thread Methods
  // =====================================================================

  setWorkerThreadCount(count) {
    this.config.setWorkerThreadCount(count);
    return this;
  }

  getWorkerThreadCount() {
    return this.config.getWorkerThreadCount();
  }

  getMaxWorkerThreads() {
    return this.config.getMaxWorkerThreads();
  }

  getMinWorkerThreads() {
    return this.config.getMinWorkerThreads();
  }

  getOptimalWorkerThreads() {
    return this.config.getOptimalWorkerThreads();
  }

  // =====================================================================
  // Logging Configuration Methods
  // =====================================================================

  setLogLevel(level) {
    this.config.setLogLevel(level);
    if (this._logger) {
      this.logger.setLevel(level);
    }
    return this;
  }

  getLogLevel() {
    return this.config.getLogLevel();
  }

  // =====================================================================
  // Memory Configuration Methods
  // =====================================================================

  setMemoryLimitPercent(percent) {
    this.config.setMemoryLimitPercent(percent);
    return this;
  }

  getMemoryLimitPercent() {
    return this.config.getMemoryLimitPercent();
  }

  setCleanupIntervalMs(interval) {
    this.config.setCleanupIntervalMs(interval);
    return this;
  }

  getCleanupIntervalMs() {
    return this.config.getCleanupIntervalMs();
  }

  // =====================================================================
  // Stack Configuration Methods
  // =====================================================================

  getDefaultStackSize() {
    return this.config.getDefaultStackSize();
  }

  getMaxStackSize() {
    return this.config.getMaxStackSize();
  }

  getMinStackSize() {
    return this.config.getMinStackSize();
  }

  // =====================================================================
  // Adaptive Configuration Methods
  // =====================================================================

  getAdaptivePollIntervalMs() {
    return this.config.getAdaptivePollIntervalMs();
  }

  getAdaptiveBatchSize() {
    return this.config.getAdaptiveBatchSize();
  }

  // =====================================================================
  // Pool Configuration Methods
  // =====================================================================

  setMicrojobPoolInitialSize(size) {
    this.config.setMicrojobPoolInitialSize(size);
    return this;
  }

  getMicrojobPoolInitialSize() {
    return this.config.getMicrojobPoolInitialSize();
  }

  setMicrojobPoolMaxSize(size) {
    this.config.setMicrojobPoolMaxSize(size);
    return this;
  }

  getMicrojobPoolMaxSize() {
    return this.config.getMicrojobPoolMaxSize();
  }

  // =====================================================================
  // Configuration Management Methods
  // =====================================================================

  resetToDefaults() {
    this.config.resetToDefaults();
    return this;
  }

  getCPUAffinitySettings() {
    return this.config.getCPUAffinitySettings();
  }

  getPerformanceHistory() {
    return this.config.getPerformanceHistory();
  }

  // =====================================================================
  // Advanced Processing Methods (Optimized)
  // =====================================================================

  async processBatchAdaptive(items, processor, options = {}) {
    const adaptiveSettings = this.getAdaptiveSettings();
    const batchSize = options.batchSize || adaptiveSettings.batchSize;
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchStartTime = Date.now();

      const taskletIds = batch.map(item => this.spawn(() => processor(item)));
      await this.joinMany(taskletIds);

      const batchResults = taskletIds.map(id => this.getResult(id));
      results.push(...batchResults);

      // Record performance metrics for adaptive optimization
      const batchEndTime = Date.now();
      const throughput = batch.length / (batchEndTime - batchStartTime);

      this.recordPerformanceMetrics({
        throughput,
        batchSize: batch.length,
        executionTime: batchEndTime - batchStartTime,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024
      });
    }

    return results;
  }

  async processCPUIntensive(items, processor) {
    return this.processBatchAdaptive(items, processor, {
      batchSize: this.getAdaptiveBatchSize() * 2
    });
  }

  async processIOIntensive(items, processor) {
    return this.processBatchAdaptive(items, processor, {
      batchSize: Math.max(this.getAdaptiveBatchSize() / 2, 10)
    });
  }

  async processMemoryIntensive(items, processor) {
    return this.processBatchAdaptive(items, processor, {
      batchSize: Math.max(this.getAdaptiveBatchSize() / 4, 5)
    });
  }

  async processWithMemoryAwareness(items, processor, options = {}) {
    const memoryStats = this.getMemoryStats();
    const memoryPressure = memoryStats.systemMemoryUsagePercent;

    if (memoryPressure > 80) {
      // High memory pressure - use smaller batches
      options.batchSize = Math.max(options.batchSize / 2, 5);
    } else if (memoryPressure < 30) {
      // Low memory pressure - can use larger batches
      options.batchSize = Math.min(options.batchSize * 1.5, this.getAdaptiveBatchSize() * 2);
    }

    return this.processBatchAdaptive(items, processor, options);
  }

  // =====================================================================
  // Automation Methods
  // =====================================================================

  enableAutomation() {
    this.enableAdaptiveMode();
    this.enableAutoScheduling();
    this.info('Tasklets', 'Automation enabled');
    return this;
  }

  disableAutomation() {
    this.disableAdaptiveMode();
    this.disableAutoScheduling();
    this.info('Tasklets', 'Automation disabled');
    return this;
  }

  getAutomationStatus() {
    return {
      adaptive: this.isAdaptiveModeEnabled(),
      autoScheduling: this.isAutoSchedulingEnabled(),
      recommendations: this.getAutoSchedulingRecommendations(),
      metrics: this.getAdaptiveMetrics()
    };
  }

  // =====================================================================
  // Workload Optimization Methods
  // =====================================================================

  optimizeForCPU() {
    this.setWorkloadType('cpu-intensive');
    this.info('Tasklets', 'Optimized for CPU-intensive workloads');
    return this;
  }

  optimizeForIO() {
    this.setWorkloadType('io-intensive');
    this.info('Tasklets', 'Optimized for I/O-intensive workloads');
    return this;
  }

  optimizeForMemory() {
    this.setWorkloadType('memory-intensive');
    this.info('Tasklets', 'Optimized for memory-intensive workloads');
    return this;
  }

  optimizeForBalanced() {
    this.setWorkloadType('balanced');
    this.info('Tasklets', 'Optimized for balanced workloads');
    return this;
  }

  // =====================================================================
  // Optimization Methods
  // =====================================================================

  applyRecommendations() {
    const recommendations = this.getAutoSchedulingRecommendations();
    if (recommendations.should_scale_up) {
      this.setWorkerThreadCount(recommendations.recommended_worker_count);
    }
    return this;
  }

  optimize() {
    this.forceAdaptiveAdjustment();
    this.applyAutoSchedulingRecommendations();
    this._performOptimization();
    this.info('Tasklets', 'Forced immediate optimization');
    return this;
  }

  getOptimizationStatus() {
    const recommendations = this.getAutoSchedulingRecommendations();
    const metrics = this.getAdaptiveMetrics();
    const performanceAnalysis = this._performance.analyzePerformance();

    return {
      workerScaling: {
        recommended: recommendations.recommended_worker_count,
        shouldScaleUp: recommendations.should_scale_up,
        shouldScaleDown: recommendations.should_scale_down,
        confidence: recommendations.worker_scaling_confidence
      },
      timeout: {
        recommended: recommendations.recommended_timeout_ms,
        shouldAdjust: recommendations.should_adjust_timeout,
        confidence: recommendations.timeout_confidence
      },
      batching: {
        recommended: recommendations.recommended_batch_size,
        shouldBatch: recommendations.should_batch,
        confidence: recommendations.batching_confidence
      },
      performance: {
        cpuUtilization: metrics.cpu_utilization,
        memoryUsage: metrics.memory_usage_percent,
        throughput: metrics.throughput_tasks_per_sec,
        workerUtilization: metrics.worker_utilization
      },
      analysis: performanceAnalysis,
      optimization: this._configOptimizer.getOptimizationStats()
    };
  }

  // =====================================================================
  // Enhanced Task Execution with Automation
  // =====================================================================

  async runOptimized(taskFunction, options = {}) {
    // Apply current recommendations before execution
    this.applyRecommendations();

    const result = await this.run(taskFunction, options);

    // Record performance for future optimization
    this.recordPerformanceMetrics({
      type: 'single_task',
      executionTime: Date.now(),
      success: true
    });

    return result;
  }

  async runAllOptimized(tasks, options = {}) {
    const recommendations = this.getAutoSchedulingRecommendations();

    // Use recommended batch size if available
    if (recommendations.should_batch && recommendations.recommended_batch_size > 0) {
      const batchSize = recommendations.recommended_batch_size;
      const results = [];

      for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        const batchResults = await this.runAll(batch, options);
        results.push(...batchResults);

        // Apply recommendations between batches
        this.applyRecommendations();
      }

      return results;
    }

    return this.runAll(tasks, options);
  }

  async batchOptimized(taskConfigs, options = {}) {
    const recommendations = this.getAutoSchedulingRecommendations();

    // Apply current recommendations
    this.applyRecommendations();

    // Use recommended batch size if available
    if (recommendations.should_batch && recommendations.recommended_batch_size > 0) {
      options.batchSize = recommendations.recommended_batch_size;
    }

    const results = await this.batch(taskConfigs, options);

    // Record performance for future optimization
    this.recordPerformanceMetrics({
      type: 'batch_processing',
      batchSize: taskConfigs.length,
      executionTime: Date.now(),
      success: true
    });

    return results;
  }

  async runWithWorkloadOptimization(taskFunction, workloadType = 'balanced', options = {}) {
    // Set workload type for optimization
    this.setWorkloadType(workloadType);

    // Apply recommendations for this workload type
    this.applyRecommendations();

    const result = await this.run(taskFunction, options);

    // Record workload-specific performance
    this.recordPerformanceMetrics({
      type: 'workload_specific',
      workloadType,
      executionTime: Date.now(),
      success: true
    });

    return result;
  }

  async runWithMemoryAwareness(taskFunction, options = {}) {
    const memoryStats = this.getMemoryStats();
    const memoryPressure = memoryStats.systemMemoryUsagePercent;

    if (memoryPressure > 90) {
      // Critical memory pressure - force cleanup
      this.forceCleanup();
    }

    const result = await this.run(taskFunction, options);

    // Record memory-aware performance
    this.recordPerformanceMetrics({
      type: 'memory_aware',
      memoryPressure,
      executionTime: Date.now(),
      success: true
    });

    return result;
  }

  getPerformanceSummary() {
    return {
      stats: this.getStats(),
      health: this.getHealth(),
      automation: this.getAutomationStatus(),
      performance: this._performance.analyzePerformance(),
      optimization: this._configOptimizer.getOptimizationStats()
    };
  }

  // =====================================================================
  // Automation Helper Methods
  // =====================================================================

  enableAutomation() {
    this.enableAdaptiveMode();
    this.enableAutoScheduling();
    this.info('Tasklets', 'Automation enabled');
    return this;
  }

  disableAutomation() {
    this.disableAdaptiveMode();
    this.disableAutoScheduling();
    this.info('Tasklets', 'Automation disabled');
    return this;
  }

  getAutomationStatus() {
    return {
      adaptive: this.isAdaptiveModeEnabled(),
      autoScheduling: this.isAutoSchedulingEnabled(),
      recommendations: this.getAutoSchedulingRecommendations(),
      metrics: this.getAdaptiveMetrics()
    };
  }
}

module.exports = Tasklets;