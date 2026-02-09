const tasklets = require('./lib/index');

console.log('Testing Phase 1 Optimizations...\n');

async function test() {
    try {
        // Test 1: Simple task with run()
        console.log('Test 1: Simple task with run()');
        const result1 = await tasklets.run(() => {
            return 42;
        });
        console.log('✓ Result:', result1);
        console.assert(result1 === 42, 'Expected 42');

        // Test 2: Simple task with runFast()
        console.log('\nTest 2: Simple task with runFast()');
        const result2 = await tasklets.runFast(() => {
            return 'hello';
        });
        console.log('✓ Result:', result2);
        console.assert(result2 === 'hello', 'Expected hello');

        // Test 3: CPU-intensive task
        console.log('\nTest 3: CPU-intensive task');
        const result3 = await tasklets.run(() => {
            let sum = 0;
            for (let i = 0; i < 1000000; i++) {
                sum += i;
            }
            return sum;
        });
        console.log('✓ Result:', result3);
        console.assert(result3 === 499999500000, 'Expected 499999500000');

        // Test 4: runAll
        console.log('\nTest 4: runAll with multiple tasks');
        const results4 = await tasklets.runAll([
            () => 1,
            () => 2,
            () => 3
        ]);
        console.log('✓ Results:', results4);
        console.assert(JSON.stringify(results4) === JSON.stringify([1, 2, 3]), 'Expected [1,2,3]');

        console.log('\n✅ All tests passed!');
        await tasklets.shutdown();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        await tasklets.shutdown();
        process.exit(1);
    }
}

test();
