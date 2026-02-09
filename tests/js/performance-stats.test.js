/**
 * Tests for performance monitoring: getStats, getHealth
 */

const tasklets = require('../../lib/index');

describe('Performance Monitoring Tests', () => {
  beforeEach(() => {
    // Configure tasklets for testing
    tasklets.configure({
      workers: 2,
      timeout: 10000,
      logging: 'off'
    });
  });

  describe('getStats() function', () => {
    test('should return statistics object with required properties', () => {
      const stats = tasklets.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
      expect(stats).toHaveProperty('workers');
      expect(stats).toHaveProperty('tasks');
      expect(stats).toHaveProperty('performance');
      expect(stats).toHaveProperty('system');
      expect(stats).toHaveProperty('config');
    });

    test('should return worker information', () => {
      const stats = tasklets.getStats();

      expect(stats.workers).toBeDefined();
      expect(typeof stats.workers).toBe('number');
      expect(stats.workers).toBeGreaterThan(0);
    });

    test('should return task statistics', () => {
      const stats = tasklets.getStats();

      expect(stats.tasks).toBeDefined();
      expect(typeof stats.tasks).toBe('object');
      expect(stats.tasks).toHaveProperty('completed');
      expect(stats.tasks).toHaveProperty('active');
      expect(stats.tasks).toHaveProperty('queued');
      expect(stats.tasks).toHaveProperty('total');

      expect(typeof stats.tasks.completed).toBe('number');
      expect(typeof stats.tasks.active).toBe('number');
      expect(typeof stats.tasks.queued).toBe('number');
      expect(typeof stats.tasks.total).toBe('number');
    });

    test('should return performance metrics', () => {
      const stats = tasklets.getStats();

      expect(stats.performance).toBeDefined();
      expect(typeof stats.performance).toBe('object');
      expect(stats.performance).toHaveProperty('throughput');
      expect(stats.performance).toHaveProperty('averageExecutionTime');

      expect(typeof stats.performance.throughput).toBe('number');
      expect(typeof stats.performance.averageExecutionTime).toBe('number');
    });

    test('should return system information', () => {
      const stats = tasklets.getStats();

      expect(stats.system).toBeDefined();
      expect(typeof stats.system).toBe('object');
      expect(stats.system).toHaveProperty('cpuCores');
      expect(stats.system).toHaveProperty('memoryUsage');
      expect(stats.system).toHaveProperty('uptime');

      expect(typeof stats.system.cpuCores).toBe('number');
      expect(stats.system.cpuCores).toBeGreaterThan(0);
      expect(typeof stats.system.memoryUsage).toBe('object');
      expect(typeof stats.system.uptime).toBe('number');
    });

    test('should return configuration information', () => {
      const stats = tasklets.getStats();

      expect(stats.config).toBeDefined();
      expect(typeof stats.config).toBe('object');
      expect(stats.config).toHaveProperty('workers');
      expect(stats.config).toHaveProperty('timeout');
      expect(stats.config).toHaveProperty('logging');
    });

    test('should handle configuration changes in stats', () => {
      tasklets.configure({
        workers: 4,
        timeout: 15000,
        logging: 'debug'
      });

      const stats = tasklets.getStats();

      expect(stats.workers).toBe(4);
      expect(stats.config.timeout).toBe(15000);
      expect(stats.config.logging).toBe('debug');
    });

    test('should handle auto worker configuration', () => {
      tasklets.configure({ workers: 'auto' });

      const stats = tasklets.getStats();
      const cpuCount = require('os').cpus().length;

      expect(stats.workers).toBe(cpuCount);
      expect(stats.config.workers).toBe('auto');
    });

    test('should return consistent data types', () => {
      const stats = tasklets.getStats();

      // Workers should be a positive integer
      expect(Number.isInteger(stats.workers)).toBe(true);
      expect(stats.workers).toBeGreaterThan(0);

      // Task counts should be non-negative integers
      expect(Number.isInteger(stats.tasks.completed)).toBe(true);
      expect(Number.isInteger(stats.tasks.active)).toBe(true);
      expect(Number.isInteger(stats.tasks.queued)).toBe(true);
      expect(Number.isInteger(stats.tasks.total)).toBe(true);

      expect(stats.tasks.completed).toBeGreaterThanOrEqual(0);
      expect(stats.tasks.active).toBeGreaterThanOrEqual(0);
      expect(stats.tasks.queued).toBeGreaterThanOrEqual(0);
      expect(stats.tasks.total).toBeGreaterThanOrEqual(0);

      // Performance metrics should be non-negative numbers
      expect(stats.performance.throughput).toBeGreaterThanOrEqual(0);
      expect(stats.performance.averageExecutionTime).toBeGreaterThanOrEqual(0);
    });

    test('should handle multiple concurrent getStats calls', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve(tasklets.getStats()));
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(stats => {
        expect(stats).toBeDefined();
        expect(typeof stats).toBe('object');
        expect(stats).toHaveProperty('workers');
        expect(stats).toHaveProperty('tasks');
        expect(stats).toHaveProperty('performance');
        expect(stats).toHaveProperty('system');
        expect(stats).toHaveProperty('config');
      });
    });

    test('should reflect system CPU information', () => {
      const stats = tasklets.getStats();
      const actualCpuCount = require('os').cpus().length;

      expect(stats.system.cpuCores).toBe(actualCpuCount);
      expect(stats.system.cpuCores).toBeGreaterThan(0);
    });

    test('should include memory usage information', () => {
      const stats = tasklets.getStats();

      expect(stats.system.memoryUsage).toHaveProperty('rss');
      expect(stats.system.memoryUsage).toHaveProperty('heapTotal');
      expect(stats.system.memoryUsage).toHaveProperty('heapUsed');
      expect(stats.system.memoryUsage).toHaveProperty('external');

      expect(typeof stats.system.memoryUsage.rss).toBe('number');
      expect(typeof stats.system.memoryUsage.heapTotal).toBe('number');
      expect(typeof stats.system.memoryUsage.heapUsed).toBe('number');
      expect(typeof stats.system.memoryUsage.external).toBe('number');
    });

    test('should handle stats after running tasks', async () => {
      const initialStats = tasklets.getStats();

      // Run some tasks
      await tasklets.run(() => 'test task');

      const finalStats = tasklets.getStats();

      expect(finalStats.workers).toBe(initialStats.workers);
      expect(finalStats.tasks.completed).toBeGreaterThanOrEqual(initialStats.tasks.completed);
    });

    test('should handle stats with different worker configurations', () => {
      const configs = [1, 2, 4, 8, 'auto'];

      configs.forEach(workers => {
        tasklets.configure({ workers });

        const stats = tasklets.getStats();

        if (workers === 'auto') {
          expect(stats.workers).toBe(require('os').cpus().length);
        } else {
          expect(stats.workers).toBe(workers);
        }
      });
    });

    test('should handle error conditions gracefully', () => {
      expect(() => tasklets.getStats()).not.toThrow();

      const stats = tasklets.getStats();
      expect(stats).toBeDefined();
    });
  });

  describe('getHealth() function', () => {
    test('should return health object with required properties', () => {
      const health = tasklets.getHealth();

      expect(health).toBeDefined();
      expect(typeof health).toBe('object');
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('workers');
      expect(health).toHaveProperty('memory');
      expect(health).toHaveProperty('tasks');
    });

    test('should return status information', () => {
      const health = tasklets.getHealth();

      expect(health.status).toBeDefined();
      expect(typeof health.status).toBe('string');
      expect(['healthy', 'unhealthy']).toContain(health.status);
    });

    test('should return worker health information', () => {
      const health = tasklets.getHealth();

      expect(health.workers).toBeDefined();
      expect(typeof health.workers).toBe('object');
      expect(health.workers).toHaveProperty('count');
      expect(health.workers).toHaveProperty('utilization');

      expect(typeof health.workers.count).toBe('number');
      expect(typeof health.workers.utilization).toBe('number');
      expect(health.workers.count).toBeGreaterThan(0);
      expect(health.workers.utilization).toBeGreaterThanOrEqual(0);
    });

    test('should return memory health information', () => {
      const health = tasklets.getHealth();

      expect(health.memory).toBeDefined();
      expect(typeof health.memory).toBe('object');
      expect(health.memory).toHaveProperty('used');
      expect(health.memory).toHaveProperty('total');
      expect(health.memory).toHaveProperty('percentage');

      expect(typeof health.memory.used).toBe('number');
      expect(typeof health.memory.total).toBe('number');
      expect(typeof health.memory.percentage).toBe('number');

      expect(health.memory.used).toBeGreaterThanOrEqual(0);
      expect(health.memory.total).toBeGreaterThan(0);
      expect(health.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(health.memory.percentage).toBeLessThanOrEqual(100);
    });

    test('should return task health information', () => {
      const health = tasklets.getHealth();

      expect(health.tasks).toBeDefined();
      expect(typeof health.tasks).toBe('object');
      expect(health.tasks).toHaveProperty('completed');
      expect(health.tasks).toHaveProperty('active');
      expect(health.tasks).toHaveProperty('queued');

      expect(typeof health.tasks.completed).toBe('number');
      expect(typeof health.tasks.active).toBe('number');
      expect(typeof health.tasks.queued).toBe('number');

      expect(health.tasks.completed).toBeGreaterThanOrEqual(0);
      expect(health.tasks.active).toBeGreaterThanOrEqual(0);
      expect(health.tasks.queued).toBeGreaterThanOrEqual(0);
    });

    test('should calculate worker utilization correctly', () => {
      const health = tasklets.getHealth();

      expect(health.workers.utilization).toBeGreaterThanOrEqual(0);
      expect(health.workers.utilization).toBeLessThanOrEqual(1);

      // Utilization should be active tasks / worker count
      const expectedUtilization = health.tasks.active / health.workers.count;
      expect(Math.abs(health.workers.utilization - expectedUtilization)).toBeLessThan(0.01);
    });

    test('should handle healthy status', () => {
      const health = tasklets.getHealth();

      // Should be healthy under normal conditions
      expect(health.status).toBe('healthy');
      expect(health.error).toBeUndefined();
    });

    test('should handle configuration changes', () => {
      tasklets.configure({ workers: 4 });

      const health = tasklets.getHealth();

      expect(health.workers.count).toBe(4);
      expect(health.status).toBe('healthy');
    });

    test('should handle multiple concurrent getHealth calls', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve(tasklets.getHealth()));
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(health => {
        expect(health).toBeDefined();
        expect(typeof health).toBe('object');
        expect(health).toHaveProperty('status');
        expect(health).toHaveProperty('workers');
        expect(health).toHaveProperty('memory');
        expect(health).toHaveProperty('tasks');
      });
    });

    test('should handle health after running tasks', async () => {
      const initialHealth = tasklets.getHealth();

      // Run some tasks
      await tasklets.run(() => 'test task');

      const finalHealth = tasklets.getHealth();

      expect(finalHealth.workers.count).toBe(initialHealth.workers.count);
      expect(finalHealth.tasks.completed).toBeGreaterThanOrEqual(initialHealth.tasks.completed);
      expect(finalHealth.status).toBe('healthy');
    });

    test('should calculate memory percentage correctly', () => {
      const health = tasklets.getHealth();

      const expectedPercentage = Math.round((health.memory.used / health.memory.total) * 100);
      expect(health.memory.percentage).toBe(expectedPercentage);
    });

    test('should handle error conditions gracefully', () => {
      expect(() => tasklets.getHealth()).not.toThrow();

      const health = tasklets.getHealth();
      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
    });

    test('should maintain consistent data types', () => {
      const health = tasklets.getHealth();

      // String properties
      expect(typeof health.status).toBe('string');

      // Number properties
      expect(typeof health.workers.count).toBe('number');
      expect(typeof health.workers.utilization).toBe('number');
      expect(typeof health.memory.used).toBe('number');
      expect(typeof health.memory.total).toBe('number');
      expect(typeof health.memory.percentage).toBe('number');
      expect(typeof health.tasks.completed).toBe('number');
      expect(typeof health.tasks.active).toBe('number');
      expect(typeof health.tasks.queued).toBe('number');
    });

    test('should handle different worker configurations', () => {
      const configs = [1, 2, 4, 8];

      configs.forEach(workers => {
        tasklets.configure({ workers });

        const health = tasklets.getHealth();

        expect(health.workers.count).toBe(workers);
        expect(health.status).toBe('healthy');
      });
    });

    test('should provide consistent health information', () => {
      const health1 = tasklets.getHealth();
      const health2 = tasklets.getHealth();

      // Worker count should be consistent
      expect(health1.workers.count).toBe(health2.workers.count);

      // Status should be consistent
      expect(health1.status).toBe(health2.status);

      // Memory usage should be reasonable values
      expect(health1.memory.used).toBeGreaterThan(0);
      expect(health2.memory.used).toBeGreaterThan(0);
      expect(health1.memory.total).toBeGreaterThan(0);
      expect(health2.memory.total).toBeGreaterThan(0);
      expect(health1.memory.percentage).toBeGreaterThan(0);
      expect(health2.memory.percentage).toBeGreaterThan(0);
    });
  });

  describe('stats and health integration', () => {
    test('should have consistent worker information', () => {
      const stats = tasklets.getStats();
      const health = tasklets.getHealth();

      expect(stats.workers).toBe(health.workers.count);
    });

    test('should have consistent task information', () => {
      const stats = tasklets.getStats();
      const health = tasklets.getHealth();

      expect(stats.tasks.completed).toBe(health.tasks.completed);
      expect(stats.tasks.active).toBe(health.tasks.active);
      expect(stats.tasks.queued).toBe(health.tasks.queued);
    });

    test('should handle concurrent access to both functions', async () => {
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(Promise.resolve(tasklets.getStats()));
        promises.push(Promise.resolve(tasklets.getHealth()));
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);

      // Separate stats and health results
      const statsResults = results.filter((_, index) => index % 2 === 0);
      const healthResults = results.filter((_, index) => index % 2 === 1);

      statsResults.forEach(stats => {
        expect(stats).toHaveProperty('workers');
        expect(stats).toHaveProperty('tasks');
        expect(stats).toHaveProperty('performance');
        expect(stats).toHaveProperty('system');
        expect(stats).toHaveProperty('config');
      });

      healthResults.forEach(health => {
        expect(health).toHaveProperty('status');
        expect(health).toHaveProperty('workers');
        expect(health).toHaveProperty('memory');
        expect(health).toHaveProperty('tasks');
      });
    });

    test('should track changes over time', async () => {
      const initialStats = tasklets.getStats();
      const initialHealth = tasklets.getHealth();

      // Run some tasks
      await tasklets.runAll([
        () => 'task1',
        () => 'task2',
        () => 'task3'
      ]);

      const finalStats = tasklets.getStats();
      const finalHealth = tasklets.getHealth();

      // Should maintain consistency
      expect(finalStats.workers).toBe(finalHealth.workers.count);
      expect(finalStats.tasks.completed).toBe(finalHealth.tasks.completed);
      expect(finalStats.tasks.active).toBe(finalHealth.tasks.active);
      expect(finalStats.tasks.queued).toBe(finalHealth.tasks.queued);

      // Completed tasks should have increased
      expect(finalStats.tasks.completed).toBeGreaterThanOrEqual(initialStats.tasks.completed);
      expect(finalHealth.tasks.completed).toBeGreaterThanOrEqual(initialHealth.tasks.completed);
    });
  });
}); 