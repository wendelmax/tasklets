/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file adaptive.js
 * @brief Adaptive configuration and optimization for tasklets
 */

const os = require('os');

/**
 * Adaptive configuration manager that automatically optimizes settings
 * based on system capabilities and current workload
 */
class AdaptiveConfig {
  constructor() {
  this.systemInfo = this.detectSystemCapabilities();
  this.performanceHistory = [];
  this.adaptiveSettings = this.calculateAdaptiveSettings();
  }

  // =====================================================================
  // System Detection
  // =====================================================================

  detectSystemCapabilities() {
  const cpuCount = os.cpus().length;
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const platform = os.platform();
  const arch = os.arch();

  // Get CPU model info for better optimization
  const cpuModel = os.cpus()[0]?.model || 'Unknown';
  const cpuSpeed = os.cpus()[0]?.speed || 0;

  return {
  cpu: {
  count: cpuCount,
  model: cpuModel,
  speed: cpuSpeed,
  cores: cpuCount
  },
  memory: {
  total: totalMemory,
  free: freeMemory,
  used: totalMemory - freeMemory,
  totalMB: Math.round(totalMemory / 1024 / 1024),
  freeMB: Math.round(freeMemory / 1024 / 1024),
  usedMB: Math.round((totalMemory - freeMemory) / 1024 / 1024)
  },
  platform,
  arch,
  isHighEnd: cpuCount >= 16 && totalMemory >= 16 * 1024 * 1024 * 1024, // 16GB+
  isMidRange: cpuCount >= 8 && totalMemory >= 8 * 1024 * 1024 * 1024,  // 8GB+
  isLowEnd: cpuCount < 4 || totalMemory < 4 * 1024 * 1024 * 1024  // <4GB
  };
  }

  // =====================================================================
  // Adaptive CPU Configuration
  // =====================================================================

  getOptimalWorkerThreads() {
  const { cpu } = this.systemInfo;

  // Base calculation: 1 thread per CPU core
  let optimalThreads = cpu.count;

  // Adjust based on system capabilities
  if (this.systemInfo.isHighEnd) {
  optimalThreads = Math.min(cpu.count * 4, 512); // Up to 4x for I/O bound tasks
  } else if (this.systemInfo.isMidRange) {
  optimalThreads = Math.min(cpu.count * 2, 128); // Up to 2x for balanced workloads
  } else {
  optimalThreads = Math.max(cpu.count, 2); // At least 2 threads
  }

  return Math.max(1, Math.min(optimalThreads, this.getMaxWorkerThreads()));
  }

  getMaxWorkerThreads() {
  const { cpu } = this.systemInfo;
  return Math.min(cpu.count * 4, 512);
  }

  getMinWorkerThreads() {
  return 1;
  }

  getCPUAffinitySettings() {
  const { cpu } = this.systemInfo;

  // Return CPU affinity configuration
  return {
  enabled: cpu.count > 1,
  strategy: this.systemInfo.isHighEnd ? 'performance' : 'balanced',
  cores: Array.from({ length: cpu.count }, (_, i) => i)
  };
  }

  // =====================================================================
  // Adaptive Memory Configuration
  // =====================================================================

  getAdaptiveMemoryLimitMB() {
  const { memory } = this.systemInfo;

  // Calculate memory limit based on available RAM
  if (memory.totalMB >= 32768) return 8192;  // 8GB for 32GB+ systems
  if (memory.totalMB >= 16384) return 4096;  // 4GB for 16GB+ systems
  if (memory.totalMB >= 8192) return 2048;  // 2GB for 8GB+ systems
  if (memory.totalMB >= 4096) return 1024;  // 1GB for 4GB+ systems
  return 512;  // 512MB for <4GB systems
  }

  getAdaptiveMemoryLimitPercent() {
  const { memory } = this.systemInfo;

  // Conservative memory usage based on system capabilities
  if (this.systemInfo.isHighEnd) return 80;  // 80% for high-end systems
  if (this.systemInfo.isMidRange) return 70; // 70% for mid-range systems
  return 60;  // 60% for low-end systems
  }

