/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file metrics.js
 * @brief Performance metric tracking for Tasklets
 */

const os = require('os');

class MetricsManager {
    constructor() {
        this.totalTasks = 0;
        this.processedTasks = 0;
        this.totalExecutionTime = 0;
        this.startTime = Date.now();

        // Rolling average window (last 100 tasks)
        this.executionTimes = [];
        this.windowSize = 100;

        // Throughput tracking (last 1 second)
        this.lastProcessedCount = 0;
        this.throughput = 0;
        this.throughputInterval = setInterval(() => this._calculateThroughput(), 1000);
        if (this.throughputInterval && typeof this.throughputInterval.unref === 'function') {
            this.throughputInterval.unref();
        }
    }

    recordTaskStart() {
        this.totalTasks++;
    }

    recordTaskEnd(duration) {
        this.processedTasks++;
        this.totalExecutionTime += duration;

        this.executionTimes.push(duration);
        if (this.executionTimes.length > this.windowSize) {
            this.executionTimes.shift();
        }
    }

    _calculateThroughput() {
        const currentCount = this.processedTasks;
        this.throughput = currentCount - this.lastProcessedCount;
        this.lastProcessedCount = currentCount;
    }

    getAverageExecutionTime() {
        if (this.executionTimes.length === 0) return 0;
        const sum = this.executionTimes.reduce((a, b) => a + b, 0);
        return sum / this.executionTimes.length;
    }

    getSystemMetrics() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryUsagePercent = ((totalMem - freeMem) / totalMem) * 100;

        return {
            memoryUsagePercent,
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            throughput: this.throughput,
            avgTaskTime: this.getAverageExecutionTime()
        };
    }

    destroy() {
        clearInterval(this.throughputInterval);
    }
}

module.exports = MetricsManager;
