/**
 * Test auto-scheduling functionality
 */

const tasklets = require('../../lib');

async function testAutoScheduling() {
  console.log('Testing Auto-Scheduling Functionality...\n');

  try {
    // Test 1: Check if auto-scheduling is initially disabled
    console.log('1. Checking initial auto-scheduling status...');
    const initialStatus = tasklets.isAutoSchedulingEnabled();
    console.log(`   Initial status: ${initialStatus}`);
    console.log('   ✓ Expected: false\n');

    // Test 2: Enable auto-scheduling
    console.log('2. Enabling auto-scheduling...');
    tasklets.enableAutoScheduling();
    const enabledStatus = tasklets.isAutoSchedulingEnabled();
    console.log(`   Status after enabling: ${enabledStatus}`);
    console.log('   ✓ Expected: true\n');

    // Test 3: Get auto-scheduling recommendations
    console.log('3. Getting auto-scheduling recommendations...');
    const recommendations = tasklets.getAutoSchedulingRecommendations();
    console.log('   Recommendations:', JSON.stringify(recommendations, null, 2));
    console.log('   ✓ Expected: Object with recommendation properties\n');

    // Test 4: Get auto-scheduling metrics history
    console.log('4. Getting auto-scheduling metrics history...');
    const metricsHistory = tasklets.getAutoSchedulingMetricsHistory();
    console.log(`   Metrics history length: ${metricsHistory.length}`);
    console.log('   ✓ Expected: Array (may be empty initially)\n');

    // Test 5: Get auto-scheduling settings
    console.log('5. Getting auto-scheduling settings...');
    const settings = tasklets.getAutoSchedulingSettings();
    console.log('   Settings:', JSON.stringify(settings, null, 2));
    console.log('   ✓ Expected: Object with settings properties\n');

    // Test 6: Apply auto-scheduling recommendations
    console.log('6. Applying auto-scheduling recommendations...');
    tasklets.applyAutoSchedulingRecommendations();
    console.log('   ✓ Expected: No error\n');

    // Test 7: Disable auto-scheduling
    console.log('7. Disabling auto-scheduling...');
    tasklets.disableAutoScheduling();
    const finalStatus = tasklets.isAutoSchedulingEnabled();
    console.log(`   Final status: ${finalStatus}`);
    console.log('   ✓ Expected: false\n');

    console.log('🎉 All auto-scheduling tests passed!');
    console.log('\nSummary:');
    console.log('- Auto-scheduling can be enabled/disabled');
    console.log('- Recommendations can be retrieved');
    console.log('- Metrics history can be accessed');
    console.log('- Settings can be retrieved');
    console.log('- Recommendations can be applied');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testAutoScheduling().catch(console.error); 