/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 * 
 * @file index.js
 * @brief Modern tasklets library entry point
 */

/**
 * Modern Tasklets API - High-performance lightweight cooperative tasklets for Node.js
 * 
 * Main entry point for the modern API
 */

// Import the modern tasklets API
const tasklets = require('./tasklets');

// Export everything from tasklets
module.exports = {
  // Default export (tasklets API)
  ...tasklets,

  // For destructuring support
  default: tasklets,

  // Convenience methods for quick access
  run: tasklets.run,
  runAll: tasklets.runAll,
  batch: tasklets.batch,
  retry: tasklets.retry,
  config: tasklets.config,
  getStats: tasklets.getStats,
  getHealth: tasklets.getHealth,
  shutdown: tasklets.shutdown
};

// Default export for ES modules compatibility
module.exports.default = module.exports; 