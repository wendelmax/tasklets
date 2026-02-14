const Tasklets = require('../../lib/index');
const os = require('os');

// Utility to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('Memory Management', () => {
  let tasklets;

  beforeEach(() => {
    tasklets = new Tasklets();
    tasklets.configure({
      workers: 2,
      timeout: 5000,
      logging: 'off'
    });
  });

  afterEach(async () => {
    // Clean up resources after each test
    try {
      await tasklets.shutdown();
    } catch (error) {
      console.warn('Error during test cleanup:', error);
    }
  });

  // Configuration for specific tests
  test('should initialize with zero active tasks', () => {
    const stats = tasklets.getStats();
    expect(stats.activeTasks).toBe(0);
    expect(stats.totalWorkers).toBeLessThanOrEqual(10);
  });

  test('should show active tasks when running', async () => {
    const numTasks = 5;

    // Run tasks but don't wait for them to finish yet
    const taskPromises = Array.from({ length: numTasks }, (_, i) => tasklets.run(async (idx) => {
      await new Promise(r => setTimeout(r, 100)); // Simulate work
      return idx;
    }, i));

    // Give a moment for tasks to start
    await delay(20);

    // Check that they are registered
    const stats = tasklets.getStats();
    expect(stats.activeTasks).toBeGreaterThan(0);

    // Wait for all tasks to complete
    await Promise.all(taskPromises);
  });

  test('should automatically scale workers', async () => {
    const numTasks = 8;

    // Run rapid tasks
    const tasks = Array.from({ length: numTasks }, (_, i) => ({ task: (idx) => idx, idx: i }));
    const taskPromises = tasks.map(t => tasklets.run(t.task, t.idx));

    await Promise.all(taskPromises);

    const stats = tasklets.getStats();
    expect(stats.totalWorkers).toBeGreaterThan(0);
  }, 10000);

  test('should reflect resource usage in health checks', () => {
    const health = tasklets.getHealth();
    expect(health.status).toBe('healthy');
    expect(health.memoryUsagePercent).toBeDefined();
    expect(typeof health.memoryUsagePercent).toBe('number');
  });
});
