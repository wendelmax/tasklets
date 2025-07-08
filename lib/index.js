/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file index.js
 * @brief Main entry point for tasklets library
 */

const Tasklets = require('./tasklets');
const AdaptiveConfig = require('./adaptive');

// Create singleton instance
const tasklets = new Tasklets();

// Export the main instance
module.exports = tasklets;

// Export classes for advanced usage
module.exports.Tasklets = Tasklets;
module.exports.AdaptiveConfig = AdaptiveConfig;

// Export configuration alias for backward compatibility
module.exports.setConfig = tasklets.configure.bind(tasklets); 