const Benchmark = require('benchmark');
const tasklets = require('../lib/index');

console.log('=== Image Processing Simulation Benchmark ===\n');

tasklets.configure({
    workers: 'auto',
    logging: 'off',
});

// Simulate image processing (blur filter)
function applyBlurFilter(width, height) {
    const imageData = new Array(width * height * 4).fill(0);

    // Simulate blur calculation
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const idx = ((y + dy) * width + (x + dx)) * 4 + c;
                        sum += imageData[idx];
                    }
                }
                const idx = (y * width + x) * 4 + c;
                imageData[idx] = sum / 9;
            }
        }
    }
    return imageData;
}

const suite = new Benchmark.Suite();

suite
    .add('Native: Process 1 image (512x512)', () => {
        applyBlurFilter(512, 512);
    })
    .add('Tasklets: Process 1 image (512x512)', {
        defer: true,
        fn: async (deferred) => {
            await tasklets.run(() => applyBlurFilter(512, 512));
            deferred.resolve();
        },
    })
    .add('Native: Process 4 images sequentially (256x256)', () => {
        for (let i = 0; i < 4; i++) {
            applyBlurFilter(256, 256);
        }
    })
    .add('Tasklets: Process 4 images in parallel (256x256)', {
        defer: true,
        fn: async (deferred) => {
            await tasklets.runAll([
                () => applyBlurFilter(256, 256),
                () => applyBlurFilter(256, 256),
                () => applyBlurFilter(256, 256),
                () => applyBlurFilter(256, 256)
            ]);
            deferred.resolve();
        },
    })
    .on('cycle', (event) => {
        console.log(String(event.target));
    })
    .on('complete', function () {
        console.log('\n--- Results ---');

        const native1 = this[0];
        const tasklets1 = this[1];
        const native4 = this[2];
        const tasklets4 = this[3];

        if (native1 && tasklets1) {
            const overhead = ((tasklets1.stats.mean - native1.stats.mean) / native1.stats.mean * 100);
            console.log(`Single image overhead: ${overhead.toFixed(2)}%`);
        }

        if (native4 && tasklets4) {
            const speedup = (native4.stats.mean / tasklets4.stats.mean);
            console.log(`Parallel speedup (4 images): ${speedup.toFixed(2)}x`);
            console.log(`\nFastest for parallel: ${tasklets4.hz > native4.hz ? 'Tasklets ✓' : 'Native'}`);
        }

        tasklets.shutdown().then(() => {
            process.exit(0);
        });
    })
    .on('error', (event) => {
        console.error('Benchmark error:', event.target.error);
        tasklets.shutdown().then(() => {
            process.exit(1);
        });
    })
    .run({ async: true });
