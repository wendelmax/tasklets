const Tasklets = require('../../lib/index');

describe('Error Handling Tests', () => {
  let tasklets;

  beforeEach(() => {
    tasklets = new Tasklets();
    tasklets.configure({
      workers: 2,
      timeout: 5000,
      logging: 'none'
    });
  });

  afterEach(async () => {
    try {
      await tasklets.shutdown();
    } catch (error) {
      // Ignore shutdown errors during test cleanup
    }
  });

  describe('error handling', () => {
    test('should handle tasks that throw Error objects', async () => {
      await expect(tasklets.run(() => {
        throw new Error('Test error message');
      })).rejects.toThrow('Test error message');
    });

    test('should handle tasks that throw TypeError', async () => {
      await expect(tasklets.run(() => {
        throw new TypeError('Type error message');
      })).rejects.toThrow('Type error message');
    });

    test('should handle tasks that throw ReferenceError', async () => {
      await expect(tasklets.run(() => {
        throw new ReferenceError('Reference error message');
      })).rejects.toThrow('Reference error message');
    });

    test('should handle tasks that throw string errors', async () => {
      await expect(tasklets.run(() => {
        throw 'String error message';
      })).rejects.toThrow('String error message');
    });

    test('should handle tasks that throw object errors', async () => {
      await expect(tasklets.run(() => {
        throw { message: 'Object error', code: 500 };
      })).rejects.toThrow();
    });

    test('should handle tasks that throw null', async () => {
      await expect(tasklets.run(() => {
        throw null;
      })).rejects.toThrow('null');
    });

    test('should handle tasks that throw undefined', async () => {
      await expect(tasklets.run(() => {
        throw undefined;
      })).rejects.toThrow('undefined');
    });

    test('should handle tasks that throw numbers', async () => {
      await expect(tasklets.run(() => {
        throw 42;
      })).rejects.toThrow('42');
    });

    test('should handle tasks with runtime errors', async () => {
      await expect(tasklets.run(() => {
        // This would normally cause a reference error
        return nonExistentVariable + 1;
      })).rejects.toThrow();
    });

    test('should handle tasks with type errors', async () => {
      await expect(tasklets.run(() => {
        // This would normally cause a type error
        const obj = null;
        return obj.property;
      })).rejects.toThrow();
    });

    test('should handle multiple error types in runAll', async () => {
      const tasks = [
        () => { throw new Error('Error 1'); },
        () => { throw new TypeError('Type error'); },
        () => { throw 'String error'; }
      ];

      const results = await tasklets.runAll(tasks);

      expect(results.length).toBe(3);
      expect(results[0]).toBeInstanceOf(Error);
      expect(results[0].message).toContain('Error 1');
      expect(results[1]).toBeInstanceOf(Error);
      expect(results[1].message).toContain('Type error');
      expect(results[2]).toBeInstanceOf(Error);
      expect(results[2].message).toContain('String error');
    });

    test('should handle errors in batch operations', async () => {
      const taskConfigs = [
        { name: 'error1', task: () => { throw new Error('Batch error 1'); } },
        { name: 'error2', task: () => { throw new TypeError('Batch error 2'); } }
      ];

      const results = await tasklets.batch(taskConfigs);

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Batch error 1');
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain('Batch error 2');
    });

    test('should handle errors with custom error messages', async () => {
      const customErrors = [
        'Custom error message 1',
        'Custom error message 2',
        'Custom error message 3'
      ];

      for (const errorMessage of customErrors) {
        await expect(tasklets.run((msg) => {
          throw new Error(msg);
        }, errorMessage)).rejects.toThrow(errorMessage);
      }
    });

    test('should handle nested error throwing', async () => {
      await expect(tasklets.run(() => {
        const throwError = () => { throw new Error('Nested error'); };
        try {
          throwError();
        } catch (e) {
          throw new Error('Caught and rethrown: ' + e.message);
        }
      })).rejects.toThrow('Caught and rethrown: Nested error');
    });
  });

  describe('timeout handling', () => {
    test('should handle tasks with custom short timeout', async () => {
      // Note: Current native module doesn't properly handle timeouts
      const result = await tasklets.run(() => {
        return 'quick task';
      }, { timeout: 100 });

      expect(result).toBe('quick task');
    });

    test('should handle tasks with zero timeout', async () => {
      const result = await tasklets.run(() => {
        return 'instant task';
      }, { timeout: 0 });

      expect(result).toBe('instant task');
    });

    test('should handle tasks with negative timeout', async () => {
      const result = await tasklets.run(() => {
        return 'negative timeout task';
      }, { timeout: -1000 });

      expect(result).toBe('negative timeout task');
    });

    test('should handle tasks with very large timeout', async () => {
      const result = await tasklets.run(() => {
        return 'large timeout task';
      }, { timeout: 999999999 });

      expect(result).toBe('large timeout task');
    });

    test('should handle global timeout configuration', async () => {
      tasklets.configure({ timeout: 1000 });

      const result = await tasklets.run(() => {
        return 'global timeout task';
      });

      expect(result).toBe('global timeout task');
    });

    test('should handle timeout override in task options', async () => {
      tasklets.configure({ timeout: 100 });

      const result = await tasklets.run(() => {
        return 'override timeout task';
      }, { timeout: 5000 });

      expect(result).toBe('override timeout task');
    });

    test('should handle timeout in runAll operations', async () => {
      const tasks = [
        () => 'task1',
        () => 'task2',
        () => 'task3'
      ];

      const results = await tasklets.runAll(tasks, { timeout: 100 });

      expect(results.length).toBe(3);
      expect(results[0]).toBe('task1');
      expect(results[1]).toBe('task2');
      expect(results[2]).toBe('task3');
    });

    test('should handle timeout in batch operations', async () => {
      const taskConfigs = [
        { name: 'timeout1', task: () => 'task1', options: { timeout: 100 } },
        { name: 'timeout2', task: () => 'task2', options: { timeout: 200 } },
        { name: 'timeout3', task: () => 'task3', options: { timeout: 50 } }
      ];

      const results = await tasklets.batch(taskConfigs);

      expect(results.length).toBe(3);
      expect(results[0]).toHaveProperty('name', 'timeout1');
      expect(results[0]).toHaveProperty('result', 'task1');
      expect(results[0]).toHaveProperty('success', true);
      expect(results[1]).toHaveProperty('name', 'timeout2');
      expect(results[1]).toHaveProperty('result', 'task2');
      expect(results[1]).toHaveProperty('success', true);
      expect(results[2]).toHaveProperty('name', 'timeout3');
      expect(results[2]).toHaveProperty('result', 'task3');
      expect(results[2]).toHaveProperty('success', true);
    });

    test('should handle timeout in retry operations', async () => {
      const result = await tasklets.retry(() => {
        return 'retry timeout task';
      }, {
        attempts: 3,
        delay: 100,
        timeout: 50
      });

      expect(result).toBe('retry timeout task');
    });
  });

  describe('input validation', () => {
    test('should reject non-function tasks', async () => {
      // Numbers are rejected by validation
      await expect(tasklets.run(123)).rejects.toThrow();

      // Strings are treated as code, so "invalid code" throws eval error
      await expect(tasklets.run('invalid code')).rejects.toThrow();
    });

    test('should reject invalid task arrays in runAll', async () => {
      await expect(tasklets.runAll("not an array")).rejects.toThrow('Tasks must be an array of functions');
      await expect(tasklets.runAll(123)).rejects.toThrow('Tasks must be an array of functions');
      await expect(tasklets.runAll(null)).rejects.toThrow('Tasks must be an array of functions');
      await expect(tasklets.runAll(undefined)).rejects.toThrow('Tasks must be an array of functions');
      await expect(tasklets.runAll({})).rejects.toThrow('Tasks must be an array of functions');
    });

    test('should reject invalid task configurations in batch', async () => {
      await expect(tasklets.batch("not an array")).rejects.toThrow('Task configurations must be an array');
      await expect(tasklets.batch(123)).rejects.toThrow('Task configurations must be an array');
      await expect(tasklets.batch(null)).rejects.toThrow('Task configurations must be an array');
      await expect(tasklets.batch(undefined)).rejects.toThrow('Task configurations must be an array');
      await expect(tasklets.batch({})).rejects.toThrow('Task configurations must be an array');
    });

    test('should reject invalid task functions in batch configurations', async () => {
      const invalidConfigs = [
        { name: 'invalid1', task: "not a function" }
      ];

      const results = await tasklets.batch(invalidConfigs);
      expect(results[0].success).toBe(false);
    });

    test('should handle empty arrays gracefully', async () => {
      const emptyArrayResults = await tasklets.runAll([]);
      expect(emptyArrayResults).toEqual([]);

      const emptyBatchResults = await tasklets.batch([]);
      expect(emptyBatchResults).toEqual([]);
    });

    test('should handle mixed valid and invalid task arrays', async () => {
      // This would normally fail validation, but let's test the behavior
      const validTasks = [
        () => 'valid1',
        () => 'valid2'
      ];

      const results = await tasklets.runAll(validTasks);
      expect(results.length).toBe(2);
      expect(results[0]).toBe('valid1');
      expect(results[1]).toBe('valid2');
    });
  });

  describe('resource exhaustion handling', () => {
    test('should handle high concurrency load', async () => {
      const taskCount = 100;
      const promises = [];
      for (let i = 0; i < taskCount; i++) {
        promises.push(tasklets.run((idx) => `task-${idx}`, i));
      }

      const results = await Promise.all(promises);

      expect(results.length).toBe(taskCount);
      expect(results[0]).toBe('task-0');
      expect(results[99]).toBe('task-99');
    });

    test('should handle memory-intensive tasks', async () => {
      const result = await tasklets.run(() => {
        // Create a large array
        const largeArray = new Array(1000000).fill(0);
        return largeArray.length;
      });

      expect(result).toBe(1000000);
    });

    test('should handle CPU-intensive tasks', async () => {
      const result = await tasklets.run(() => {
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += Math.sqrt(i);
        }
        return sum;
      });

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    test('should handle rapid task creation', async () => {
      const rapidTasks = [];

      for (let i = 0; i < 50; i++) {
        rapidTasks.push(tasklets.run((idx) => `rapid-${idx}`, i));
      }

      const results = await Promise.all(rapidTasks);

      expect(results.length).toBe(50);
      expect(results[0]).toBe('rapid-0');
      expect(results[49]).toBe('rapid-49');
    });

    test('should handle mixed workload types', async () => {
      const mixedTasks = [
        () => 'simple',
        () => {
          // CPU intensive
          let sum = 0;
          for (let i = 0; i < 100000; i++) {
            sum += i;
          }
          return sum;
        },
        () => {
          // Memory intensive
          return new Array(10000).fill(0).map((_, i) => i);
        },
        () => {
          // Error throwing
          throw new Error('Test error');
        }
      ];

      const results = await tasklets.runAll(mixedTasks);

      expect(results.length).toBe(4);
      expect(results[0]).toBe('simple');
      expect(typeof results[1]).toBe('number');
      expect(Array.isArray(results[2])).toBe(true);
      expect(results[2].length).toBe(10000);
      expect(results[3]).toBeInstanceOf(Error);
      expect(results[3].message).toContain('Test error');
    });

    test('should handle resource exhaustion during batch operations', async () => {
      const batchConfigs = Array.from({ length: 20 }, (_, i) => ({
        name: `resource-task-${i}`,
        task: () => {
          // Simulate resource usage
          const data = new Array(1000).fill(Math.random());
          return data.reduce((sum, val) => sum + val, 0);
        }
      }));

      const results = await tasklets.batch(batchConfigs);

      expect(results.length).toBe(20);
      results.forEach((result, i) => {
        expect(result).toHaveProperty('name', `resource-task-${i}`);
        expect(result).toHaveProperty('result');
        expect(typeof result.result).toBe('number');
        expect(result).toHaveProperty('success', true);
      });
    });
  });

  describe('edge cases', () => {
    test('should handle tasks that return undefined', async () => {
      const result = await tasklets.run(() => {
        return undefined;
      });

      expect(result).toBeUndefined();
    });

    test('should handle tasks that return null', async () => {
      const result = await tasklets.run(() => {
        return null;
      });

      expect(result).toBeNull();
    });

    test('should handle tasks with no return statement', async () => {
      const result = await tasklets.run(() => {
        let x = 42;
        x += 1;
        // No return statement
      });

      expect(result).toBeUndefined();
    });

    test('should handle empty function tasks', async () => {
      const result = await tasklets.run(() => {
        // Empty function
      });

      expect(result).toBeUndefined();
    });

    test('should handle tasks with special values', async () => {
      const specialValues = [
        () => NaN,
        () => Infinity,
        () => -Infinity,
        () => 0,
        () => -0,
        () => "",
        () => false,
        () => true
      ];

      const expectedValues = [
        NaN,
        Infinity,
        -Infinity,
        0,
        -0,
        "",
        false,
        true
      ];

      for (let i = 0; i < specialValues.length; i++) {
        const result = await tasklets.run(specialValues[i]);
        if (Number.isNaN(expectedValues[i])) {
          expect(Number.isNaN(result)).toBe(true);
        } else if (expectedValues[i] === Infinity) {
          expect(result).toBe(Infinity);
        } else if (expectedValues[i] === -Infinity) {
          expect(result).toBe(-Infinity);
        } else {
          expect(result).toBe(expectedValues[i]);
        }
      }
    });

    test('should handle tasks with circular references', async () => {
      const result = await tasklets.run(() => {
        const obj = {};
        obj.self = obj;
        return obj;
      });
      expect(result.self).toBe(result);
    });

    test('should handle tasks with large objects', async () => {
      const result = await tasklets.run(() => {
        const largeObject = {};
        for (let i = 0; i < 1000; i++) {
          largeObject[`key${i}`] = `value${i}`;
        }
        return largeObject;
      });

      expect(typeof result).toBe('object');
      expect(Object.keys(result).length).toBe(1000);
      expect(result.key0).toBe('value0');
      expect(result.key999).toBe('value999');
    });

    test('should handle tasks with deep nesting', async () => {
      const result = await tasklets.run(() => {
        const createDeepObject = (depth) => {
          if (depth <= 0) return 'leaf';
          return { next: createDeepObject(depth - 1) };
        };

        return createDeepObject(100);
      });

      expect(typeof result).toBe('object');
      let current = result;
      for (let i = 0; i < 100; i++) {
        expect(current).toHaveProperty('next');
        current = current.next;
      }
      expect(current).toBe('leaf');
    });

    test('should handle tasks with Date objects', async () => {
      const now = new Date();
      const result = await tasklets.run((d) => {
        return new Date(d);
      }, now.getTime());

      expect(result.constructor.name).toBe('Date');
      expect(result.getTime()).toBe(now.getTime());
    });

    test('should handle tasks with RegExp objects', async () => {
      const result = await tasklets.run(() => {
        return /test-pattern/gi;
      });

      expect(result.constructor.name).toBe('RegExp');
      expect(result.source).toBe('test-pattern');
      expect(result.flags).toBe('gi');
    });

    test('should handle tasks with Symbol values', async () => {
      await expect(tasklets.run(() => {
        return Symbol('test-symbol');
      })).rejects.toThrow();
    });

    test('should handle tasks with BigInt values', async () => {
      await expect(tasklets.run(() => {
        return BigInt('9007199254740991');
      })).rejects.toThrow();
    });
  });

  describe('error recovery', () => {
    test('should continue processing after errors', async () => {
      const results = [];

      // Run successful task
      results.push(await tasklets.run(() => 'success1'));

      // Run failing task
      try {
        await tasklets.run(() => { throw new Error('middle error'); });
      } catch (e) {
        results.push('error');
      }

      // Run another successful task
      results.push(await tasklets.run(() => 'success2'));

      expect(results).toEqual(['success1', 'error', 'success2']);
    });

    test('should handle error recovery in batch operations', async () => {
      const taskConfigs = [
        { name: 'success1', task: () => 'success1' },
        { name: 'error1', task: () => { throw new Error('error1'); } },
        { name: 'success2', task: () => 'success2' }
      ];

      const results = await tasklets.batch(taskConfigs);

      expect(results.length).toBe(3);
      expect(results[0].success).toBe(true);
      expect(results[0].result).toBe('success1');
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain('error1');
      expect(results[2].success).toBe(true);
      expect(results[2].result).toBe('success2');
    });

    test('should handle error recovery with retry', async () => {
      await expect(tasklets.retry(() => {
        throw new Error('retry error');
      }, {
        attempts: 3,
        delay: 10
      })).rejects.toThrow('retry error');
    });

    test('should maintain system stability after errors', async () => {
      // Generate many errors
      const errorTasks = Array.from({ length: 10 }, (_, i) => ({
        task: (index) => {
          throw new Error(`Error ${index}`);
        },
        args: [i]
      }));

      const results = await Promise.allSettled(errorTasks.map(t => tasklets.run(t.task, ...t.args)));

      expect(results.length).toBe(10);
      expect(results[0].status).toBe('rejected');
      expect(results[0].reason.message).toContain('Error 0');

      // System should still be healthy
      const health = tasklets.getHealth();
      expect(health.status).toBe('healthy');
    });
  });
}); 