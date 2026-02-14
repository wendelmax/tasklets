/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file index.js
 * @brief Main Tasklets entry point - Native JS implementation
 */

const { Worker } = require('worker_threads');
const path = require('path');
const os = require('os');
const EventEmitter = require('events');
const MetricsManager = require('./metrics');
const AdaptiveManager = require('./adaptive');

class Tasklets extends EventEmitter {
    constructor(config = {}) {
        super();
        this.maxWorkers = config.maxWorkers || config.workers || os.cpus().length;
        this.minWorkers = config.minWorkers || 1; // Always keep at least 1 warm
        this.idleTimeout = config.idleTimeout || 5000; // 5 seconds

        this.workers = []; // { worker, busy, lastUsed }
        this.activeTasks = new Map();
        this.taskQueue = [];
        this.workerScript = path.join(__dirname, 'worker.js');
        this.nextTaskId = 1;
        this.isTerminated = false;
        
        // Generate a secret token for worker authentication
        this.workerSecret = this._generateSecret();

        // Modular Managers
        this.metricsManager = new MetricsManager();
        this.adaptiveManager = new AdaptiveManager(this);

        // Maintenance loop
        this.maintenanceInterval = setInterval(() => this._maintenance(), 2000);
        if (typeof this.maintenanceInterval.unref === 'function') {
            this.maintenanceInterval.unref();
        }
    }

    _generateSecret() {
        // Generate a random secret token for worker authentication
        const crypto = require('crypto');
        return crypto.randomBytes(32).toString('hex');
    }

    _maintenance() {
        if (this.isTerminated) return;
        const now = Date.now();

        // 1. Scale Down: Remove idle workers if > minWorkers
        if (this.workers.length > this.minWorkers) {
            const idleThreshold = this.idleTimeout;
            const idleWorkers = this.workers.filter(w => !w.busy && (now - w.lastUsed > idleThreshold));

            while (idleWorkers.length > 0 && this.workers.length > this.minWorkers) {
                const w = idleWorkers.pop();
                this._terminateWorker(w);
            }
        }

        // 2. Adaptive Heuristics (Externalized)
        this.adaptiveManager.checkSystemHealth();

        if (this.adaptiveManager.shouldProactivelySpawn()) {
            this._getWorker();
        }
    }

    _terminateWorker(workerObj) {
        const idx = this.workers.indexOf(workerObj);
        if (idx !== -1) {
            this.workers.splice(idx, 1);
            workerObj.worker.terminate().catch(() => { });
        }
    }

    _getWorker() {
        // Apply adaptive limits (Effective Max)
        const effectiveMax = this.adaptiveManager.getEffectiveMax();

        // 1. Try to find an idle worker
        const idleWorker = this.workers.find(w => !w.busy);
        if (idleWorker) {
            return idleWorker;
        }

        // 2. If no idle worker, check if we can spawn more
        if (this.workers.length < effectiveMax) {
            const worker = new Worker(this.workerScript, {
                workerData: { secret: this.workerSecret }
            });
            this._initWorker(worker);
            const workerObj = { worker, busy: false, lastUsed: Date.now() };
            this.workers.push(workerObj);
            return workerObj;
        }

        return null;
    }

