const Benchmark = require('benchmark');
const tasklets = require('../lib/tasklets');

const suite = new Benchmark.Suite('run()');

// Função de Fibonacci para simular uma tarefa que consome CPU
function fibonacci(n) {
  if (n < 2) return n;
  return fibonacci(n - 2) + fibonacci(n - 1);
}

console.log('--- Preparando benchmarks para tasklets.run() ---');

// Configuração inicial do tasklets
tasklets.config({
  workers: 'auto',
  logging: 'off',
});

suite
  .add('run(simple task)', {
    defer: true,
    fn: async (deferred) => {
      await tasklets.run(() => 1 + 1);
      deferred.resolve();
    },
  })
  .add('run(cpu intensive task - fibonacci)', {
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
    tasklets.shutdown();
  })
  .on('error', (event) => {
    console.error('Benchmark error:', event.target.error);
    tasklets.shutdown();
  })
  .run({ async: true }); 