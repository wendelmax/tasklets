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
}

module.exports = TaskletsLogger; 