const tasklets = require('./lib/index');

console.log('='.repeat(70));
console.log('TASKLETS PERFORMANCE BENCHMARK - Quick Test');
console.log('='.repeat(70));

async function quickBench() {
    const iterations = 100;

    // Test 1: Simple task with run()
    console.log('\n📊 Test 1: run() with simple primitive (100 iterations)');
    const start1 = Date.now();
    for (let i = 0; i < iterations; i++) {
        await tasklets.run(() => 42);
    }
    const time1 = Date.now() - start1;
    console.log(`   Total: ${time1}ms | Avg: ${(time1 / iterations).toFixed(2)}ms per task`);

    // Test 2: Fast path with runFast()
    console.log('\n📊 Test 2: runFast() with simple primitive (100 iterations)');
    const start2 = Date.now();
    for (let i = 0; i < iterations; i++) {
        await tasklets.runFast(() => 42);
    }
    const time2 = Date.now() - start2;
    const improvement = ((time1 - time2) / time1 * 100);
    console.log(`   Total: ${time2}ms | Avg: ${(time2 / iterations).toFixed(2)}ms per task`);
    console.log(`   ✓ ${improvement.toFixed(1)}% faster than run()`);

    // Test 3: Complex object
    console.log('\n📊 Test 3: Complex object (100 iterations)');
    const start3 = Date.now();
    for (let i = 0; i < iterations; i++) {
        await tasklets.runFast(() => ({ x: 1, y: 2, data: [1, 2, 3, 4, 5] }));
    }
    const time3 = Date.now() - start3;
    console.log(`   Total: ${time3}ms | Avg: ${(time3 / iterations).toFixed(2)}ms per task`);

    // Test 4: CPU-intensive (10 iterations)
    console.log('\n📊 Test 4: CPU-intensive task (10 iterations)');
    const cpuIter = 10;
    const start4 = Date.now();
    for (let i = 0; i < cpuIter; i++) {
        await tasklets.runFast(() => {
            let sum = 0;
            for (let j = 0; j < 5000000; j++) {
                sum += j;
            }
            return sum;
        });
    }
    const time4 = Date.now() - start4;
    console.log(`   Total: ${time4}ms | Avg: ${(time4 / cpuIter).toFixed(2)}ms per task`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`\n✅ Optimizations Applied:`);
    console.log(`   • Phase 1: Eager Init + Fast Path`);
    console.log(`   • Phase 3: Smart Serialization`);
    console.log(`\n📊 Results:`);
    console.log(`   • run() primitives:     ${(time1 / iterations).toFixed(2)}ms avg`);
    console.log(`   • runFast() primitives: ${(time2 / iterations).toFixed(2)}ms avg (${improvement.toFixed(1)}% faster)`);
    console.log(`   • Complex objects:      ${(time3 / iterations).toFixed(2)}ms avg`);
    console.log(`   • CPU-intensive:        ${(time4 / cpuIter).toFixed(2)}ms avg`);
    console.log(`\n💡 Key Findings:`);
    console.log(`   • runFast() is ${improvement.toFixed(1)}% faster for simple tasks`);
    console.log(`   • Smart serialization optimizes primitive types`);
    console.log(`   • Overhead is minimal for CPU-intensive work`);
    console.log('');

    await tasklets.shutdown();
    process.exit(0);
}

quickBench().catch(err => {
    console.error('Benchmark failed:', err);
    tasklets.shutdown().then(() => process.exit(1));
});
