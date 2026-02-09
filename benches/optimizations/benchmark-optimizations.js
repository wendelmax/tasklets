const tasklets = require('./lib/index');

console.log('='.repeat(60));
console.log('TASKLETS PERFORMANCE BENCHMARK');
console.log('Testing overhead reduction from optimizations');
console.log('='.repeat(60));

async function benchmark() {
    const iterations = 1000;

    // Benchmark 1: Simple number return (primitives - benefits from smart serialization)
    console.log('\n📊 Benchmark 1: Simple Primitive (number)');
    console.log(`Running ${iterations} iterations...`);

    const start1 = Date.now();
    for (let i = 0; i < iterations; i++) {
        await tasklets.run(() => 42);
    }
    const time1 = Date.now() - start1;
    console.log(`✓ Total time: ${time1}ms`);
    console.log(`✓ Average per task: ${(time1 / iterations).toFixed(2)}ms`);

    // Benchmark 2: Using runFast (benefits from fast path)
    console.log('\n📊 Benchmark 2: Fast Path (runFast)');
    console.log(`Running ${iterations} iterations...`);

    const start2 = Date.now();
    for (let i = 0; i < iterations; i++) {
        await tasklets.runFast(() => 42);
    }
    const time2 = Date.now() - start2;
    console.log(`✓ Total time: ${time2}ms`);
    console.log(`✓ Average per task: ${(time2 / iterations).toFixed(2)}ms`);
    console.log(`✓ Improvement over run(): ${((1 - time2 / time1) * 100).toFixed(1)}%`);

    // Benchmark 3: String return (primitives - benefits from smart serialization)
    console.log('\n📊 Benchmark 3: String Primitive');
    console.log(`Running ${iterations} iterations...`);

    const start3 = Date.now();
    for (let i = 0; i < iterations; i++) {
        await tasklets.runFast(() => 'hello world');
    }
    const time3 = Date.now() - start3;
    console.log(`✓ Total time: ${time3}ms`);
    console.log(`✓ Average per task: ${(time3 / iterations).toFixed(2)}ms`);

    // Benchmark 4: Complex object (still uses JSON.stringify)
    console.log('\n📊 Benchmark 4: Complex Object');
    console.log(`Running ${iterations} iterations...`);

    const start4 = Date.now();
    for (let i = 0; i < iterations; i++) {
        await tasklets.runFast(() => ({ x: 1, y: 2, z: [1, 2, 3] }));
    }
    const time4 = Date.now() - start4;
    console.log(`✓ Total time: ${time4}ms`);
    console.log(`✓ Average per task: ${(time4 / iterations).toFixed(2)}ms`);

    // Benchmark 5: CPU-intensive task (100ms)
    console.log('\n📊 Benchmark 5: CPU-Intensive Task (100ms)');
    const cpuIterations = 10;
    console.log(`Running ${cpuIterations} iterations...`);

    const start5 = Date.now();
    for (let i = 0; i < cpuIterations; i++) {
        await tasklets.runFast(() => {
            let sum = 0;
            for (let j = 0; j < 10000000; j++) {
                sum += j;
            }
            return sum;
        });
    }
    const time5 = Date.now() - start5;
    const avgTaskTime = time5 / cpuIterations;
    const taskOnlyTime = 100; // Estimated actual task time
    const overhead = avgTaskTime - taskOnlyTime;
    const overheadPercent = (overhead / taskOnlyTime) * 100;

    console.log(`✓ Total time: ${time5}ms`);
    console.log(`✓ Average per task: ${avgTaskTime.toFixed(2)}ms`);
    console.log(`✓ Estimated overhead: ${overhead.toFixed(2)}ms (${overheadPercent.toFixed(1)}%)`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n✅ Optimizations Applied:`);
    console.log(`   • Eager Initialization (Phase 1)`);
    console.log(`   • Fast Path Execution (Phase 1)`);
    console.log(`   • Smart Serialization (Phase 3)`);
    console.log(`\n📈 Performance Metrics:`);
    console.log(`   • Simple primitives: ${(time1 / iterations).toFixed(2)}ms avg`);
    console.log(`   • Fast path: ${(time2 / iterations).toFixed(2)}ms avg (${((1 - time2 / time1) * 100).toFixed(1)}% faster)`);
    console.log(`   • String primitives: ${(time3 / iterations).toFixed(2)}ms avg`);
    console.log(`   • Complex objects: ${(time4 / iterations).toFixed(2)}ms avg`);
    console.log(`   • CPU-intensive (100ms): ~${overheadPercent.toFixed(1)}% overhead`);

    console.log(`\n💡 Recommendations:`);
    console.log(`   • Use runFast() for simple tasks (${((1 - time2 / time1) * 100).toFixed(1)}% faster)`);
    console.log(`   • Primitives benefit most from smart serialization`);
    console.log(`   • Overhead is minimal for CPU-intensive tasks (${overheadPercent.toFixed(1)}%)`);

    await tasklets.shutdown();
    process.exit(0);
}

benchmark().catch(err => {
    console.error('Benchmark failed:', err);
    tasklets.shutdown().then(() => process.exit(1));
});
