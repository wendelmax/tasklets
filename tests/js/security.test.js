const Tasklets = require('../../lib/index');
const path = require('path');

describe('Security Monitoring Tests', () => {
    let tasklets;
    const dummyModulePath = path.join(__dirname, 'dummy-module.cjs').replace(/\\/g, '/');

    afterEach(async () => {
        if (tasklets) {
            await tasklets.shutdown();
        }
    });

    test('should allow loading module when in allowlist', async () => {
        tasklets = new Tasklets({
            allowedModules: [dummyModulePath],
            logging: 'none'
        });

        const result = await tasklets.run(`MODULE:${dummyModulePath}`, 10, 20);
        expect(result).toBe(30);
    });

    test('should deny loading module when not in allowlist', async () => {
        tasklets = new Tasklets({
            allowedModules: ['/path/to/some-other-module.js'],
            logging: 'none'
        });

        await expect(tasklets.run(`MODULE:${dummyModulePath}`, 10, 20))
            .rejects.toThrow('Module loading denied');
    });

    test('should allow loading any module if no allowlist is provided (backward compatibility)', async () => {
        tasklets = new Tasklets({
            logging: 'none'
        });

        const result = await tasklets.run(`MODULE:${dummyModulePath}`, 5, 5);
        expect(result).toBe(10);
    });
});
