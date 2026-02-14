/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file adaptive.js
 * @brief Adaptive configuration and optimization for tasklets
 */

const os = require('os');

class AdaptiveManager {
    constructor(pool) {
        this.pool = pool; // Reference to Tasklets instance
        this.isMemoryPressured = false;
        this.tempMaxOverride = null;
    }

    /**
     * Heuristic: Adjust scaling based on batch size and frequency.
     * Ported from the legacy "Smart Scaling" vision.
     */
    optimizeForBatch(taskCount) {
        if (taskCount > 50) {
            // Keep workers warm for large bursts
            this.pool.idleTimeout = Math.min(this.pool.idleTimeout * 1.5, 30000);
        } else if (taskCount < 5) {
            // Reclaim resources aggressively for light loads
            this.pool.idleTimeout = Math.max(this.pool.idleTimeout * 0.8, 2000);
        }
    }

    /**
     * Analyzes system load and proactively adjusts pool limits.
     */
    checkSystemHealth() {
        const freeMemPercent = (os.freemem() / os.totalmem()) * 100;

        if (freeMemPercent < 5) {
            // Critical: restrict to 1 worker
            this.isMemoryPressured = true;
            this.tempMaxOverride = 1;
        } else if (freeMemPercent < 15) {
            // Warning level: slow down spawning
            this.isMemoryPressured = true;
            this.tempMaxOverride = Math.max(1, Math.floor(this.pool.maxWorkers * 0.7));
        } else {
            this.isMemoryPressured = false;
            this.tempMaxOverride = null;
        }

        return {
            isMemoryPressured: this.isMemoryPressured,
            effectiveMax: this.getEffectiveMax()
        };
    }

    getEffectiveMax() {
        return this.tempMaxOverride || this.pool.maxWorkers;
    }

    /**
     * Determines if we should proactively spawn a worker based on queue size.
     */
    shouldProactivelySpawn() {
        const queueLength = this.pool.taskQueue.length;
        const currentWorkers = this.pool.workers.length;

        // If queue is building and we haven't hit the limit, spawn!
        return queueLength > 3 && currentWorkers < this.getEffectiveMax();
    }
}

module.exports = AdaptiveManager;
