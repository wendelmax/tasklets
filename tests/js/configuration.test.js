const Tasklets = require('../../lib/index');
const os = require('os');

describe('Configuration Management Tests', () => {
  let tasklets;

  beforeEach(() => {
    tasklets = new Tasklets({
      maxWorkers: 2,
      timeout: 30000,
      logging: 'info',
      maxMemory: 99
    });
  });

  afterEach(async () => {
    if (tasklets) {
      await tasklets.shutdown();
    }
  });

  describe('config() function', () => {
    test('should set configuration options', () => {
      const result = tasklets.configure({
        maxWorkers: 4,
        timeout: 5000,
        logging: 'debug'
      });

      expect(result).toBe(tasklets);
    });

    test('should handle auto worker detection', () => {
      tasklets.configure({
        maxWorkers: 'auto'
      });

      const stats = tasklets.getStats();
      expect(stats.config.maxWorkers).toBe(os.cpus().length);
    });

    test('should handle numeric worker count', () => {
      tasklets.configure({
        maxWorkers: 3
      });

      const stats = tasklets.getStats();
      expect(stats.config.maxWorkers).toBe(3);
    });

    test('should handle string worker count', () => {
      tasklets.configure({
        maxWorkers: '2'
      });

      const stats = tasklets.getStats();
      expect(stats.config.maxWorkers).toBe(2);
    });

    test('should handle timeout configuration', () => {
      tasklets.configure({
        timeout: 10000
      });

      const stats = tasklets.getStats();
      expect(stats.config.timeout).toBe(10000);
    });

    test('should handle logging level configuration', () => {
      const logLevels = ['none', 'error', 'warn', 'info', 'debug'];

      logLevels.forEach(level => {
        tasklets.configure({
          logging: level
        });

        const stats = tasklets.getStats();
        expect(stats.config.logging).toBe(level);
      });
    });

    test('should handle maxMemory configuration', () => {
      tasklets.configure({
        maxMemory: 80
      });

      const stats = tasklets.getStats();
      expect(stats.config.maxMemory).toBe(80);
    });

    test('should handle multiple configuration options', () => {
      const config = {
        maxWorkers: 2,
        timeout: 15000,
        logging: 'warn',
        maxMemory: 70
      };

      tasklets.configure(config);

      const stats = tasklets.getStats();
      expect(stats.config.maxWorkers).toBe(2);
      expect(stats.config.timeout).toBe(15000);
      expect(stats.config.logging).toBe('warn');
      expect(stats.config.maxMemory).toBe(70);
    });

    test('should handle partial configuration updates', () => {
      tasklets.configure({
        maxWorkers: 2,
        timeout: 10000,
        logging: 'debug'
      });

      tasklets.configure({
        logging: 'error'
      });

      const stats = tasklets.getStats();
      expect(stats.config.maxWorkers).toBe(2);
      expect(stats.config.timeout).toBe(10000);
      expect(stats.config.logging).toBe('error');
    });

    test('should handle empty configuration', () => {
      tasklets.configure({});
      const stats = tasklets.getStats();
      expect(stats).toBeDefined();
    });

    test('should handle no configuration parameter', () => {
      tasklets.configure();
      const stats = tasklets.getStats();
      expect(stats).toBeDefined();
    });

    test('should handle invalid logging level gracefully', () => {
      tasklets.configure({
        logging: 'invalid_level'
      });

      const stats = tasklets.getStats();
      expect(stats.config.logging).toBe('invalid_level');
    });

    test('should handle zero workers', () => {
      tasklets.configure({
        maxWorkers: 0
      });

      const stats = tasklets.getStats();
      expect(stats.config.maxWorkers).toBe(0);
    });

    test('should handle negative timeout', () => {
      tasklets.configure({
        timeout: -1000
      });

      const stats = tasklets.getStats();
      expect(stats.config.timeout).toBe(-1000);
    });

    test('should handle zero timeout', () => {
      tasklets.configure({
        timeout: 0
      });

      const stats = tasklets.getStats();
      expect(stats.config.timeout).toBe(0);
    });

    test('should handle configuration chaining', () => {
      tasklets
        .configure({ maxWorkers: 2 })
        .configure({ timeout: 5000 })
        .configure({ logging: 'debug' });

      const stats = tasklets.getStats();
      expect(stats.config.maxWorkers).toBe(2);
      expect(stats.config.timeout).toBe(5000);
      expect(stats.config.logging).toBe('debug');
    });

    test('should validate configuration persistence', async () => {
      tasklets.configure({
        maxWorkers: 3,
        timeout: 8000,
        logging: 'warn'
      });

      const result = await tasklets.run(() => 'test');
      expect(result).toBe('test');

      const stats = tasklets.getStats();
      expect(stats.config.maxWorkers).toBe(3);
      expect(stats.config.timeout).toBe(8000);
      expect(stats.config.logging).toBe('warn');
    });
  });

  describe('worker configuration', () => {
    test('should auto-detect CPU cores', () => {
      tasklets.configure({ maxWorkers: 'auto' });
      const stats = tasklets.getStats();
      expect(stats.config.maxWorkers).toBe(os.cpus().length);
    });

    test('should handle explicit worker count', () => {
      tasklets.configure({ maxWorkers: 6 });
      const stats = tasklets.getStats();
      expect(stats.config.maxWorkers).toBe(6);
    });
  });

  describe('timeout configuration', () => {
    test('should handle various timeout values', () => {
      const timeouts = [100, 1000, 5000, 10000, 30000, 60000];
      timeouts.forEach(timeout => {
        tasklets.configure({ timeout });
        const stats = tasklets.getStats();
        expect(stats.config.timeout).toBe(timeout);
      });
    });
  });

  describe('logging configuration', () => {
    test('should handle all logging levels', () => {
      const levels = ['none', 'error', 'warn', 'info', 'debug'];
      levels.forEach(level => {
        tasklets.configure({ logging: level });
        const stats = tasklets.getStats();
        expect(stats.config.logging).toBe(level);
      });
    });
  });

  describe('memory configuration', () => {
    test('should handle various memory formats', () => {
      const formats = [50, 75, 90];
      formats.forEach(maxMemory => {
        tasklets.configure({ maxMemory });
        const stats = tasklets.getStats();
        expect(stats.config.maxMemory).toBe(maxMemory);
      });
    });
  });

  describe('configuration validation', () => {
    test('should maintain configuration across multiple operations', async () => {
      tasklets.configure({
        maxWorkers: 2,
        timeout: 5000,
        logging: 'warn'
      });

      const results = await Promise.all([
        tasklets.run(() => 'task1'),
        tasklets.run(() => 'task2')
      ]);

      expect(results).toEqual(['task1', 'task2']);

      const stats = tasklets.getStats();
      expect(stats.config.maxWorkers).toBe(2);
      expect(stats.config.timeout).toBe(5000);
      expect(stats.config.logging).toBe('warn');
    }, 20000);
  });
});
