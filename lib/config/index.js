/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file config.js
 * @brief Configuration management for tasklets
 */

const os = require('os');
const AdaptiveConfig = require('./adaptive');
const ConfigOptimizer = require('./optimizer');

/**
 * Configuration manager for tasklets
 */
class TaskletsConfig {
  constructor() {
    this.adaptive = new AdaptiveConfig();
    this.optimizer = new ConfigOptimizer();
    this.config = {
      workers: this.adaptive.getOptimalWorkerThreads(),
      timeout: 30000,
      logging: 'info',
      maxMemory: 'auto',
      memoryLimitPercent: this.adaptive.getAdaptiveMemoryLimitPercent(),
      cleanupInterval: 5000,
      microjobPoolInitialSize: this.adaptive.getAdaptiveMicrojobPoolInitialSize(),
      microjobPoolMaxSize: this.adaptive.getAdaptiveMicrojobPoolMaxSize(),
      adaptiveMode: true,
      workloadType: 'balanced'
    };
  }

  // =====================================================================
  // Basic Configuration
  // =====================================================================

  configure(options = {}) {
    if (options.workers !== undefined) {
      if (options.workers === 'auto') {
        this.config.workers = 'auto';
      } else if (typeof options.workers === 'string') {
        const parsed = parseInt(options.workers, 10);
        if (isNaN(parsed)) {
          throw new Error('Invalid worker count: must be a number or "auto"');
        }
        this.config.workers = parsed;
      } else {
        this.config.workers = options.workers;
      }
    }
    if (options.timeout !== undefined) this.config.timeout = options.timeout;
    if (options.logging) this.config.logging = options.logging;
    if (options.maxMemory) this.config.maxMemory = options.maxMemory;
    if (options.memoryLimitPercent) this.config.memoryLimitPercent = options.memoryLimitPercent;
    if (options.cleanupInterval) this.config.cleanupInterval = options.cleanupInterval;
    if (options.microjobPoolInitialSize) this.config.microjobPoolInitialSize = options.microjobPoolInitialSize;
    if (options.microjobPoolMaxSize) this.config.microjobPoolMaxSize = options.microjobPoolMaxSize;
    if (options.adaptiveMode !== undefined) this.config.adaptiveMode = options.adaptiveMode;
    if (options.workloadType) this.config.workloadType = options.workloadType;

    // Apply adaptive optimization if enabled
    if (this.config.adaptiveMode && options.workloadType) {
      this.applyAdaptiveOptimization(options.workloadType);
    }
  }

  getConfig() {
  return { ...this.config };
  }

  resetToDefaults() {
  this.adaptive.resetAdaptiveSettings();
  this.config = {
  workers: this.adaptive.getOptimalWorkerThreads(),
  timeout: 30000,
  logging: 'info',
  maxMemory: 'auto',
  memoryLimitPercent: this.adaptive.getAdaptiveMemoryLimitPercent(),
  cleanupInterval: 5000,
  microjobPoolInitialSize: this.adaptive.getAdaptiveMicrojobPoolInitialSize(),
  microjobPoolMaxSize: this.adaptive.getAdaptiveMicrojobPoolMaxSize(),
  adaptiveMode: true,
  workloadType: 'balanced'
  };
  }

  // =====================================================================
  // Adaptive Configuration
  // =====================================================================

  enableAdaptiveMode() {
  this.config.adaptiveMode = true;
  this.applyAdaptiveOptimization(this.config.workloadType);
  }

  disableAdaptiveMode() {
  this.config.adaptiveMode = false;
  }

  isAdaptiveModeEnabled() {
  return this.config.adaptiveMode;
  }

  setWorkloadType(workloadType) {
  const validTypes = ['cpu-intensive', 'io-intensive', 'memory-intensive', 'balanced'];
  if (!validTypes.includes(workloadType)) {
  throw new Error(`Invalid workload type. Must be one of: ${validTypes.join(', ')}`);
  }
  this.config.workloadType = workloadType;

  if (this.config.adaptiveMode) {
  this.applyAdaptiveOptimization(workloadType);
  }
  }

  getWorkloadType() {
  return this.config.workloadType;
  }

