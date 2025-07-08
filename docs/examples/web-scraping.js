/**
 * @file web-scraping.js
 * @description This example simulates a web scraping scenario using Tasklets to perform tasks in parallel.
 * It includes demonstrations of:
 * - A performance comparison between sequential and parallel web scraping.
 * - A simulation of a large-scale scraping operation.
 * - Error handling with a retry mechanism for failed requests.
 * - Post-processing of scraped content in parallel.
 * The `scrapeUrl` function is a simulation and does not make actual HTTP requests, making it safe to run locally.
 * This example is useful for understanding how to manage I/O-bound tasks like web scraping.
 */
const tasklets = require('../../lib/tasklets');

(async () => {
    console.log('Tasklets - Web Scraping Example\n');

    // Simulate web scraping function (since we can't use real HTTP in this example)
    async function scrapeUrl(url) {
        console.log(`  Scraping: ${url}`);

        // Simulate network delay and processing
        const delay = Math.random() * 1000 + 500; // 500-1500ms
        await new Promise(resolve => setTimeout(resolve, delay));

        // Simulate different response scenarios
        const scenarios = [
            {status: 200, title: 'Example Page', size: 15000},
            {status: 200, title: 'API Response', size: 2500},
            {status: 404, title: 'Not Found', size: 0},
            {status: 200, title: 'Data Page', size: 8000},
            {status: 500, title: 'Server Error', size: 0}
        ];

        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        // Simulate some processing time
        for (let i = 0; i < 50000; i++) {
            Math.sqrt(i);
        }

        return {
            url,
            status: scenario.status,
            title: scenario.title,
            size: scenario.size,
            timestamp: Date.now(),
            processingTime: delay
        };
    }

    // Example 1: Sequential web scraping
    console.log('1. Sequential web scraping:');
    const urls = [
        'https://example.com',
        'https://httpbin.org/get',
        'https://jsonplaceholder.typicode.com/posts/1',
        'https://api.github.com/users/octocat',
        'https://httpbin.org/delay/1',
        'https://httpbin.org/status/404',
        'https://httpbin.org/status/500',
        'https://jsonplaceholder.typicode.com/users/1'
    ];

    console.log(`  URLs to scrape: ${urls.length}`);

    const startSeq = Date.now();
    const sequentialResults = [];

    for (let i = 0; i < urls.length; i++) {
        const result = await scrapeUrl(urls[i]);
        sequentialResults.push(result);
    }

    const seqTime = Date.now() - startSeq;

    console.log('  Sequential results:');
    sequentialResults.forEach(result => {
        console.log(`  ${result.url}: ${result.status} - ${result.title} (${result.size} bytes)`);
    });
    console.log(`  Sequential time: ${seqTime}ms\n`);

    // Example 2: Parallel web scraping with tasklets
    console.log('2. Parallel web scraping with tasklets:');
    const startPar = Date.now();

    const parallelResults = await tasklets.runAll(
        urls.map(url => () => scrapeUrl(url))
    );

    const parTime = Date.now() - startPar;

    console.log('  Parallel results:');
    parallelResults.forEach(result => {
        console.log(`  ${result.url}: ${result.status} - ${result.title} (${result.size} bytes)`);
    });
    console.log(`  Parallel time: ${parTime}ms`);
    console.log(`  Speedup: ${(seqTime / parTime).toFixed(2)}x\n`);

    // Example 3: Large-scale scraping simulation
    console.log('3. Large-scale scraping simulation:');
    const largeUrlList = Array.from({length: 50}, (_, i) =>
        `https://api.example.com/data/${i}`
    );

    console.log(`  Simulating scraping of ${largeUrlList.length} URLs...`);
    const startLarge = Date.now();

    const largeResults = await tasklets.runAll(
        largeUrlList.map(url => () => scrapeUrl(url))
    );

    const largeTime = Date.now() - startLarge;

    // Analyze results
    const successful = largeResults.filter(r => r.status === 200);
    const failed = largeResults.filter(r => r.status !== 200);
    const totalSize = successful.reduce((sum, r) => sum + r.size, 0);

    console.log(`  Large-scale results:`);
    console.log(`  Successful requests: ${successful.length}`);
    console.log(`  Failed requests: ${failed.length}`);
    console.log(`  Total data size: ${totalSize} bytes`);
    console.log(`  Total time: ${largeTime}ms`);
    console.log(`  Average time per URL: ${(largeTime / largeUrlList.length).toFixed(1)}ms\n`);

    // Example 4: Error handling and retry logic
    console.log('4. Error handling and retry logic:');
    const problematicUrls = [
        'https://httpbin.org/status/500',
        'https://httpbin.org/status/404',
        'https://httpbin.org/status/403',
        'https://httpbin.org/delay/2',
        'https://httpbin.org/status/200'
    ];

    async function scrapeWithRetry(url, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await scrapeUrl(url);
                if (result.status === 200) {
                    return {...result, attempts: attempt};
                }
                console.log(`  Attempt ${attempt} failed for ${url}: ${result.status}`);
            } catch (error) {
                console.log(`  Attempt ${attempt} error for ${url}: ${error.message}`);
            }

            if (attempt < maxRetries) {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return {url, status: 0, title: 'Failed after retries', size: 0, attempts: maxRetries};
    }

    const retryResults = await tasklets.runAll(
        problematicUrls.map(url => () => scrapeWithRetry(url))
    );

    console.log('  Retry results:');
    retryResults.forEach(result => {
        console.log(`  ${result.url}: ${result.status} (${result.attempts} attempts)`);
    });

    // Example 5: Data processing of scraped content
    console.log('5. Data processing of scraped content:');
    const validResults = parallelResults.filter(r => r.status === 200);

    const processedResults = await tasklets.runAll(
        validResults.map(result => () => {
            // Simulate content processing
            const processed = {
                url: result.url,
                originalSize: result.size,
                processedSize: result.size * 0.8, // Simulate compression
                keywords: ['example', 'data', 'api'], // Simulate keyword extraction
                processingTime: Math.random() * 100 + 50 // 50-150ms processing
            };

            // Simulate processing work
            for (let i = 0; i < 10000; i++) {
                Math.sqrt(i);
            }

            return processed;
        })
    );

    console.log('  Processing results:');
    processedResults.forEach(result => {
        console.log(`  ${result.url}: ${result.originalSize} -> ${result.processedSize} bytes`);
    });

    // Example 6: Performance monitoring
    console.log('6. Performance monitoring:');
    const finalStats = tasklets.getStats();
    console.log(`  Active tasklets: ${finalStats.activeTasklets}`);
    console.log(`  Total tasklets created: ${finalStats.totalTaskletsCreated}`);
    console.log(`  Completed tasklets: ${finalStats.completedTasklets}`);
    console.log(`  Success rate: ${finalStats.successRate.toFixed(1)}%`);

    // Example 7: Performance summary
    console.log('\n7. Performance summary:');
    console.log(`  URLs scraped: ${urls.length}`);
    console.log(`  Sequential time: ${seqTime}ms`);
    console.log(`  Parallel time: ${parTime}ms`);
    console.log(`  Speedup: ${(seqTime / parTime).toFixed(2)}x`);
    console.log(`  Efficiency: ${((seqTime / parTime) / urls.length * 100).toFixed(1)}%`);
    console.log(`  URLs processed per second: ${(urls.length / (parTime / 1000)).toFixed(1)}`);

    console.log('\nWeb scraping example completed!');
})(); 