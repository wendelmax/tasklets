const Benchmark = require('benchmark');
const tasklets = require('../lib/tasklets');

const suite = new Benchmark.Suite('Overhead');

// Função de Fibonacci para simular uma tarefa que consome CPU
function fibonacci(n) {
  if (n < 2) return n;
  return fibonacci(n - 2) + fibonacci(n - 1);
}

console.log('--- Comparando tasklets vs. execução nativa (Overhead) ---');

tasklets.config({
  workers: 1, // Usar 1 worker para uma comparação mais direta
  logging: 'off',
});

suite
  .add('Native JS execution (fibonacci)', () => {
    fibonacci(20);
  })
  .add('tasklets.run(fibonacci)', {
    defer: true,
    fn: async (deferred) => {
      await tasklets.run(() => fibonacci(20));
      deferred.resolve();
    },
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log(`\nFastest is ${this.filter('fastest').map('name')}`);

    let nativeBenchmark, taskletBenchmark;
    for (let i = 0; i < this.length; i++) {
        const bench = this[i];
        if (bench.name.startsWith('Native')) {
            nativeBenchmark = bench;
        } else if (bench.name.startsWith('tasklets')) {
            taskletBenchmark = bench;
        }
    }

    if (nativeBenchmark && taskletBenchmark) {
        const nativeTime = nativeBenchmark.stats.mean;
        const taskletTime = taskletBenchmark.stats.mean;
        const overhead = ((taskletTime - nativeTime) / nativeTime) * 100;
        
        console.log(`Overhead: ${overhead.toFixed(2)}%`);
    } else {
        console.error('Could not find benchmarks to compare for overhead.');
    }
    
    tasklets.shutdown();
  })
  .on('error', (event) => {
    console.error('Benchmark error:', event.target.error);
    tasklets.shutdown();
  })
  .run({ async: true }); 