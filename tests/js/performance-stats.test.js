const Tasklets = require('../../lib/index');
const os = require('os');

describe('Performance Monitoring Tests', () => {
  let tasklets;

  beforeEach(() => {
    tasklets = new Tasklets({
      workers: 2,
      timeout: 10000,
      logging: 'off'
    });
  });

  afterEach(async () => {
    if (tasklets) {
      await tasklets.shutdown();
    }
  });

  describe('getStats() function', () => {
    test('should return statistics object with required properties', () => {
      const stats = tasklets.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
      expect(stats).toHaveProperty('workers');
      expect(stats).toHaveProperty('activeTasks');
      expect(stats).toHaveProperty('throughput');
      expect(stats).toHaveProperty('config');
    });

    test('should return numeric worker information', () => {
      const stats = tasklets.getStats();
      expect(typeof stats.workers).toBe('number');
      expect(stats.workers).toBeGreaterThan(0);
    });

    test('should track throughput and average task time', async () => {
      await tasklets.runAll([
        () => 1 + 1,
        () => 2 + 2
      ]);

      const stats = tasklets.getStats();
      expect(stats.throughput).toBeDefined();
      expect(stats.avgTaskTime).toBeDefined();
    });

    test('should handle configuration changes in stats', () => {
      tasklets.configure({
        maxWorkers: 4,
        timeout: 15000
      });

      const stats = tasklets.getStats();
      expect(stats.workers).toBe(4);
      expect(stats.config.timeout).toBe(15000);
    });

    test('should handle auto worker configuration', () => {
      tasklets.configure({ workers: 'auto' });
      const stats = tasklets.getStats();
      const cpuCount = os.cpus().length;
      expect(stats.workers).toBe(cpuCount);
    });
  });

  describe('getHealth() function', () => {
    test('should return health object with required properties', () => {
      const health = tasklets.getHealth();

      expect(health).toBeDefined();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('workers');
      expect(health).toHaveProperty('memoryUsagePercent');
    });

    test('should return status as healthy', () => {
      const health = tasklets.getHealth();
      expect(health.status).toBe('healthy');
    });

    test('should return worker count', async () => {
      // Run a task to ensure at least one worker is spawned
      await tasklets.run(() => 'ping');
      const health = tasklets.getHealth();
      expect(typeof health.workers).toBe('number');
      expect(health.workers).toBeGreaterThan(0);
    });
  });
});
