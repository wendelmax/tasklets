const Tasklets = require('../../lib/index');
const os = require('os');

describe('Tasklets v2.2 Feature Validation', () => {
    let tasklets;

    afterEach(async () => {
        if (tasklets) {
            await tasklets.shutdown();
        }
        jest.restoreAllMocks();
    });

    describe('Argument Validation', () => {
        beforeEach(() => {
            tasklets = new Tasklets({ logging: 'none' });
        });

        test('should reject functions passed as arguments to run()', async () => {
            const myTask = (val) => val;
            const invalidArg = () => { };

            await expect(tasklets.run(myTask, invalidArg))
                .rejects.toThrow('Argument at index 0 is a function');
        });

        test('should reject symbols passed as arguments to run()', async () => {
            const myTask = (val) => val;
            const invalidArg = Symbol('foo');

            await expect(tasklets.run(myTask, invalidArg))
                .rejects.toThrow('Argument at index 0 is a Symbol');
        });
    });

    describe('maxMemory Functional Blocking', () => {
        test('should block worker spawning when memory limit is exceeded', async () => {
            // Mock OS memory
            // Total: 1000, Free: 100 (90% used)
            jest.spyOn(os, 'totalmem').mockReturnValue(1000);
            jest.spyOn(os, 'freemem').mockReturnValue(100);

            tasklets = new Tasklets({
                maxMemory: 80, // Limit at 80% usage
                logging: 'warn',
                maxWorkers: 2
            });

            // Spy on console.warn to verify logging
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

            // Try to run a task. Since it's the first task, it would normally spawn a worker.
            // But since memory is 90% and limit is 80%, it should block and queue the task.
            const promise = tasklets.run(() => 'should be queued');

            // Check stats
            const stats = tasklets.getStats();
            expect(stats.totalWorkers).toBe(0); // No worker spawned
            expect(stats.queuedTasks).toBe(1);  // Task sits in queue

            // Verify warning message
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('[tasklets:warn]'),
                expect.stringContaining('Memory limit reached (90.0% / 80%)')
            );

            // Cleanup
            warnSpy.mockRestore();
        });

        test('should allow worker spawning when memory is within limits', async () => {
            // Mock OS memory
            // Total: 1000, Free: 500 (50% used)
            jest.spyOn(os, 'totalmem').mockReturnValue(1000);
            jest.spyOn(os, 'freemem').mockReturnValue(500);

            tasklets = new Tasklets({
                maxMemory: 80,
                logging: 'none'
            });

            await tasklets.run(() => 'success');

            const stats = tasklets.getStats();
            expect(stats.totalWorkers).toBe(1);
        });
    });
});
