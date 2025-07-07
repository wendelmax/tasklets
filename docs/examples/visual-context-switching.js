const tasklets = require('../../lib/tasklets');

(async () => {
  console.log('Tasklets - Visual Context Switching Demonstration\n');

  // Visual context switching tracker
  class VisualContextTracker {
  constructor() {
  this.switches = [];
  this.currentThread = null;
  this.startTime = Date.now();
  this.threadStates = new Map();
  this.executionTimeline = [];
  }

  logSwitch(fromThread, toThread, reason = 'yield') {
  const timestamp = Date.now() - this.startTime;

  // Update thread states
  if (fromThread) {
  this.threadStates.set(fromThread, { state: 'yielded', timestamp });
  }
  if (toThread) {
  this.threadStates.set(toThread, { state: 'running', timestamp });
  }

  this.currentThread = toThread;

  this.switches.push({
  timestamp,
  from: fromThread,
  to: toThread,
  reason
  });

  this.executionTimeline.push({
  timestamp,
  activeThread: toThread,
  reason
  });

  // Visual representation
  this.displayCurrentState(timestamp, fromThread, toThread, reason);
  }

  displayCurrentState(timestamp, fromThread, toThread, reason) {
  console.log(`\n  [${timestamp}ms] Context Switch`);
  console.log(`  ${fromThread || 'none'} → ${toThread || 'scheduler'} (${reason})`);

  // Show current thread states
  console.log('  Thread States:');
  for (const [thread, state] of this.threadStates.entries()) {
  const status = state.state === 'running' ? 'RUNNING' : 'YIELDED';
  const timeSince = timestamp - state.timestamp;
  console.log(`  ${status} ${thread}: ${state.state} (${timeSince}ms ago)`);
  }
  }

  displayTimeline() {
  console.log('\nExecution Timeline:');
  console.log('Time(ms) | Active Thread | Reason');
  console.log('---------|---------------|--------');

  this.executionTimeline.forEach((entry, index) => {
  const duration = index > 0 ? entry.timestamp - this.executionTimeline[index - 1].timestamp : 0;
  console.log(`${entry.timestamp.toString().padStart(7)} | ${entry.activeThread.padStart(13)} | ${entry.reason}`);
  if (duration > 0) {
  console.log(`  | (${duration}ms duration) |`);
  }
  });
  }

  getStats() {
  const totalSwitches = this.switches.length;
  const totalTime = Date.now() - this.startTime;

  // Calculate thread utilization
  const threadUtilization = {};
  for (const [thread, state] of this.threadStates.entries()) {
  threadUtilization[thread] = {
  totalTime: totalTime,
  state: state.state
  };
  }

  return {
  totalSwitches,
  totalTime,
  threadUtilization,
  switchesPerSecond: (totalSwitches / (totalTime / 1000)).toFixed(1)
  };
  }
  }

  // Global visual tracker
  const visualTracker = new VisualContextTracker();

  // Example 1: Visual round-robin demonstration
  console.log('1. Visual Round-Robin Context Switching:');
  console.log('  Watch how threads take turns executing\n');

  const visualResults = await tasklets.runAll(Array.from({ length: 3 }, (_, index) => async () => {
  const threadName = `Visual-${index}`;
  console.log(`\n  ${threadName} started`);

  for (let i = 0; i < 4; i++) {
  console.log(`\n  ${threadName} executing step ${i + 1}`);

  // Simulate work
  const workStart = Date.now();
  for (let j = 0; j < 5000; j++) {
  Math.sqrt(j);
  }
  const workTime = Date.now() - workStart;

  console.log(`  ${threadName} completed step ${i + 1} (${workTime}ms work)`);

  // Yield to next thread
  console.log(`  ${threadName} yielding control...`);
  visualTracker.logSwitch(threadName, 'scheduler', 'round-robin');
  await new Promise(resolve => setTimeout(resolve, 0));
  console.log(`  ${threadName} resumed execution`);
  }

  console.log(`\n  ${threadName} completed all steps`);
  return { thread: threadName, steps: 4 };
  }));

  console.log('\n  Visual round-robin results:', visualResults);

  // Example 2: Priority-based visual switching
  console.log('\n\n2. Priority-Based Visual Context Switching:');
  console.log('  High priority threads get more execution time\n');

  const priorityVisualResults = await tasklets.runAll(Array.from({ length: 3 }, (_, index) => async () => {
  const priorities = ['High', 'Medium', 'Low'];
  const threadName = `Priority-${priorities[index]}`;
  const configs = [
  { name: 'High', workUnits: 8000, yieldFreq: 1 },
  { name: 'Medium', workUnits: 5000, yieldFreq: 2 },
  { name: 'Low', workUnits: 2000, yieldFreq: 3 }
  ];

  const config = configs[index];
  console.log(`\n  ${threadName} started (${config.name} priority)`);

  let steps = 0;
  for (let i = 0; i < 6; i++) {
  steps++;

  console.log(`\n  ${threadName} executing step ${steps}`);

  // Simulate work based on priority
  const workStart = Date.now();
  for (let j = 0; j < config.workUnits; j++) {
  Math.sqrt(j);
  }
  const workTime = Date.now() - workStart;

  console.log(`  ${threadName} completed step ${steps} (${workTime}ms work)`);

  // Yield based on priority
  if (steps % config.yieldFreq === 0) {
  console.log(`  ${threadName} yielding (${config.name} priority)`);
  visualTracker.logSwitch(threadName, 'scheduler', `priority-${config.name.toLowerCase()}`);
  await new Promise(resolve => setTimeout(resolve, 0));
  console.log(`  ${threadName} resumed`);
  }
  }

  console.log(`\n  ${threadName} completed (${steps} steps)`);
  return { thread: threadName, priority: config.name, steps };
  }));

  console.log('\n  Priority visual results:', priorityVisualResults);

  // Example 3: Workload-based visual switching
  console.log('\n\n3. Workload-Based Visual Context Switching:');
  console.log('  Threads with different workloads cooperate\n');

  const workloadVisualResults = await tasklets.runAll(Array.from({ length: 4 }, (_, index) => async () => {
  const workloads = [
  { name: 'CPU-Heavy', workUnits: 10000, yieldFreq: 5000 },
  { name: 'I/O-Sim', workUnits: 2000, yieldFreq: 1000 },
  { name: 'Mixed', workUnits: 6000, yieldFreq: 3000 },
  { name: 'Light', workUnits: 1000, yieldFreq: 500 }
  ];

  const workload = workloads[index];
  const threadName = `Workload-${workload.name}`;

  console.log(`\n  ${threadName} started (${workload.name} workload)`);

  let totalWork = 0;
  for (let i = 0; i < workload.workUnits; i++) {
  // Simulate work
  totalWork += Math.sqrt(i);

  // Yield based on workload characteristics
  if (i % workload.yieldFreq === 0) {
  console.log(`  ${threadName} yielding (${workload.name} workload)`);
  visualTracker.logSwitch(threadName, 'scheduler', `workload-${workload.name.toLowerCase()}`);
  await new Promise(resolve => setTimeout(resolve, 0));
  console.log(`  ${threadName} resumed`);
  }
  }

  console.log(`\n  ${threadName} completed (${workload.name} workload, total work: ${totalWork.toFixed(2)})`);
  return { thread: threadName, workload: workload.name, totalWork };
  }));

  console.log('\n  Workload visual results:', workloadVisualResults);

  // Example 4: Interactive visual switching
  console.log('\n\n4. Interactive Visual Context Switching:');
  console.log('  Threads respond to external events\n');

  const interactiveVisualResults = await tasklets.runAll(Array.from({ length: 2 }, (_, index) => async () => {
  const threadName = `Interactive-${index}`;
  console.log(`\n  ${threadName} started`);

  for (let i = 0; i < 5; i++) {
  console.log(`\n  ${threadName} processing event ${i + 1}`);

  // Simulate event processing
  const workStart = Date.now();
  for (let j = 0; j < 3000; j++) {
  Math.sqrt(j);
  }
  const workTime = Date.now() - workStart;

  console.log(`  ${threadName} completed event ${i + 1} (${workTime}ms processing)`);

  // Simulate waiting for next event
  console.log(`  ${threadName} waiting for next event...`);
  visualTracker.logSwitch(threadName, 'scheduler', 'event-wait');
  await new Promise(resolve => setTimeout(resolve, 0));
  console.log(`  ${threadName} received next event`);
  }

  console.log(`\n  ${threadName} completed all events`);
  return { thread: threadName, events: 5 };
  }));

  console.log('\n  Interactive visual results:', interactiveVisualResults);

  // Display final statistics
  console.log('\n\n5. Visual Context Switching Statistics:');
  const stats = visualTracker.getStats();
  console.log(`  Total context switches: ${stats.totalSwitches}`);
  console.log(`  Total execution time: ${stats.totalTime}ms`);
  console.log(`  Switches per second: ${stats.switchesPerSecond}`);

  console.log('\n  Thread utilization:');
  for (const [thread, util] of Object.entries(stats.threadUtilization)) {
  console.log(`  ${thread}: ${util.state} (${util.totalTime}ms total)`);
  }

  // Display execution timeline
  visualTracker.displayTimeline();

  // Virtual threads performance
  console.log('\n6. Virtual Threads Performance:');
  const Taskletstats = tasklets.getStats();
  console.log(`  Total fibers created: ${Taskletstats.totalFibers}`);
  console.log(`  Active fibers: ${Taskletstats.activeFibers}`);
  console.log(`  Total execution time: ${Taskletstats.totalExecutionTimeMs}ms`);

  console.log('\nKey benefits demonstrated:');
  console.log('  • Visual context switching tracking');
  console.log('  • Round-robin scheduling visualization');
  console.log('  • Priority-based execution');
  console.log('  • Workload-aware cooperation');
  console.log('  • Interactive event processing');
  console.log('  • Real-time execution timeline');
  console.log('  • Comprehensive performance metrics');

  console.log('\nVisual context switching example completed!');
})(); 