  getPerTaskMemoryLimitMB() {
  const totalLimit = this.getAdaptiveMemoryLimitMB();
  const { cpu } = this.systemInfo;
  return Math.max(16, totalLimit / cpu.count);
  }

  getMemoryPressureThreshold() {
  // Return memory pressure thresholds for adaptive behavior
  return {
  warning: this.getAdaptiveMemoryLimitPercent() * 0.8,  // 80% of limit
  critical: this.getAdaptiveMemoryLimitPercent() * 0.95, // 95% of limit
  emergency: this.getAdaptiveMemoryLimitPercent() * 0.98  // 98% of limit
  };
  }

  // =====================================================================
  // Adaptive Performance Configuration
  // =====================================================================

  getAdaptivePollIntervalMs() {
  const { cpu } = this.systemInfo;

  // Polling interval based on system capabilities
  if (cpu.count >= 16) return 1;  // 1ms for high-end systems
  if (cpu.count >= 8) return 2;  // 2ms for mid-range systems
  if (cpu.count >= 4) return 3;  // 3ms for standard systems
  return 5;  // 5ms for low-end systems
  }

  getAdaptiveBatchSize() {
  const { cpu } = this.systemInfo;
  return Math.max(100, cpu.count * 125);
  }

  getAdaptiveBufferSize() {
  const maxThreads = this.getMaxWorkerThreads();

  // Calculate buffer size for thread count strings
  if (maxThreads >= 1000) return 8;  // 4 digits + padding
  if (maxThreads >= 100) return 6;  // 3 digits + padding
  if (maxThreads >= 10) return 4;  // 2 digits + padding
  return 3;  // 1 digit + padding
  }

  // =====================================================================
  // Adaptive Stack Configuration
  // =====================================================================

  getAdaptiveStackSize() {
  const { cpu } = this.systemInfo;

  if (cpu.count >= 16) return 128 * 1024; // 128KB for high-core systems
  if (cpu.count >= 8) return 96 * 1024;  // 96KB for mid-range systems
  return 64 * 1024;  // 64KB for lower-end systems
  }

  getAdaptiveMaxStackSize() {
  const { cpu } = this.systemInfo;

  if (cpu.count >= 16) return 2 * 1024 * 1024; // 2MB for high-end
  if (cpu.count >= 8) return 1536 * 1024;  // 1.5MB for mid-range
  return 1024 * 1024;  // 1MB for standard
  }

  getAdaptiveMinStackSize() {
  return 8 * 1024; // 8KB minimum
  }

  // =====================================================================
  // Adaptive Pool Configuration
  // =====================================================================

  getAdaptiveMicrojobPoolInitialSize() {
  const { cpu } = this.systemInfo;
  return Math.max(50, cpu.count * 25);
  }

  getAdaptiveMicrojobPoolMaxSize() {
  const { cpu } = this.systemInfo;
  return Math.max(500, cpu.count * 250);
  }

  // =====================================================================
  // Performance Monitoring and Adaptation
  // =====================================================================

  recordPerformanceMetrics(metrics) {
  this.performanceHistory.push({
  timestamp: Date.now(),
  ...metrics
  });

  // Keep only last 100 measurements
  if (this.performanceHistory.length > 100) {
  this.performanceHistory = this.performanceHistory.slice(-100);
  }

  // Recalculate adaptive settings if needed
  this.adaptToPerformance();
  }

