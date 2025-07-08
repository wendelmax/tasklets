/**
 * @file url-fetching.js
 * @description This example demonstrates parallel URL fetching and analysis using Tasklets.
 * It includes the following functionalities:
 * - A function to fetch a single URL with timeout handling.
 * - A function to fetch multiple URLs in parallel using `tasklets.runAll()`.
 * - A benchmarking function to test the performance of fetching URLs over multiple iterations.
 * - Parallel analysis of the fetched responses, including response times, status codes, and data sizes.
 * This example is a good demonstration of how to handle I/O-bound tasks concurrently.
 */
const tasklets = require('../../lib/tasklets');
const https = require('https');
const http = require('http');

console.log('Tasklets - Parallel URL Fetching Example\n');

function fetchUrl(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;

        const startTime = Date.now();

        const request = client.get(url, (response) => {
            let data = '';
            let dataLength = 0;

            response.on('data', chunk => {
                data += chunk;
                dataLength += chunk.length;
            });

            response.on('end', () => {
                const endTime = Date.now();
                resolve({
                    url,
                    status: response.statusCode,
                    headers: response.headers,
                    dataLength,
                    responseTime: endTime - startTime,
                    data: data.substring(0, 500), // First 500 chars
                    success: response.statusCode >= 200 && response.statusCode < 300
                });
            });
        });

        request.on('error', (error) => {
            reject({
                url,
                error: error.message,
                success: false,
                responseTime: Date.now() - startTime
            });
        });

        request.setTimeout(timeout, () => {
            request.abort();
            reject({
                url,
                error: 'Request timeout',
                success: false,
                responseTime: timeout
            });
        });
    });
}

async function fetchMultipleUrls(urls) {
    console.log(`Fetching ${urls.length} URLs in parallel...`);
    const startTime = Date.now();

    const results = await Promise.allSettled(
        urls.map(url => tasklets.run(() => fetchUrl(url)))
    );

    const endTime = Date.now();

    console.log(`Completed all requests in ${endTime - startTime}ms`);

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success);

    console.log(`Successful: ${successful.length}, Failed: ${failed.length}`);

    return {
        successful: successful.map(r => r.value),
        failed: failed.map(r => r.status === 'rejected' ? r.reason : r.value),
        totalTime: endTime - startTime
    };
}

async function benchmarkUrls(urls, iterations = 3) {
    console.log(`\nBenchmarking ${urls.length} URLs with ${iterations} iterations...`);

    const benchmarks = [];

    for (let i = 0; i < iterations; i++) {
        console.log(`  Iteration ${i + 1}/${iterations}`);
        const result = await fetchMultipleUrls(urls);
        benchmarks.push(result);

        if (i < iterations - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    const avgTime = benchmarks.reduce((sum, b) => sum + b.totalTime, 0) / benchmarks.length;
    const avgSuccessful = benchmarks.reduce((sum, b) => sum + b.successful.length, 0) / benchmarks.length;
    const avgFailed = benchmarks.reduce((sum, b) => sum + b.failed.length, 0) / benchmarks.length;

    console.log('\nBenchmark Results:');
    console.log(`  Average time: ${avgTime.toFixed(2)}ms`);
    console.log(`  Average successful: ${avgSuccessful.toFixed(1)}`);
    console.log(`  Average failed: ${avgFailed.toFixed(1)}`);
    console.log(`  Success rate: ${((avgSuccessful / (avgSuccessful + avgFailed)) * 100).toFixed(1)}%`);

    return benchmarks;
}

async function analyzeResponses(responses) {
    console.log('\nAnalyzing responses in parallel...');

    const analysisPromises = [
        // Response time analysis
        () => {
            const times = responses.map(r => r.responseTime);
            const sorted = times.sort((a, b) => a - b);

            return {
                analysis: 'response-times',
                min: Math.min(...times),
                max: Math.max(...times),
                avg: times.reduce((sum, t) => sum + t, 0) / times.length,
                median: sorted[Math.floor(sorted.length / 2)],
                p95: sorted[Math.floor(sorted.length * 0.95)]
            };
        },

        // Status code analysis
        () => {
            const statusCounts = {};
            responses.forEach(r => {
                statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
            });

            return {
                analysis: 'status-codes',
                distribution: statusCounts,
                total: responses.length
            };
        },

        // Data size analysis
        () => {
            const sizes = responses.map(r => r.dataLength);
            const totalSize = sizes.reduce((sum, s) => sum + s, 0);

            return {
                analysis: 'data-sizes',
                totalBytes: totalSize,
                avgBytes: totalSize / sizes.length,
                minBytes: Math.min(...sizes),
                maxBytes: Math.max(...sizes),
                totalMB: (totalSize / 1024 / 1024).toFixed(2)
            };
        },

        // Content type analysis
        () => {
            const contentTypes = {};
            responses.forEach(r => {
                const contentType = r.headers['content-type'] || 'unknown';
                const mainType = contentType.split(';')[0].trim();
                contentTypes[mainType] = (contentTypes[mainType] || 0) + 1;
            });

            return {
                analysis: 'content-types',
                distribution: contentTypes
            };
        }
    ];

    const analysisResults = await tasklets.runAll(analysisPromises);

    console.log('\nResponse Analysis:');
    analysisResults.forEach(result => {
        console.log(`\n${result.analysis}:`);
        Object.entries(result).forEach(([key, value]) => {
            if (key !== 'analysis') {
                if (typeof value === 'object') {
                    console.log(`  ${key}:`);
                    Object.entries(value).forEach(([subKey, subValue]) => {
                        console.log(`  ${subKey}: ${subValue}`);
                    });
                } else {
                    console.log(`  ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`);
                }
            }
        });
    });
}

// Run the example
(async () => {
    try {
        // Test URLs
        const urls = [
            'https://httpbin.org/delay/1',
            'https://httpbin.org/delay/2',
            'https://httpbin.org/json',
            'https://httpbin.org/uuid',
            'https://httpbin.org/user-agent',
            'https://httpbin.org/headers',
            'https://httpbin.org/ip',
            'https://httpbin.org/status/200',
            'https://httpbin.org/status/404',
            'https://httpbin.org/gzip'
        ];

        console.log('Testing URLs:');
        urls.forEach((url, index) => {
            console.log(`  ${index + 1}. ${url}`);
        });

        // Fetch all URLs
        const result = await fetchMultipleUrls(urls);

        console.log('\nDetailed Results:');
        result.successful.forEach((response, index) => {
            console.log(`\nSuccessful ${index + 1}:`);
            console.log(`  URL: ${response.url}`);
            console.log(`  Status: ${response.status}`);
            console.log(`  Response Time: ${response.responseTime}ms`);
            console.log(`  Data Length: ${response.dataLength} bytes`);
            console.log(`  Content Type: ${response.headers['content-type'] || 'unknown'}`);
        });

        if (result.failed.length > 0) {
            console.log('\nFailed Requests:');
            result.failed.forEach((failure, index) => {
                console.log(`\nFailed ${index + 1}:`);
                console.log(`  URL: ${failure.url}`);
                console.log(`  Error: ${failure.error}`);
                console.log(`  Response Time: ${failure.responseTime}ms`);
            });
        }

        // Analyze successful responses
        if (result.successful.length > 0) {
            await analyzeResponses(result.successful);
        }

        // Run benchmark
        await benchmarkUrls(urls.slice(0, 5), 2);

        console.log('\nURL fetching example completed!');
    } catch (error) {
        console.error('Error:', error.message);
    }
})(); 