    _initWorker(worker) {
        worker.on('message', (msg) => {
            const task = this.activeTasks.get(msg.taskId);
            if (task) {
                if (msg.error) {
                    task.reject(new Error(msg.error));
                } else {
                    task.resolve(msg.result);
                }

                // Update metrics manager
                const duration = Date.now() - task.startTime;
                this.metricsManager.recordTaskEnd(duration);

                this.activeTasks.delete(msg.taskId);

                const workerObj = this.workers.find(w => w.worker === worker);
                if (workerObj) {
                    workerObj.busy = false;
                    workerObj.lastUsed = Date.now();
                    this._processQueue();
                }
            }
        });

        worker.on('error', (err) => {
            console.error('Tasklets Worker Error:', err);
            // Reject all tasks assigned to this worker
            const workerObj = this.workers.find(w => w.worker === worker);
            if (workerObj) {
                // Find and reject any active task on this worker
                for (const [taskId, task] of this.activeTasks.entries()) {
                    // Since we don't track which worker has which task, reject all active tasks
                    // This is a safe approach as the worker errored
                    task.reject(new Error(`Worker error: ${err.message}`));
                    this.activeTasks.delete(taskId);
                }
                // Remove the worker from the pool
                this._terminateWorker(workerObj);
                // Process queue with remaining workers
                this._processQueue();
            }
        });

        worker.on('exit', (code) => {
            if (code !== 0 && !this.isTerminated) {
                console.error(`Tasklets Worker exited with code ${code}`);
                // Reject all tasks assigned to this worker
                const workerObj = this.workers.find(w => w.worker === worker);
                if (workerObj) {
                    // Find and reject any active task on this worker
                    for (const [taskId, task] of this.activeTasks.entries()) {
                        task.reject(new Error(`Worker exited unexpectedly with code ${code}`));
                        this.activeTasks.delete(taskId);
                    }
                    // Remove the worker from the pool
                    const idx = this.workers.indexOf(workerObj);
                    if (idx !== -1) {
                        this.workers.splice(idx, 1);
                    }
                    // Process queue with remaining workers
                    this._processQueue();
                }
            }
        });
    }

    _processQueue() {
        if (this.taskQueue.length === 0) return;

        // Try to get a worker (idle or new)
        const workerObj = this._getWorker();

        if (workerObj) {
            const { taskFn, resolve, reject, args, startTime } = this.taskQueue.shift();
            const taskId = this.nextTaskId++;

            this.activeTasks.set(taskId, { resolve, reject, startTime });
            workerObj.busy = true;

            workerObj.worker.postMessage({
                taskId,
                task: taskFn.toString(),
                args,
                secret: this.workerSecret
            });
        }
    }

    run(taskFn, ...args) {
        if (this.isTerminated) return Promise.reject(new Error('Tasklets instance is terminated'));
        if (typeof taskFn !== 'function' && typeof taskFn !== 'string') return Promise.reject(new Error('Task must be a function or a string'));

        return new Promise((resolve, reject) => {
            this.taskQueue.push({ taskFn, resolve, reject, args, startTime: Date.now() });
            this.metricsManager.recordTaskStart();
            this._processQueue();
        });
    }

    async runAll(tasks) {
        if (!Array.isArray(tasks)) {
            return Promise.reject(new Error('Tasks must be an array of functions or task configuration objects'));
        }
        return Promise.all(tasks.map(async t => {
            try {
                if (typeof t === 'function') {
                    return await this.run(t);
                } else if (t && (typeof t.task === 'function' || typeof t.task === 'string')) {
                    return await this.run(t.task, ...(t.args || []));
                } else {
                    return await this.run(t); // Will trigger validation error
                }
            } catch (err) {
                return err;
            }
        }));
    }

    async batch(tasks, options = {}) {
        if (!Array.isArray(tasks)) return Promise.reject(new Error('Task configurations must be an array'));

        // Validation (as expected by tests - must reject immediately)
        for (const t of tasks) {
            if (typeof t !== 'function' && (!t || (typeof t.task !== 'function' && typeof t.task !== 'string'))) {
                return Promise.reject(new Error('Each task configuration must have a task function'));
            }
        }

        let completed = 0;
        const total = tasks.length;

        const results = await Promise.all(tasks.map(async (t, index) => {
            const name = t.name || `task-${index}`;
            try {
                let res;
                if (typeof t === 'function') {
                    res = await this.run(t);
                } else {
                    res = await this.run(t.task, ...(t.args || []));
                }

                completed++;
                if (options.onProgress) {
                    options.onProgress({ completed, total, percentage: (completed / total) * 100 });
                }

                return { name, result: res, success: true };
            } catch (err) {
                completed++;
                if (options.onProgress) {
                    options.onProgress({ completed, total, percentage: (completed / total) * 100 });
                }
                return { name, success: false, error: err.message };
            }
        }));

        // Delegate to AdaptiveManager
        this.adaptiveManager.optimizeForBatch(total);

        return results;
    }

