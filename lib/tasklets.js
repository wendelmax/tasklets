/**
 * Copyright (c) 2025 Jackson Wendel Santos Sá
 * Licensed under the MIT License
 *
 * @file tasklets.js
 * @brief Modern user-friendly tasklets API for Node.js
 */

const nativeApi = require('./index.js');

class TaskletsManager {
    constructor() {
        this.defaultConfig = {
            poolSize: 'auto',
            cleanupInterval: 5000,
            logging: 'info',
        };
        this.currentConfig = {...this.defaultConfig};
        this.nativeModule = nativeApi;

        // Bind all native functions to this manager instance
        for (const key in this.nativeModule) {
            if (typeof this.nativeModule[key] === 'function') {
                this[key] = this.nativeModule[key];
            }
        }
        
        // Initialize the native module with default configuration
        if (this.configure) {
            this.config(this.currentConfig);
        }
    }

    // run and getStatus are special, already wrapped in index.js
    run(task, ...args) {
        return this.nativeModule.run(task, ...args);
    }

    getStatus(taskletId) {
        return this.nativeModule.getStatus(taskletId);
    }

    config(options) {
        if (this.configure) {
            const configToSend = {};

            if (options.workers) {
                // Worker configuration is handled in the JS layer for now
                // This could be passed to native in the future
            }

            if (options.timeout) {
                this.defaultTimeout = options.timeout;
            }

            if (options.logging) {
                const level = LOG_LEVELS[options.logging];
                if (level !== undefined) {
                    configToSend.logging = level;
                }
            }

            this.configure(configToSend);
        }
        return this;
    }
}

const tasklets = new TaskletsManager();
module.exports = tasklets; 