/**
 * @file web-api-load-test.js
 * @description This example demonstrates how to use Tasklets to simulate a load test on a web API.
 * It defines an `APILoadTester` class that simulates multiple users making concurrent requests to a local server.
 * The `tasklets.runAll()` function is used to run the user simulations in parallel.
 * After the test, it analyzes and prints detailed results, including success rate, requests per second,
 * and response times for different API endpoints.
 *
 * NOTE: This example requires a local web server running on http://localhost:3000.
 * You can use the `docs/examples/web-api.js` example as a simple server for this test.
 */
const tasklets = require('../../lib/tasklets');

console.log('Tasklets - API Load Testing Example\n');

// Simulate multiple users making concurrent requests
class APILoadTester {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.results = [];
        this.startTime = null;
        this.endTime = null;
    }

    // Simulate a single user making requests
    async simulateUser(userId, requestCount = 5) {
        const userResults = [];

        for (let i = 0; i < requestCount; i++) {
            const requestStart = Date.now();

            try {
                // Simulate different types of requests
                const requestType = i % 4;
                let response;

                switch (requestType) {
                    case 0: // Get all users
                        response = await this.makeRequest('GET', '/users');
                        break;
                    case 1: // Get specific user
                        const targetUserId = Math.floor(Math.random() * 5) + 1;
                        response = await this.makeRequest('GET', `/users/${targetUserId}`);
                        break;
                    case 2: // Create new user
                        const newUser = {
                            name: `User ${userId}-${i}`,
                            age: 20 + Math.floor(Math.random() * 40),
                            email: `user${userId}-${i}@example.com`,
                            posts: Math.floor(Math.random() * 100),
                            followers: Math.floor(Math.random() * 5000)
                        };
                        response = await this.makeRequest('POST', '/users', newUser);
                        break;
                    case 3: // Get analytics
                        response = await this.makeRequest('GET', '/analytics');
                        break;
                }

                const requestTime = Date.now() - requestStart;
                userResults.push({
                    userId,
                    requestId: i,
                    type: requestType,
                    status: response.status,
                    time: requestTime,
                    success: response.status >= 200 && response.status < 300
                });

            } catch (error) {
                const requestTime = Date.now() - requestStart;
                userResults.push({
                    userId,
                    requestId: i,
                    type: requestType,
                    status: 0,
                    time: requestTime,
                    success: false,
                    error: error.message
                });
            }

            // Simulate user thinking time
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        }

        return userResults;
    }

    // Make HTTP request
    async makeRequest(method, path, body = null) {
        return new Promise((resolve, reject) => {
            const http = require('http');
            const url = require('url');

            const parsedUrl = url.parse(`${this.baseUrl}${path}`);
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.path,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (body) {
                const bodyString = JSON.stringify(body);
                options.headers['Content-Length'] = Buffer.byteLength(bodyString);
            }

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve({
                            status: res.statusCode,
                            data: response
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: data
                        });
                    }
                });
            });

            req.on('error', reject);

            if (body) {
                req.write(JSON.stringify(body));
            }

            req.end();
        });
    }

    // Run load test with multiple users
    async runLoadTest(userCount = 10, requestsPerUser = 5) {
        console.log(`Starting load test with ${userCount} users, ${requestsPerUser} requests each...`);
        console.log(`Total requests: ${userCount * requestsPerUser}\n`);

        this.startTime = Date.now();

        // Create tasklets for each user
        const allResults = await tasklets.runAll(
            Array.from({length: userCount}, (_, index) =>
                () => this.simulateUser(index + 1, requestsPerUser)
            )
        );

        this.endTime = Date.now();

        // Flatten results
        this.results = allResults.flat();

        return this.analyzeResults();
    }

    // Analyze test results
    analyzeResults() {
        const totalTime = this.endTime - this.startTime;
        const totalRequests = this.results.length;
        const successfulRequests = this.results.filter(r => r.success).length;
        const failedRequests = totalRequests - successfulRequests;

        const responseTimes = this.results.map(r => r.time);
        const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / totalRequests;
        const minResponseTime = Math.min(...responseTimes);
        const maxResponseTime = Math.max(...responseTimes);

        const requestsPerSecond = totalRequests / (totalTime / 1000);

        // Group by request type
        const requestTypes = {
            0: 'GET /users',
            1: 'GET /users/:id',
            2: 'POST /users',
            3: 'GET /analytics'
        };

        const typeStats = {};
        Object.keys(requestTypes).forEach(type => {
            const typeResults = this.results.filter(r => r.type === parseInt(type));
            if (typeResults.length > 0) {
                const typeTimes = typeResults.map(r => r.time);
                typeStats[requestTypes[type]] = {
                    count: typeResults.length,
                    avgTime: typeTimes.reduce((sum, time) => sum + time, 0) / typeResults.length,
                    successRate: typeResults.filter(r => r.success).length / typeResults.length * 100
                };
            }
        });

        return {
            summary: {
                totalTime,
                totalRequests,
                successfulRequests,
                failedRequests,
                successRate: (successfulRequests / totalRequests) * 100,
                requestsPerSecond,
                avgResponseTime,
                minResponseTime,
                maxResponseTime
            },
            typeStats,
            Taskletstats: tasklets.getStats()
        };
    }

    // Print detailed results
    printResults(results) {
        console.log('Load Test Results\n');

        const {summary, typeStats, Taskletstats} = results;

        console.log('Summary:');
        console.log(`  Total time: ${summary.totalTime}ms`);
        console.log(`  Total requests: ${summary.totalRequests}`);
        console.log(`  Successful: ${summary.successfulRequests}`);
        console.log(`  Failed: ${summary.failedRequests}`);
        console.log(`  Success rate: ${summary.successRate.toFixed(1)}%`);
        console.log(`  Requests per second: ${summary.requestsPerSecond.toFixed(1)}`);
        console.log(`  Average response time: ${summary.avgResponseTime.toFixed(1)}ms`);
        console.log(`  Min response time: ${summary.minResponseTime}ms`);
        console.log(`  Max response time: ${summary.maxResponseTime}ms\n`);

        console.log('Request Type Analysis:');
        Object.entries(typeStats).forEach(([type, stats]) => {
            console.log(`  ${type}:`);
            console.log(`  Count: ${stats.count}`);
            console.log(`  Avg time: ${stats.avgTime.toFixed(1)}ms`);
            console.log(`  Success rate: ${stats.successRate.toFixed(1)}%`);
        });
        console.log();

        console.log('🧵 Virtual Threads Performance:');
        console.log(`  Total fibers created: ${Taskletstats.totalFibers}`);
        console.log(`  Active fibers: ${Taskletstats.activeFibers}`);
        console.log(`  Total execution time: ${Taskletstats.totalExecutionTimeMs}ms`);
        console.log(`  Fibers per second: ${(Taskletstats.totalFibers / (Taskletstats.totalExecutionTimeMs / 1000)).toFixed(1)}`);
        console.log();

        // Performance comparison
        console.log('Performance Analysis:');
        const efficiency = (summary.requestsPerSecond / Taskletstats.totalFibers) * 100;
        console.log(`  Efficiency: ${efficiency.toFixed(1)} requests per fiber`);

        if (summary.avgResponseTime < 1000) {
            console.log(`  Excellent response times (avg: ${summary.avgResponseTime.toFixed(1)}ms)`);
        } else if (summary.avgResponseTime < 2000) {
            console.log(`  Good response times (avg: ${summary.avgResponseTime.toFixed(1)}ms)`);
        } else {
            console.log(`  High response times (avg: ${summary.avgResponseTime.toFixed(1)}ms)`);
        }

        if (summary.successRate > 95) {
            console.log(`  Excellent reliability (${summary.successRate.toFixed(1)}% success rate)`);
        } else if (summary.successRate > 90) {
            console.log(`  Good reliability (${summary.successRate.toFixed(1)}% success rate)`);
        } else {
            console.log(`  Poor reliability (${summary.successRate.toFixed(1)}% success rate)`);
        }
    }
}

