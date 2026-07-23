const autocannon = require('autocannon');

const TARGET_URL = 'http://localhost:3000';

async function runTest(title, options) {
    console.log(`\n================================`);
    console.log(`Running Test: ${title}`);
    console.log(`Target: ${TARGET_URL}${options.url}`);
    console.log(`================================\n`);

    const result = await autocannon({
        url: `${TARGET_URL}${options.url}`,
        method: options.method || 'GET',
        connections: options.connections || 10, // Default to 10 concurrent connections
        pipelining: 1, // Number of pipelined requests per connection
        duration: options.duration || 10, // Run for 10 seconds
        headers: options.headers || {
            'x-forwarded-for': '192.168.1.100' // Simulate a specific IP for rate limiting
        },
        body: options.body,
    });

    console.log(`[Results] ${title}`);
    console.log(`Total Requests: ${result.requests.total}`);
    console.log(`Successful (2xx): ${result['2xx']} `);
    console.log(`Rate Limited(429): ${result['429'] || 0} `);
    console.log(`Server Errors(5xx): ${result['5xx'] || 0} `);
    console.log(`Other Status Codes: ${result.non2xx - (result['429'] || 0) - (result['5xx'] || 0)} `);
    console.log(`Throughput: ${result.requests.average} req / sec`);
    console.log(`Avg Latency: ${result.latency.average} ms`);

    // Verify rate limit logic: we expect exactly 100 successful requests if limit is 100/10s
    if (options.url.startsWith('/api') && result.requests.total > 100) {
        if (result['2xx'] <= 100 && result['429'] > 0) {
            console.log(`✅ Rate limiting SUCCESSFUL(Blocked ${result['429']} excess requests)`);
        } else if (result['2xx'] > 100) {
            console.log(`❌ Rate limiting FAILED(Allowed ${result['2xx']} requests, expected ~100)`);
        } else {
            console.log(`⚠️ Rate limiting INCONCLUSIVE.Check logs.`);
        }
    } else if (options.url.startsWith('/api')) {
        console.log(`⚠️ Test didn't reach limit. Total requests: ${result.requests.total}`);
    }
}

async function startTests() {
    console.log('Starting DDoS / Spam Simulation...');

    // Test 1: Public API Endpoint (Should be rate limited)
    await runTest('Public API GET (Product Search)', {
        url: '/api/products?search=test',
        connections: 50,
        duration: 12 // Run slightly longer than the 10s window
    });

    // Test 2: Login Spam (Should be rate limited)
    await runTest('Login Endpoint POST Spam', {
        url: '/api/auth/login',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '192.168.1.101' // Different IP to reset limit
        },
        body: JSON.stringify({ email: 'spam@test.com', password: 'password123' }),
        connections: 20,
        duration: 5
    });

    // Test 3: Public Page GET (Next.js handles this, Proxy rate limit might not apply directly to non-/api)
    await runTest('Public Frontend Page (Home)', {
        url: '/',
        connections: 50,
        duration: 5
    });
}

startTests().catch(console.error);