    async retry(taskFn, options = {}) {
        const attempts = options.attempts || 3;
        const delay = options.delay || 0;
        const backoff = options.backoff || 1;

        let lastError;

        for (let i = 0; i < attempts; i++) {
            try {
                return await this.run(taskFn);
            } catch (err) {
                lastError = err;
                if (i < attempts - 1) {
                    const waitTime = delay * Math.pow(backoff, i);
                    if (waitTime > 0) await new Promise(r => setTimeout(r, waitTime));
                }
            }
        }
        throw lastError;
    }

    enableAdaptiveMode() {
        if (this.maintenanceInterval) clearInterval(this.maintenanceInterval);
        this.maintenanceInterval = setInterval(() => this._maintenance(), 1000);
        return this;
    }

    setWorkloadType(type) {
        switch (type) {
            case 'cpu': this.idleTimeout = 10000; break;
            case 'io': this.idleTimeout = 2000; break;
            default: this.idleTimeout = 5000;
        }
        return this;
    }

    configure(config = {}) {
        if (config.workers !== undefined) {
            if (config.workers === 'auto') {
                this.maxWorkers = os.cpus().length;
            } else {
                const val = parseInt(config.workers, 10);
                if (!isNaN(val)) this.maxWorkers = val;
            }
        }
        if (config.maxWorkers !== undefined) {
            const val = parseInt(config.maxWorkers, 10);
            if (!isNaN(val)) this.maxWorkers = val;
        }
        if (config.minWorkers !== undefined) {
            const val = parseInt(config.minWorkers, 10);
            if (!isNaN(val)) this.minWorkers = val;
        }
        if (config.idleTimeout !== undefined) {
            const val = parseInt(config.idleTimeout, 10);
            if (!isNaN(val)) this.idleTimeout = val;
        }
        if (config.timeout !== undefined) {
            const val = parseInt(config.timeout, 10);
            if (!isNaN(val)) this.globalTimeout = val;
        }
        if (config.logging !== undefined) this.loggingLevel = config.logging;
        if (config.maxMemory !== undefined) this.maxMemory = config.maxMemory;
        return this;
    }

    getStats() {
        const metrics = this.metricsManager.getSystemMetrics();
        return {
            activeTasks: this.activeTasks.size,
            activeWorkers: this.workers.filter(w => w.busy).length,
            totalWorkers: this.workers.length,
            queuedTasks: this.taskQueue.length,
            idleWorkers: this.workers.filter(w => !w.busy).length,
            throughput: metrics.throughput,
            avgTaskTime: metrics.avgTaskTime,
            workers: this.maxWorkers,
            config: {
                maxWorkers: this.maxWorkers,
                minWorkers: this.minWorkers,
                idleTimeout: this.idleTimeout,
                timeout: this.globalTimeout,
                logging: this.loggingLevel,
                maxMemory: this.maxMemory
            }
        };
    }

    getHealth() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        return {
            status: 'healthy',
            workers: this.workers.length,
            memoryUsagePercent: ((totalMem - freeMem) / totalMem) * 100
        };
    }

    async terminate() {
        this.isTerminated = true;
        clearInterval(this.maintenanceInterval);
        this.metricsManager.destroy();
        await Promise.all(this.workers.map(w => w.worker.terminate()));
        this.workers = [];
    }

    async shutdown() {
        this.emit('shutdown');
        await this.terminate();
    }
}

const defaultPool = new Tasklets();

// Static API for singleton usage (Ergonomics)
Tasklets.run = defaultPool.run.bind(defaultPool);
Tasklets.runAll = defaultPool.runAll.bind(defaultPool);
Tasklets.batch = defaultPool.batch.bind(defaultPool);
Tasklets.configure = defaultPool.configure.bind(defaultPool);
Tasklets.getStats = defaultPool.getStats.bind(defaultPool);
Tasklets.getHealth = defaultPool.getHealth.bind(defaultPool);
Tasklets.terminate = defaultPool.terminate.bind(defaultPool);
Tasklets.shutdown = defaultPool.shutdown.bind(defaultPool);

// Export the class which now also acts as a singleton proxy
module.exports = Tasklets;
module.exports.Tasklets = Tasklets;