// Example 1: Basic load test
console.log('1. Basic load test demonstration:');
console.log('  Simulates multiple users making concurrent API requests');
console.log('  Each user runs in a virtual thread for true concurrency\n');

// Example 2: Performance monitoring
console.log('2. Performance monitoring:');
console.log('  Tracks response times, success rates, and throughput');
console.log('  Monitors virtual thread usage and efficiency\n');

// Example 3: Request type analysis
console.log('3. Request type analysis:');
console.log('  Analyzes performance across different API endpoints');
console.log('  Identifies bottlenecks and optimization opportunities\n');

// Example 4: Scalability demonstration
console.log('4. Scalability demonstration:');
console.log('  Shows how virtual threads handle increasing load');
console.log('  Demonstrates efficient resource utilization\n');

// Run the load test
async function runLoadTestExample() {
    const tester = new APILoadTester();

    try {
        console.log('Starting API Load Test...\n');

        // Test with different user counts
        const testScenarios = [
            {users: 5, requests: 3, name: 'Light Load'},
            {users: 10, requests: 5, name: 'Medium Load'},
            {users: 20, requests: 3, name: 'Heavy Load'}
        ];

        for (const scenario of testScenarios) {
            console.log(`\n${scenario.name} Test (${scenario.users} users, ${scenario.requests} requests each)`);
            console.log('='.repeat(60));

            const results = await tester.runLoadTest(scenario.users, scenario.requests);
            tester.printResults(results);

            // Wait between tests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log('\nLoad testing completed!');

    } catch (error) {
        console.error('Load test failed:', error.message);
        console.log('\nMake sure the API server is running on http://localhost:3000');
        console.log('  Run: node examples/web-api.js');
    }
}

// Run the example
runLoadTestExample();

console.log('\nKey benefits demonstrated:');
console.log('  • True concurrent user simulation');
console.log('  • Non-blocking request handling');
console.log('  • Efficient resource utilization');
console.log('  • Comprehensive performance metrics');
console.log('  • Scalability analysis');
console.log('  • Real-world API testing scenarios\n'); 