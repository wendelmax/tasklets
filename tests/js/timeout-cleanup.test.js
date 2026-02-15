const Tasklets = require('../../lib/index');

describe('Timeout and Cleanup Logic', () => {
    let tasklets;

    beforeEach(() => {
        tasklets = new Tasklets({
            maxWorkers: 2,
            timeout: 1000,
            logging: 'none'
        });
    });

    afterEach(async () => {
        if (tasklets) {
            await tasklets.shutdown();
        }
    });

    test('should reject task on timeout and clean up activeTasks', async () => {
        // A task that takes longer than the timeout (1000ms)
        const longTask = () => new Promise(resolve => setTimeout(() => resolve('done'), 2000));

        await expect(tasklets.run(longTask)).rejects.toThrow('Task timed out');

        // Check that activeTasks is empty
        const stats = tasklets.getStats();
        expect(stats.activeTasks).toBe(0);
    });

    test('should handle manual termination and reject tasks', async () => {
        const longTask = () => new Promise(resolve => setTimeout(() => resolve('done'), 5000));

        const promise = tasklets.run(longTask);

        // Simulate maintenance-like termination
        const stats = tasklets.getStats();
        const workerObj = tasklets.workerPool[0];

        if (workerObj) {
            tasklets._terminateWorker(workerObj);
        }

        await expect(promise).rejects.toThrow('Worker was terminated by Tasklets');

        expect(tasklets.getStats().activeTasks).toBe(0);
    });
});
