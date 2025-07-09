/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file stats.js
 * @brief Statistics and monitoring for tasklets
 */

const os = require('os');

/**
 * Statistics and monitoring system for tasklets
 */
class TaskletsStats {
  constructor(core, config) {
  this.core = core;
  this.config = config;
  }

  getStats() {
    const nativeStats = this.core.getStats();
    const memoryUsage = process.memoryUsage();
    const cpuCount = os.cpus().length;
    const workerCount = this.config.getWorkerThreadCount();
    
    // If workers is "auto", use actual CPU count
    const actualWorkers = workerCount === 'auto' ? cpuCount : workerCount;

    return {
      workers: actualWorkers,
      tasks: {
        completed: nativeStats.completed_threads || 0,
        active: 0, // Not available in current API, default to 0
        queued: 0, // Not available in current API, default to 0
        failed: nativeStats.failed_threads || 0,
        total: (nativeStats.completed_threads || 0) + (nativeStats.failed_threads || 0)
      },
      performance: {
        throughput: 0,
        averageExecutionTime: nativeStats.average_execution_time_ms || 0,
        totalExecutionTime: 0
      },
      system: {
        cpuCores: cpuCount,
        memoryUsage: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external
        },
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: process.uptime()
      },
      config: {
        workers: workerCount, // Keep original config value
        timeout: this.config.getConfig().timeout,
        logging: this.config.getLogLevel(),
        maxMemory: this.config.getConfig().maxMemory
      }
    };
  }

  getHealth() {
    const stats = this.getStats();
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const usedMemory = totalMemory - os.freemem();
    const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

    // Ensure workers.utilization is a valid number
    const workerCount = stats.workers || 1;
    const activeTasks = stats.tasks.active || 0;
    const utilization = workerCount > 0 ? (activeTasks / workerCount) : 0;

    return {
      status: 'healthy',
      workers: {
        count: workerCount,
        active: activeTasks,
        utilization: utilization
      },
      memory: {
        total: totalMemory,
        free: os.freemem(),
        used: usedMemory,
        percentage: memoryPercentage
      },
      tasks: {
        completed: stats.tasks.completed || 0,
        active: stats.tasks.active || 0,
        queued: stats.tasks.queued || 0,
        failed: stats.tasks.failed || 0,
        successRate: stats.tasks.total > 0 ? (stats.tasks.completed / stats.tasks.total) * 100 : 0
      },
      uptime: process.uptime()
    };
  }

  getDetailedStats() {
  const stats = this.getStats();
  const nativeStats = this.core.getStats();

  return {
  ...stats,
  detailed: {
  totalThreadsCreated: nativeStats.total_threads_created || 0,
  workerUtilization: this.getWorkerUtilization(),
  successRate: this.getSuccessRate(),
  averageExecutionTime: nativeStats.average_execution_time_ms || 0,
  totalExecutionTime: nativeStats.total_execution_time_ms || 0,
  memoryUsage: process.memoryUsage(),
  systemInfo: this.core.getSystemInfo()
  }
  };
  }

  getWorkerUtilization() {
  const stats = this.getStats();
  const activeWorkers = stats.tasks.active || 0;
  const totalWorkers = stats.workers || 1;
  return (activeWorkers / totalWorkers) * 100;
  }

  getSuccessRate() {
  const stats = this.getStats();
  const completed = stats.tasks.completed || 0;
  const failed = stats.tasks.failed || 0;
  const total = completed + failed;
  return total > 0 ? (completed / total) * 100 : 0;
  }

  getAverageExecutionTime() {
  const nativeStats = this.core.getStats();
  return nativeStats.average_execution_time_ms || 0;
  }
}

module.exports = TaskletsStats; 