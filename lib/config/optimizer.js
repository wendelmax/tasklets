/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file config-optimizer.js
 * @brief Configuration optimization and workload-specific tuning
 */

const os = require('os');

/**
 * Configuration optimizer for workload-specific tuning
 */
class ConfigOptimizer {
  constructor() {
    this.systemInfo = this._getSystemInfo();
    this.workloadProfiles = this._createWorkloadProfiles();
    this.optimizationHistory = [];
    this.lastOptimization = null;
  }

  // =====================================================================
  // System Information
  // =====================================================================

  _getSystemInfo() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    return {
      cpu: {
        count: cpus.length,
        model: cpus[0].model,
        speed: cpus[0].speed,
        architecture: os.arch()
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        usagePercent: ((totalMem - freeMem) / totalMem) * 100
      },
      platform: os.platform(),
      nodeVersion: process.version,
      isHighEnd: this._isHighEndSystem(cpus, totalMem),
      isMidRange: this._isMidRangeSystem(cpus, totalMem)
    };
  }

  _isHighEndSystem(cpus, totalMem) {
    return cpus.length >= 8 && totalMem >= 16 * 1024 * 1024 * 1024; // 8+ cores, 16GB+ RAM
  }

  _isMidRangeSystem(cpus, totalMem) {
    return cpus.length >= 4 && totalMem >= 8 * 1024 * 1024 * 1024; // 4+ cores, 8GB+ RAM
  }

  // =====================================================================
  // Workload Profiles
  // =====================================================================

  _createWorkloadProfiles() {
    return {
      'cpu-intensive': {
        workerThreads: Math.min(this.systemInfo.cpu.count * 2, 32),
        batchSize: 200,
        pollInterval: 5,
        memoryLimitPercent: 70,
        microjobPoolInitial: 50,
        microjobPoolMax: 200,
        timeout: 60000,
        stackSize: 1024 * 1024, // 1MB
        minTaskDuration: 15,
        heuristicMinSamples: 8
      },
      'io-intensive': {
        workerThreads: Math.min(this.systemInfo.cpu.count * 4, 64),
        batchSize: 50,
        pollInterval: 1,
        memoryLimitPercent: 60,
        microjobPoolInitial: 100,
        microjobPoolMax: 500,
        timeout: 30000,
        stackSize: 512 * 1024, // 512KB
        minTaskDuration: 50, // Higher threshold for IO as overhead matters more
        heuristicMinSamples: 5
      },
      'memory-intensive': {
        workerThreads: Math.min(this.systemInfo.cpu.count, 16),
        batchSize: 25,
        pollInterval: 10,
        memoryLimitPercent: 50,
        microjobPoolInitial: 25,
        microjobPoolMax: 100,
        timeout: 120000,
        stackSize: 2048 * 1024, // 2MB
        minTaskDuration: 5,
        heuristicMinSamples: 10
      },
      'balanced': {
        workerThreads: Math.min(this.systemInfo.cpu.count * 1.5, 24),
        batchSize: 100,
        pollInterval: 5,
        memoryLimitPercent: 65,
        microjobPoolInitial: 75,
        microjobPoolMax: 300,
        timeout: 45000,
        stackSize: 1024 * 1024, // 1MB
        minTaskDuration: 10,
        heuristicMinSamples: 5
      }
    };
  }

  // =====================================================================
  // Workload Detection
  // =====================================================================

  detectWorkloadType(metrics) {
    if (!metrics || Object.keys(metrics).length === 0) {
      return 'balanced';
    }

    const { cpu_utilization, memory_usage_percent, throughput_tasks_per_sec, avg_execution_time_ms } = metrics;

    // CPU-intensive detection
    if (cpu_utilization > 80 && avg_execution_time_ms > 100) {
      return 'cpu-intensive';
    }

    // I/O-intensive detection
    if (cpu_utilization < 50 && avg_execution_time_ms < 50 && throughput_tasks_per_sec > 500) {
      return 'io-intensive';
    }

    // Memory-intensive detection
    if (memory_usage_percent > 70 && avg_execution_time_ms > 200) {
      return 'memory-intensive';
    }

    return 'balanced';
  }

  // =====================================================================
  // Configuration Optimization
  // =====================================================================

  optimizeForWorkload(workloadType, currentMetrics = null) {
    const baseProfile = this.workloadProfiles[workloadType] || this.workloadProfiles.balanced;
    const optimizedConfig = { ...baseProfile };

    // Apply system-specific adjustments
    this._applySystemAdjustments(optimizedConfig);

    // Apply metric-based adjustments if available
    if (currentMetrics) {
      this._applyMetricAdjustments(optimizedConfig, currentMetrics);
    }

    // Apply adaptive adjustments based on history
    this._applyAdaptiveAdjustments(optimizedConfig);

    // Record optimization
    this._recordOptimization(workloadType, optimizedConfig, currentMetrics);

    return optimizedConfig;
  }

  _applySystemAdjustments(config) {
    // Adjust for high-end systems
    if (this.systemInfo.isHighEnd) {
      config.workerThreads = Math.min(config.workerThreads * 1.5, 128);
      config.batchSize = Math.min(config.batchSize * 1.2, 500);
      config.microjobPoolMax = Math.min(config.microjobPoolMax * 1.5, 1000);
    }

    // Adjust for low-end systems
    if (!this.systemInfo.isHighEnd && !this.systemInfo.isMidRange) {
      config.workerThreads = Math.max(config.workerThreads * 0.7, 2);
      config.batchSize = Math.max(config.batchSize * 0.8, 10);
      config.microjobPoolMax = Math.max(config.microjobPoolMax * 0.7, 50);
    }

    // Adjust for memory constraints
    if (this.systemInfo.memory.usagePercent > 80) {
      config.memoryLimitPercent = Math.max(config.memoryLimitPercent * 0.8, 40);
      config.batchSize = Math.max(config.batchSize * 0.7, 10);
    }
  }

  _applyMetricAdjustments(config, metrics) {
    const { cpu_utilization, memory_usage_percent, throughput_tasks_per_sec } = metrics;

    // CPU utilization adjustments
    if (cpu_utilization > 90) {
      config.workerThreads = Math.max(config.workerThreads * 0.8, 2);
      config.batchSize = Math.max(config.batchSize * 0.8, 10);
    } else if (cpu_utilization < 30) {
      config.workerThreads = Math.min(config.workerThreads * 1.2, 128);
      config.batchSize = Math.min(config.batchSize * 1.2, 500);
    }

    // Memory usage adjustments
    if (memory_usage_percent > 85) {
      config.memoryLimitPercent = Math.max(config.memoryLimitPercent * 0.7, 30);
      config.batchSize = Math.max(config.batchSize * 0.6, 5);
    } else if (memory_usage_percent < 20) {
      config.memoryLimitPercent = Math.min(config.memoryLimitPercent * 1.1, 80);
      config.batchSize = Math.min(config.batchSize * 1.3, 300);
    }

    // Throughput adjustments
    if (throughput_tasks_per_sec > 1000) {
      config.pollInterval = Math.max(config.pollInterval * 0.8, 1);
      config.batchSize = Math.min(config.batchSize * 1.1, 400);
    } else if (throughput_tasks_per_sec < 50) {
      config.pollInterval = Math.min(config.pollInterval * 1.2, 20);
      config.batchSize = Math.max(config.batchSize * 0.9, 20);
    }
  }

  _applyAdaptiveAdjustments(config) {
    if (this.optimizationHistory.length === 0) return;

    const recentOptimizations = this.optimizationHistory.slice(-5);
    const avgWorkerThreads = recentOptimizations.reduce((sum, opt) => sum + opt.config.workerThreads, 0) / recentOptimizations.length;
    const avgBatchSize = recentOptimizations.reduce((sum, opt) => sum + opt.config.batchSize, 0) / recentOptimizations.length;

    // Apply trend-based adjustments
    if (avgWorkerThreads > config.workerThreads * 1.1) {
      config.workerThreads = Math.min(config.workerThreads * 1.1, 128);
    } else if (avgWorkerThreads < config.workerThreads * 0.9) {
      config.workerThreads = Math.max(config.workerThreads * 0.9, 2);
    }

    if (avgBatchSize > config.batchSize * 1.1) {
      config.batchSize = Math.min(config.batchSize * 1.1, 500);
    } else if (avgBatchSize < config.batchSize * 0.9) {
      config.batchSize = Math.max(config.batchSize * 0.9, 10);
    }
  }

  // =====================================================================
  // Performance Monitoring
  // =====================================================================

  _recordOptimization(workloadType, config, metrics) {
    const optimization = {
      workloadType,
      config: { ...config },
      metrics: metrics ? { ...metrics } : null,
      timestamp: Date.now(),
      systemInfo: {
        cpuCount: this.systemInfo.cpu.count,
        memoryUsage: this.systemInfo.memory.usagePercent
      }
    };

    this.optimizationHistory.push(optimization);
    this.lastOptimization = optimization;

    // Keep only last 20 optimizations
    if (this.optimizationHistory.length > 20) {
      this.optimizationHistory.shift();
    }
  }

  // =====================================================================
  // Configuration Analysis
  // =====================================================================

  analyzeConfiguration(config) {
    const analysis = {
      workerThreads: this._analyzeWorkerThreads(config.workerThreads),
      batchSize: this._analyzeBatchSize(config.batchSize),
      memoryLimit: this._analyzeMemoryLimit(config.memoryLimitPercent),
      timeout: this._analyzeTimeout(config.timeout),
      recommendations: []
    };

    // Generate recommendations
    if (analysis.workerThreads.status === 'suboptimal') {
      analysis.recommendations.push(analysis.workerThreads.recommendation);
    }

    if (analysis.batchSize.status === 'suboptimal') {
      analysis.recommendations.push(analysis.batchSize.recommendation);
    }

    if (analysis.memoryLimit.status === 'suboptimal') {
      analysis.recommendations.push(analysis.memoryLimit.recommendation);
    }

    if (analysis.timeout.status === 'suboptimal') {
      analysis.recommendations.push(analysis.timeout.recommendation);
    }

    return analysis;
  }

  _analyzeWorkerThreads(count) {
    const optimal = this.systemInfo.cpu.count * 1.5;
    const diff = Math.abs(count - optimal) / optimal;

    if (diff < 0.1) {
      return { status: 'optimal', recommendation: null };
    }

    if (count < optimal) {
      return {
        status: 'suboptimal',
        recommendation: `Consider increasing worker threads from ${count} to ${Math.round(optimal)} for better CPU utilization`
      };
    } else {
      return {
        status: 'suboptimal',
        recommendation: `Consider decreasing worker threads from ${count} to ${Math.round(optimal)} to reduce overhead`
      };
    }
  }

  _analyzeBatchSize(size) {
    const optimal = this.systemInfo.cpu.count * 15;
    const diff = Math.abs(size - optimal) / optimal;

    if (diff < 0.2) {
      return { status: 'optimal', recommendation: null };
    }

    if (size < optimal) {
      return {
        status: 'suboptimal',
        recommendation: `Consider increasing batch size from ${size} to ${Math.round(optimal)} for better throughput`
      };
    } else {
      return {
        status: 'suboptimal',
        recommendation: `Consider decreasing batch size from ${size} to ${Math.round(optimal)} to reduce memory pressure`
      };
    }
  }

  _analyzeMemoryLimit(percent) {
    if (percent >= 40 && percent <= 80) {
      return { status: 'optimal', recommendation: null };
    }

    if (percent < 40) {
      return {
        status: 'suboptimal',
        recommendation: `Consider increasing memory limit from ${percent}% to 60-70% for better performance`
      };
    } else {
      return {
        status: 'suboptimal',
        recommendation: `Consider decreasing memory limit from ${percent}% to 60-70% to prevent memory pressure`
      };
    }
  }

  _analyzeTimeout(timeout) {
    if (timeout >= 10000 && timeout <= 120000) {
      return { status: 'optimal', recommendation: null };
    }

    if (timeout < 10000) {
      return {
        status: 'suboptimal',
        recommendation: `Consider increasing timeout from ${timeout}ms to 30000-60000ms for complex tasks`
      };
    } else {
      return {
        status: 'suboptimal',
        recommendation: `Consider decreasing timeout from ${timeout}ms to 30000-60000ms to prevent hanging tasks`
      };
    }
  }

  // =====================================================================
  // Statistics and Reporting
  // =====================================================================

  getOptimizationStats() {
    return {
      totalOptimizations: this.optimizationHistory.length,
      lastOptimization: this.lastOptimization,
      workloadDistribution: this._getWorkloadDistribution(),
      averageConfigValues: this._getAverageConfigValues(),
      systemInfo: this.systemInfo
    };
  }

  _getWorkloadDistribution() {
    const distribution = {};
    this.optimizationHistory.forEach(opt => {
      distribution[opt.workloadType] = (distribution[opt.workloadType] || 0) + 1;
    });
    return distribution;
  }

  _getAverageConfigValues() {
    if (this.optimizationHistory.length === 0) return {};

    const recent = this.optimizationHistory.slice(-10);
    const avg = {};

    ['workerThreads', 'batchSize', 'memoryLimitPercent', 'timeout'].forEach(key => {
      avg[key] = recent.reduce((sum, opt) => sum + opt.config[key], 0) / recent.length;
    });

    return avg;
  }

  // =====================================================================
  // Utility Methods
  // =====================================================================

  getSystemInfo() {
    return { ...this.systemInfo };
  }

  getWorkloadProfiles() {
    return { ...this.workloadProfiles };
  }

  resetOptimizationHistory() {
    this.optimizationHistory = [];
    this.lastOptimization = null;
  }
}

module.exports = ConfigOptimizer; 