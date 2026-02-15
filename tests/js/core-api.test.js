const Tasklets = require('../../lib/index');

describe('Core API Tests', () => {
  let tasklets;

  beforeEach(() => {
    tasklets = new Tasklets({
      workers: 2,
      timeout: 5000,
      logging: 'none'
    });
  });

  afterEach(async () => {
    if (tasklets) {
      await tasklets.shutdown();
    }
  });

  describe('run() function', () => {
    test('should execute a simple task', async () => {
      const result = await tasklets.run(() => {
        return 42;
      });
      expect(result).toBe(42);
    });

    test('should execute a task with string data', async () => {
      const result = await tasklets.run(() => {
        return "Hello World";
      });
      expect(result).toBe('Hello World');
    });

    test('should execute a task with object data', async () => {
      const result = await tasklets.run(() => {
        return { name: 'test', value: 123 };
      });
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    test('should execute a task with array data', async () => {
      const result = await tasklets.run(() => {
        return [1, 2, 3, 4, 5];
      });
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    test('should execute a computational task', async () => {
      const result = await tasklets.run(() => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });
      expect(result).toBe(499500);
    });

    test('should execute tasks with different data types', async () => {
      const cases = [
        [() => 42, 42],
        [() => "string", "string"],
        [() => true, true],
        [() => ({ key: 'value' }), { key: 'value' }],
        [() => [1, 2, 3], [1, 2, 3]],
        [() => null, null],
        [() => undefined, undefined]
      ];
      for (const [task, expected] of cases) {
        const result = await tasklets.run(task);
        expect(result).toEqual(expected);
      }
    });

    test('should handle task that throws an error', async () => {
      await expect(tasklets.run(() => {
        throw new Error('Test error');
      })).rejects.toThrow('Test error');
    });

    test('should handle task with custom timeout', async () => {
      const result = await tasklets.run(() => {
        return "completed";
      }, { timeout: 1000 });
      expect(result).toBe('completed');
    });

    test('should handle task with very short timeout', async () => {
      const result = await tasklets.run(() => {
        return "completed";
      }, { timeout: 1 });
      expect(typeof result).toBe('string');
    });

    test('should reject invalid task input', async () => {
      // tasklets.run("not a function") is now VALID (treated as code string)
      await expect(tasklets.run(123)).rejects.toThrow();
      await expect(tasklets.run(null)).rejects.toThrow();
      await expect(tasklets.run(undefined)).rejects.toThrow();
    });

    test('should handle mathematical computations', async () => {
      const result = await tasklets.run(() => {
        return Math.sqrt(144);
      });
      expect(result).toBe(12);
    });

    test('should handle Date objects', async () => {
      const result = await tasklets.run(() => {
        return new Date();
      });
      expect(result).toBeDefined();
    });
  });

  describe('runAll() function', () => {
    test('should execute multiple tasks in parallel', async () => {
      const tasks = [
        () => 1,
        () => 2,
        () => 3
      ];
      const results = await tasklets.runAll(tasks);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(3);
      expect(results).toEqual([1, 2, 3]);
    });

    test('should execute tasks with different complexities', async () => {
      const tasks = [
        () => 42,
        () => {
          let sum = 0;
          for (let i = 0; i < 100; i++) {
            sum += i;
          }
          return sum;
        },
        () => "hello world",
        () => [1, 2, 3, 4, 5]
      ];
      const results = await tasklets.runAll(tasks);
      expect(results.length).toBe(4);
      expect(results[0]).toBe(42);
      expect(results[1]).toBe(4950);
      expect(results[2]).toBe('hello world');
      expect(results[3]).toEqual([1, 2, 3, 4, 5]);
    });

    test('should handle empty task array', async () => {
      const results = await tasklets.runAll([]);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    test('should handle single task in array', async () => {
      const results = await tasklets.runAll([() => 42]);
      expect(results.length).toBe(1);
      expect(results[0]).toBe(42);
    });

    test('should handle large number of tasks', async () => {
      const tasks = Array.from({ length: 10 }, (_, i) => ({ task: (idx) => idx, args: [i] }));
      const results = await tasklets.runAll(tasks);
      expect(results.length).toBe(10);
      expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    test('should reject invalid input', async () => {
      await expect(tasklets.runAll("not an array")).rejects.toThrow('Tasks must be an array of functions');
      await expect(tasklets.runAll(123)).rejects.toThrow('Tasks must be an array of functions');
      await expect(tasklets.runAll(null)).rejects.toThrow('Tasks must be an array of functions');
    });

    test('should handle mixed successful and error tasks', async () => {
      const tasks = [
        () => 42,
        () => {
          throw new Error('Test error');
        },
        () => "success"
      ];
      const results = await tasklets.runAll(tasks);
      expect(results.length).toBe(3);
      expect(results[0]).toBe(42);
      expect(results[1].message).toBe('Test error');
      expect(results[2]).toBe('success');
    });
  });

  describe('batch() function', () => {
    test('should execute batch of tasks with progress tracking', async () => {
      const taskConfigs = [
        { name: 'task1', task: () => 1 },
        { name: 'task2', task: () => 2 },
        { name: 'task3', task: () => 3 }
      ];

      let progressCallCount = 0;
      const progressData = [];
      const results = await tasklets.batch(taskConfigs, {
        onProgress: (progress) => {
          progressCallCount++;
          progressData.push(progress);
          expect(progress).toHaveProperty('completed');
          expect(progress).toHaveProperty('total');
          expect(progress).toHaveProperty('percentage');
          expect(progress.total).toBe(3);
          expect(progress.completed).toBeGreaterThan(0);
          expect(progress.percentage).toBeGreaterThan(0);
        }
      });

      expect(results.length).toBe(3);
      // Progress should be called at least once per task, but may be called more due to parallel execution
      expect(progressCallCount).toBeGreaterThanOrEqual(3);

      // Verify final progress data shows all tasks completed
      const finalProgress = progressData[progressData.length - 1];
      expect(finalProgress.completed).toBe(3);
      expect(finalProgress.percentage).toBe(100);

      results.forEach((result, index) => {
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('result');
        expect(result).toHaveProperty('success');
        expect(result.name).toBe(`task${index + 1}`);
        expect(result.result).toBe(index + 1);
        expect(result.success).toBe(true);
      });
    });

    test('should handle batch with errors', async () => {
      const taskConfigs = [
        { name: 'success', task: () => 42 },
        {
          name: 'error', task: () => {
            throw new Error('Test error');
          }
        }
      ];

      const results = await tasklets.batch(taskConfigs);

      expect(results.length).toBe(2);
      expect(results[0].name).toBe('success');
      expect(results[0].result).toBe(42);
      expect(results[0].success).toBe(true);
      expect(results[1].name).toBe('error');
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Test error');
    });

    test('should handle batch without progress callback', async () => {
      const taskConfigs = [
        { task: () => 1 },
        { task: () => 2 }
      ];

      const results = await tasklets.batch(taskConfigs);

      expect(results.length).toBe(2);
      results.forEach((result, index) => {
        expect(result.name).toBe(`task-${index}`);
        expect(result.result).toBe(index + 1);
        expect(result.success).toBe(true);
      });
    });

    test('should handle empty batch', async () => {
      const results = await tasklets.batch([]);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    test('should reject invalid batch input', async () => {
      await expect(tasklets.batch("not an array")).rejects.toThrow('Task configurations must be an array');
      await expect(tasklets.batch(123)).rejects.toThrow('Task configurations must be an array');
      await expect(tasklets.batch(null)).rejects.toThrow('Task configurations must be an array');
    });

    test('should reject invalid task configuration', async () => {
      const taskConfigs = [
        { name: 'invalid', task: 123 } // 123 is invalid, string is valid
      ];

      await expect(tasklets.batch(taskConfigs)).rejects.toThrow('Each task configuration must have a task function');
    });
  });

  describe('retry() function', () => {
    test('should retry failed tasks', async () => {
      await expect(tasklets.retry(() => {
        throw new Error('Test error');
      }, {
        attempts: 3,
        delay: 100,
        backoff: 2
      })).rejects.toThrow('Test error');
    });

    test('should use default retry options', async () => {
      const result = await tasklets.retry(() => {
        return 42;
      });
      expect(result).toBe(42);
    });

    test('should succeed on first attempt', async () => {
      const result = await tasklets.retry(() => {
        return 'success';
      }, {
        attempts: 3,
        delay: 100
      });
      expect(result).toBe('success');
    });

    test('should handle custom retry parameters', async () => {
      const result = await tasklets.retry(() => {
        return 'success';
      }, {
        attempts: 5,
        delay: 50,
        backoff: 1.5
      });
      expect(result).toBe('success');
    });

    test('should handle retry with timeout', async () => {
      const result = await tasklets.retry(() => {
        return 'success';
      }, {
        attempts: 2,
        delay: 100,
        timeout: 1000
      });
      expect(result).toBe('success');
    });
  });

  describe('performance characteristics', () => {
    test('should demonstrate parallel execution benefits', async () => {
      const sequentialStart = Date.now();
      await tasklets.run(() => {
        let sum = 0;
        for (let i = 0; i < 100000; i++) {
          sum += i;
        }
        return sum;
      });
      const sequentialTime = Date.now() - sequentialStart;

      const parallelStart = Date.now();
      const tasks = Array.from({ length: 4 }, () => () => {
        let sum = 0;
        for (let i = 0; i < 25000; i++) {
          sum += i;
        }
        return sum;
      });
      await tasklets.runAll(tasks);
      const parallelTime = Date.now() - parallelStart;

      // Note: This test verifies the structure works, actual performance depends on native module
      expect(sequentialTime).toBeGreaterThan(0);
      expect(parallelTime).toBeGreaterThan(0);
    });
  });
}); 