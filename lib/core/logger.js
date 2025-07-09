/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file logger.js
 * @brief Logging system for tasklets
 */

/**
 * Logging system for tasklets
 */
class TaskletsLogger {
  constructor() {
  this.currentLevel = 'info';
  this.levels = {
  off: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5
  };
  }

  setLevel(level) {
  const validLevels = Object.keys(this.levels);
  if (!validLevels.includes(level)) {
  throw new Error(`Invalid log level. Must be one of: ${validLevels.join(', ')}`);
  }
  this.currentLevel = level;
  }

  getLevel() {
  return this.currentLevel;
  }

  isEnabled(level) {
  return this.levels[level] <= this.levels[this.currentLevel];
  }

  log(level, component, message) {
  if (!this.isEnabled(level)) return;

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [Tasklets:${component}] ${message}`;

  if (level === 'error') {
  console.error(logMessage);
  } else if (level === 'warn') {
  console.warn(logMessage);
  } else {
  console.log(logMessage);
  }
  }

  error(component, message) {
  this.log('error', component, message);
  }

  warn(component, message) {
  this.log('warn', component, message);
  }

  info(component, message) {
  this.log('info', component, message);
  }

  debug(component, message) {
  this.log('debug', component, message);
  }

  trace(component, message) {
  this.log('trace', component, message);
  }

  // =====================================================================
  // User-Friendly Logging Methods
  // =====================================================================

  /**
  * Log automation events in a user-friendly way
  */
  automation(event, details = {}) {
  const messages = {
  'optimization_started': ' Starting automatic optimization...',
  'optimization_completed': ' Optimization completed successfully',
  'worker_scaled_up': ` Scaled up to ${details.workers || 'optimal'} worker threads`,
  'worker_scaled_down': ` Scaled down to ${details.workers || 'optimal'} worker threads`,
  'memory_pressure': ` Memory pressure detected (${details.usage || 'high'}%)`,
  'performance_improved': ` Performance improved by ${details.improvement || 'significant'}%`,
  'workload_detected': `🔍 Detected ${details.type || 'workload'} pattern`,
  'recommendation_applied': ' Applied optimization recommendations',
  'system_analyzed': '🔬 System analysis completed'
  };

  const message = messages[event] || `Automation: ${event}`;
  this.info('Automation', message, details);
  }

  /**
  * Log performance metrics in a user-friendly way
  */
  performance(metric, value, unit = '') {
  const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
  this.info('Performance', `${metric}: ${formattedValue}${unit}`);
  }

  /**
  * Log system health in a user-friendly way
  */
  health(status, details = {}) {
  const statusEmojis = {
  'healthy': '🟢',
  'warning': '🟡',
  'critical': '🔴',
  'degraded': '🟠'
  };

  const emoji = statusEmojis[status] || '⚪';
  this.info('Health', `${emoji} System health: ${status}`, details);
  }

  /**
  * Log configuration changes in a user-friendly way
  */
  configChange(setting, oldValue, newValue) {
  this.info('Configuration', ` ${setting}: ${oldValue} → ${newValue}`);
  }

  /**
  * Log workload optimization in a user-friendly way
  */
  workloadOptimization(type, details = {}) {
  const typeEmojis = {
  'cpu-intensive': '',
  'io-intensive': '💾',
  'memory-intensive': '',
  'balanced': '⚖️'
  };

  const emoji = typeEmojis[type] || '';
  this.info('Workload', `${emoji} Optimized for ${type} workloads`, details);
  }

  /**
  * Log task execution in a user-friendly way
  */
  taskExecution(type, details = {}) {
  const typeEmojis = {
  'single': '',
  'batch': '',
  'parallel': '',
  'optimized': ''
  };

  const emoji = typeEmojis[type] || '';
  this.info('Task', `${emoji} Executing ${type} task`, details);
  }

  /**
  * Log system recommendations in a user-friendly way
  */
  recommendation(type, message, confidence = 0) {
  const confidenceEmoji = confidence > 0.8 ? '' : confidence > 0.5 ? '' : '💭';
  this.info('Recommendation', `${confidenceEmoji} ${type}: ${message} (confidence: ${(confidence * 100).toFixed(0)}%)`);
  }
}

module.exports = TaskletsLogger; 