  applyAdaptiveOptimization(workloadType) {
    const optimizedSettings = this.optimizer.optimizeForWorkload(workloadType);

    this.config.workers = optimizedSettings.workerThreads;
    this.config.memoryLimitPercent = optimizedSettings.memoryLimitPercent;
    this.config.microjobPoolInitialSize = optimizedSettings.microjobPoolInitialSize;
    this.config.microjobPoolMaxSize = optimizedSettings.microjobPoolMaxSize;
    this.config.batchSize = optimizedSettings.batchSize;
    this.config.pollInterval = optimizedSettings.pollInterval;
    this.config.timeout = optimizedSettings.timeout;
    this.config.stackSize = optimizedSettings.stackSize;
  }

  recordPerformanceMetrics(metrics) {
  if (this.config.adaptiveMode) {
  this.adaptive.recordPerformanceMetrics(metrics);
  }
  }

  getAdaptiveSettings() {
  return this.adaptive.getAdaptiveSettings();
  }

  getSystemInfo() {
  return this.adaptive.getSystemInfo();
  }

  // =====================================================================
  // Worker Thread Configuration
  // =====================================================================

  setWorkerThreadCount(count) {
  if (typeof count !== 'number' || count < 1) {
  throw new Error('Worker thread count must be a positive number');
  }
  const maxWorkers = this.getMaxWorkerThreads();
  if (count > maxWorkers) {
  throw new Error(`Worker thread count cannot exceed ${maxWorkers}`);
  }
  this.config.workers = count;
  }

  getWorkerThreadCount() {
  return this.config.workers;
  }

  getMaxWorkerThreads() {
  return this.adaptive.getMaxWorkerThreads();
  }

  getMinWorkerThreads() {
  return this.adaptive.getMinWorkerThreads();
  }

  getOptimalWorkerThreads() {
  return this.adaptive.getOptimalWorkerThreads();
  }

  // =====================================================================
  // Logging Configuration
  // =====================================================================

  setLogLevel(level) {
  const validLevels = ['off', 'error', 'warn', 'info', 'debug', 'trace'];
  if (!validLevels.includes(level)) {
  throw new Error(`Invalid log level. Must be one of: ${validLevels.join(', ')}`);
  }
  this.config.logging = level;
  }

  getLogLevel() {
  return this.config.logging;
  }

  // =====================================================================
  // Memory Configuration
  // =====================================================================

  setMemoryLimitPercent(percent) {
  if (typeof percent !== 'number' || percent < 0 || percent > 100) {
  throw new Error('Memory limit percent must be between 0 and 100');
  }
  this.config.memoryLimitPercent = percent;
  }

  getMemoryLimitPercent() {
  return this.config.memoryLimitPercent;
  }

  getAdaptiveMemoryLimitMB() {
  return this.adaptive.getAdaptiveMemoryLimitMB();
  }

  getPerTaskMemoryLimitMB() {
  return this.adaptive.getPerTaskMemoryLimitMB();
  }

  getMemoryPressureThreshold() {
  return this.adaptive.getMemoryPressureThreshold();
  }

  setCleanupIntervalMs(interval) {
  if (typeof interval !== 'number' || interval < 0) {
  throw new Error('Cleanup interval must be a positive number');
  }
  this.config.cleanupInterval = interval;
  }

  getCleanupIntervalMs() {
  return this.config.cleanupInterval;
  }

  // =====================================================================
  // Stack Configuration
  // =====================================================================

  getDefaultStackSize() {
  return this.adaptive.getAdaptiveStackSize();
  }

  getMaxStackSize() {
  return this.adaptive.getAdaptiveMaxStackSize();
  }

  getMinStackSize() {
  return this.adaptive.getAdaptiveMinStackSize();
  }

  // =====================================================================
  // Performance Configuration
  // =====================================================================

  getAdaptivePollIntervalMs() {
  return this.adaptive.getAdaptivePollIntervalMs();
  }

  getAdaptiveBatchSize() {
  return this.adaptive.getAdaptiveBatchSize();
  }

  getAdaptiveBufferSize() {
  return this.adaptive.getAdaptiveBufferSize();
  }

  // =====================================================================
  // Memory Pool Configuration
  // =====================================================================

  setMicrojobPoolInitialSize(size) {
  if (typeof size !== 'number' || size < 0) {
  throw new Error('Pool initial size must be a positive number');
  }
  this.config.microjobPoolInitialSize = size;
  }

  getMicrojobPoolInitialSize() {
  return this.config.microjobPoolInitialSize;
  }

  setMicrojobPoolMaxSize(size) {
  if (typeof size !== 'number' || size < 0) {
  throw new Error('Pool max size must be a positive number');
  }
  this.config.microjobPoolMaxSize = size;
  }

  getMicrojobPoolMaxSize() {
  return this.config.microjobPoolMaxSize;
  }

