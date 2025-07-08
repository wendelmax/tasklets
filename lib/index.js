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

const { TaskletsWrapper } = require('../build/Release/tasklets');
const os = require('os');
const EventEmitter = require('events');

class Tasklets extends EventEmitter {
    constructor() {
        super();
        this.wrapper = new TaskletsWrapper();
        this.config = {
            workers: os.cpus().length,
            timeout: 30000,
            logging: 'info',
            maxMemory: 'auto'
        };
        
        // Configure higher memory limit for testing
        this.wrapper.configure({ memoryLimit: 95.0 });
    }

    configure(options = {}) {
        this.wrapper.configure(options);
        if (options.workers) this.config.workers = options.workers;
        if (options.timeout) this.config.timeout = options.timeout;
        if (options.logging) this.config.logging = options.logging;
        if (options.maxMemory) this.config.maxMemory = options.maxMemory;
        if (options.memoryLimit) this.wrapper.configure({ memoryLimit: options.memoryLimit });
    }

    run(taskFunction, input = '') {
        if (typeof taskFunction !== 'function') {
            throw new Error('Task function must be a function');
        }
        
        const jobId = this.wrapper.spawnJs(taskFunction);
        return {
            id: jobId,
            wait: () => this.waitForCompletion(jobId),
            getResult: () => this.getResult(jobId),
            hasError: () => this.hasError(jobId),
            getError: () => this.getError(jobId)
        };
    }

    waitForCompletion(jobId) {
        return new Promise((resolve, reject) => {
            const checkCompletion = () => {
                try {
                    const result = this.getResult(jobId);
                    if (this.hasError(jobId)) {
                        reject(new Error(this.getError(jobId)));
                    } else {
                        resolve(result);
                    }
                } catch (error) {
                    setTimeout(checkCompletion, 10);
                }
            };
            checkCompletion();
        });
    }

    getResult(jobId) {
        return this.wrapper.getResult(jobId);
    }

    hasError(jobId) {
        return this.wrapper.hasError(jobId);
    }

    getError(jobId) {
        return this.wrapper.getError(jobId);
    }

    getStats() {
        const nativeStats = this.wrapper.getStats();
        const memoryUsage = process.memoryUsage();
        const cpuCount = os.cpus().length;
        return {
            workers: this.config.workers,
            tasks: {
                completed: nativeStats.completedJobs || 0,
                active: nativeStats.activeJobs || 0,
                failed: 0
            },
            performance: {
                throughput: 0,
                averageExecutionTime: 0,
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
                workers: this.config.workers,
                timeout: this.config.timeout,
                logging: this.config.logging,
                maxMemory: this.config.maxMemory
            }
        };
    }

    getHealth() {
        const stats = this.getStats();
        const memoryUsage = process.memoryUsage();
        const totalMemory = os.totalmem();
        const usedMemory = totalMemory - os.freemem();
        const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);
        return {
            status: 'healthy',
            workers: {
                count: stats.workers,
                active: stats.tasks.active,
                utilization: stats.workers > 0 ? stats.tasks.active / stats.workers : 0
            },
            memory: {
                total: totalMemory,
                free: os.freemem(),
                used: usedMemory,
                percentage: memoryPercentage
            },
            tasks: {
                completed: stats.tasks.completed,
                failed: stats.tasks.failed
            },
            uptime: process.uptime()
        };
    }

    // Stubs for batch, retry, shutdown
    batch(tasks) {
        // Simulate batch processing: run all tasks and return Promise.all
        if (!Array.isArray(tasks)) throw new Error('batch expects an array');
        return Promise.all(tasks.map(t => this.run(t.task || t)));
    }

    retry(task, options = {}) {
        // Simulate retry: just run the task once for now
        return this.run(task);
    }

    shutdown(options = {}) {
        // Simulate shutdown: just resolve
        this.emit('shutdown');
        return Promise.resolve();
    }
}

const tasklets = new Tasklets();
tasklets.config = tasklets.configure.bind(tasklets);
tasklets.runAll = tasklets.run.bind(tasklets);

module.exports = tasklets; 