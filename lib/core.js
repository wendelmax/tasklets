/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file core.js
 * @brief Core tasklets functionality - Native API integration and basic operations
 */

const nativeApi = require('../build/Release/tasklets');
const os = require('os');

/**
 * Core Tasklets class - Handles native API integration and basic operations
 */
class TaskletsCore {
    constructor() {
        this.nativeApi = nativeApi;
    }

    // =====================================================================
    // Native API Wrapper Methods
    // =====================================================================

    spawn(taskFunction) {
        if (typeof taskFunction !== 'function') {
            throw new Error('Task function must be a function');
        }
        return this.nativeApi.spawn(taskFunction);
    }

    join(taskletId) {
        this.nativeApi.join(taskletId);
    }

    getResult(taskletId) {
        return this.nativeApi.getResult(taskletId);
    }

    hasError(taskletId) {
        return this.nativeApi.hasError(taskletId);
    }

    getError(taskletId) {
        return this.nativeApi.getError(taskletId);
    }

    isFinished(taskletId) {
        return this.nativeApi.isFinished(taskletId);
    }

    getStats() {
        return this.nativeApi.getStats();
    }

    config() {
        return this.nativeApi.config();
    }

    // =====================================================================
    // Native Adaptive Configuration Methods
    // =====================================================================

    setAdaptiveEnabled(enabled) {
        return this.nativeApi.setAdaptiveEnabled(enabled);
    }

    isAdaptiveEnabled() {
        return this.nativeApi.isAdaptiveEnabled();
    }

    forceAdaptiveAdjustment() {
        return this.nativeApi.forceAdaptiveAdjustment();
    }

    getAdaptiveMetrics() {
        return this.nativeApi.getAdaptiveMetrics();
    }

    getLastAdjustment() {
        return this.nativeApi.getLastAdjustment();
    }

    // =====================================================================
    // System Information
    // =====================================================================

    getSystemInfo() {
        return {
            cpuCores: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version
        };
    }

    getMemoryUsage() {
        return process.memoryUsage();
    }
}

module.exports = TaskletsCore; 