  // =====================================================================
  // Advanced Adaptive Features
  // =====================================================================

  getCPUAffinitySettings() {
  return this.adaptive.getCPUAffinitySettings();
  }

  getPerformanceHistory() {
  return this.adaptive.getPerformanceHistory();
  }

  // =====================================================================
  // User-Friendly Configuration Methods
  // =====================================================================

  /**
  * Quick configuration for common use cases
  */
  quickConfig(type = 'auto') {
  switch (type) {
  case 'development':
  this.configure({
  workers: 2,
  timeout: 10000,
  logging: 'debug',
  adaptiveMode: true
  });
  break;
  case 'production':
  this.configure({
  workers: 'auto',
  timeout: 30000,
  logging: 'warn',
  adaptiveMode: true
  });
  break;
  case 'high-performance':
  this.configure({
  workers: this.adaptive.getMaxWorkerThreads(),
  timeout: 60000,
  logging: 'info',
  adaptiveMode: true
  });
  break;
  case 'memory-efficient':
  this.configure({
  workers: Math.max(1, this.adaptive.getOptimalWorkerThreads() / 2),
  timeout: 30000,
  logging: 'info',
  adaptiveMode: true,
  memoryLimitPercent: 50
  });
  break;
  case 'auto':
  default:
  this.configure({
  workers: this.adaptive.getOptimalWorkerThreads(),
  timeout: 30000,
  logging: 'info',
  adaptiveMode: true
  });
  break;
  }

  return this;
  }

  /**
  * Configure for specific workload types
  */
  configureForWorkload(workloadType) {
  const baseConfig = this.adaptive.optimizeForWorkload(workloadType);

  this.configure({
  workers: baseConfig.workerThreads,
  timeout: 30000,
  logging: 'info',
  adaptiveMode: true,
  workloadType: workloadType,
  memoryLimitPercent: baseConfig.memoryLimitPercent,
  cleanupInterval: 5000
  });

  return this;
  }

  /**
  * Get configuration summary for monitoring
  */
  getConfigurationSummary() {
  return {
  workers: this.config.workers,
  timeout: this.config.timeout,
  logging: this.config.logging,
  adaptiveMode: this.config.adaptiveMode,
  workloadType: this.config.workloadType,
  memoryLimitPercent: this.config.memoryLimitPercent,
  cleanupInterval: this.config.cleanupInterval,
  microjobPoolInitialSize: this.config.microjobPoolInitialSize,
  microjobPoolMaxSize: this.config.microjobPoolMaxSize
  };
  }

  /**
  * Get optimal configuration for current system
  */
  getOptimalConfiguration() {
  return {
  workers: this.adaptive.getOptimalWorkerThreads(),
  timeout: 30000,
  logging: 'info',
  adaptiveMode: true,
  workloadType: 'balanced',
  memoryLimitPercent: this.adaptive.getAdaptiveMemoryLimitPercent(),
  cleanupInterval: 5000,
  microjobPoolInitialSize: this.adaptive.getAdaptiveMicrojobPoolInitialSize(),
  microjobPoolMaxSize: this.adaptive.getAdaptiveMicrojobPoolMaxSize()
  };
  }

  /**
  * Apply optimal configuration automatically
  */
  applyOptimalConfiguration() {
  const optimal = this.getOptimalConfiguration();
  this.configure(optimal);
  return this;
  }

  /**
  * Get configuration recommendations based on system analysis
  */
  getConfigurationRecommendations() {
  const systemInfo = this.adaptive.systemInfo;
  const recommendations = [];

  // CPU recommendations
  if (systemInfo.cpu.count < 4) {
  recommendations.push({
  type: 'cpu',
  message: 'Low CPU cores detected. Consider using fewer worker threads.',
  suggested: Math.max(1, systemInfo.cpu.count - 1)
  });
  } else if (systemInfo.cpu.count > 16) {
  recommendations.push({
  type: 'cpu',
  message: 'High CPU cores detected. Consider using more worker threads.',
  suggested: Math.min(systemInfo.cpu.count, this.adaptive.getMaxWorkerThreads())
  });
  }

  // Memory recommendations
  const memoryGB = systemInfo.memory.total / (1024 * 1024 * 1024);
  if (memoryGB < 4) {
  recommendations.push({
  type: 'memory',
  message: 'Low memory detected. Consider reducing memory limits.',
  suggested: Math.min(50, this.config.memoryLimitPercent)
  });
  }

  return recommendations;
  }
}

module.exports = TaskletsConfig; 