  adaptToPerformance() {
  if (this.performanceHistory.length < 10) return;

  const recent = this.performanceHistory.slice(-10);
  const avgThroughput = recent.reduce((sum, m) => sum + (m.throughput || 0), 0) / recent.length;
  const avgMemoryUsage = recent.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / recent.length;

  // Adjust batch size based on throughput
  if (avgThroughput > 1000) {
  this.adaptiveSettings.batchSize = Math.min(
  this.adaptiveSettings.batchSize * 1.2,
  this.getAdaptiveBatchSize() * 2
  );
  } else if (avgThroughput < 100) {
  this.adaptiveSettings.batchSize = Math.max(
  this.adaptiveSettings.batchSize * 0.8,
  this.getAdaptiveBatchSize() * 0.5
  );
  }

  // Adjust memory limits based on usage
  if (avgMemoryUsage > 90) {
  this.adaptiveSettings.memoryLimitPercent = Math.max(
  this.adaptiveSettings.memoryLimitPercent * 0.9,
  50
  );
  } else if (avgMemoryUsage < 30) {
  this.adaptiveSettings.memoryLimitPercent = Math.min(
  this.adaptiveSettings.memoryLimitPercent * 1.1,
  this.getAdaptiveMemoryLimitPercent()
  );
  }
  }

  // =====================================================================
  // Configuration Generation
  // =====================================================================

  calculateAdaptiveSettings() {
  return {
  // CPU Configuration
  workerThreads: this.getOptimalWorkerThreads(),
  maxWorkerThreads: this.getMaxWorkerThreads(),
  minWorkerThreads: this.getMinWorkerThreads(),
  cpuAffinity: this.getCPUAffinitySettings(),

  // Memory Configuration
  memoryLimitMB: this.getAdaptiveMemoryLimitMB(),
  memoryLimitPercent: this.getAdaptiveMemoryLimitPercent(),
  perTaskMemoryLimitMB: this.getPerTaskMemoryLimitMB(),
  memoryPressureThreshold: this.getMemoryPressureThreshold(),

  // Performance Configuration
  pollIntervalMs: this.getAdaptivePollIntervalMs(),
  batchSize: this.getAdaptiveBatchSize(),
  bufferSize: this.getAdaptiveBufferSize(),

  // Stack Configuration
  stackSize: this.getAdaptiveStackSize(),
  maxStackSize: this.getAdaptiveMaxStackSize(),
  minStackSize: this.getAdaptiveMinStackSize(),

  // Pool Configuration
  microjobPoolInitialSize: this.getAdaptiveMicrojobPoolInitialSize(),
  microjobPoolMaxSize: this.getAdaptiveMicrojobPoolMaxSize(),

  // System Information
  systemInfo: this.systemInfo
  };
  }

  getAdaptiveSettings() {
  return { ...this.adaptiveSettings };
  }

  // =====================================================================
  // Utility Methods
  // =====================================================================

  getSystemInfo() {
  return { ...this.systemInfo };
  }

  getPerformanceHistory() {
  return [...this.performanceHistory];
  }

  resetAdaptiveSettings() {
  this.performanceHistory = [];
  this.adaptiveSettings = this.calculateAdaptiveSettings();
  }

  // =====================================================================
  // Workload-Specific Optimization
  // =====================================================================

  optimizeForWorkload(workloadType) {
  const baseSettings = this.calculateAdaptiveSettings();

  switch (workloadType) {
  case 'cpu-intensive':
  return {
  ...baseSettings,
  workerThreads: Math.min(baseSettings.workerThreads, this.systemInfo.cpu.count),
  batchSize: Math.max(baseSettings.batchSize, 200),
  pollIntervalMs: Math.max(baseSettings.pollIntervalMs, 5)
  };

  case 'io-intensive':
  return {
  ...baseSettings,
  workerThreads: Math.min(baseSettings.workerThreads * 2, this.getMaxWorkerThreads()),
  batchSize: Math.min(baseSettings.batchSize, 50),
  pollIntervalMs: Math.min(baseSettings.pollIntervalMs, 1)
  };

  case 'memory-intensive':
  return {
  ...baseSettings,
  memoryLimitPercent: Math.min(baseSettings.memoryLimitPercent, 60),
  batchSize: Math.min(baseSettings.batchSize, 25),
  workerThreads: Math.min(baseSettings.workerThreads, this.systemInfo.cpu.count)
  };

  case 'balanced':
  default:
  return baseSettings;
  }
  }
}

module.exports = AdaptiveConfig; 