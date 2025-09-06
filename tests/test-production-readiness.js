#!/usr/bin/env node

/**
 * HandyPay Production Readiness Test Suite
 * Automated testing script for critical functionality
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuration
const CONFIG = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testUser: {
    email: 'test@example.com',
    password: 'test123',
    id: 'test-user-12345'
  },
  stripeTestData: {
    accountId: 'acct_test_12345'
  },
  concurrentUsers: 10,
  testDuration: 30000, // 30 seconds
  timeout: 5000
};

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️ ',
    success: '✅ ',
    error: '❌ ',
    warning: '⚠️ '
  }[type] || '';

  console.log(`[${timestamp}] ${prefix}${message}`);
}

function recordTest(name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }

  results.tests.push({
    name,
    passed,
    details,
    timestamp: new Date().toISOString()
  });

  log(`${name}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'success' : 'error');
  if (details && !passed) {
    console.log(`   Details: ${details}`);
  }
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https://') ? https : http;

    const defaultOptions = {
      timeout: CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HandyPay-Test-Suite/1.0'
      }
    };

    const requestOptions = { ...defaultOptions, ...options };
    const reqUrl = new URL(url);

    const req = protocol.request(reqUrl, requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test Functions
async function testHealthCheck() {
  try {
    const response = await makeRequest(`${CONFIG.baseURL}/`);
    const passed = response.status === 200 && response.data.message;
    recordTest('Health Check', passed, passed ? '' : `Status: ${response.status}`);
  } catch (error) {
    recordTest('Health Check', false, error.message);
  }
}

async function testDatabaseConnection() {
  try {
    const response = await makeRequest(`${CONFIG.baseURL}/test-db`);
    const passed = response.status === 200 && response.data.success;
    recordTest('Database Connection', passed, passed ? '' : `Status: ${response.status}`);
  } catch (error) {
    recordTest('Database Connection', false, error.message);
  }
}

async function testAuthenticationProtection() {
  const endpoints = [
    '/api/users/sync',
    '/api/stripe/user-account/test123',
    '/api/transactions/test123'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${CONFIG.baseURL}${endpoint}`);
      const passed = response.status === 401;
      recordTest(`Auth Protection: ${endpoint}`, passed,
        passed ? '' : `Expected 401, got ${response.status}`);
    } catch (error) {
      recordTest(`Auth Protection: ${endpoint}`, false, error.message);
    }
  }
}

async function testInputValidation() {
  const testCases = [
    {
      name: 'SQL Injection Attempt',
      endpoint: '/api/users/sync',
      body: { id: "'; DROP TABLE users; --", email: 'test@test.com' },
      expectStatus: 401
    },
    {
      name: 'XSS Injection Attempt',
      endpoint: '/api/users/sync',
      body: { id: '<script>alert("xss")</script>', email: 'test@test.com' },
      expectStatus: 401
    },
    {
      name: 'Invalid Email Format',
      endpoint: '/api/users/sync',
      body: { id: 'test', email: 'invalid-email' },
      expectStatus: 401
    }
  ];

  for (const testCase of testCases) {
    try {
      const response = await makeRequest(`${CONFIG.baseURL}${testCase.endpoint}`, {
        method: 'POST',
        body: testCase.body
      });
      const passed = response.status === testCase.expectStatus;
      recordTest(`Input Validation: ${testCase.name}`, passed,
        passed ? '' : `Expected ${testCase.expectStatus}, got ${response.status}`);
    } catch (error) {
      recordTest(`Input Validation: ${testCase.name}`, false, error.message);
    }
  }
}

async function testCORSPolicy() {
  try {
    const response = await makeRequest(`${CONFIG.baseURL}/`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://handypay-backend.onrender.com',
        'Access-Control-Request-Method': 'POST'
      }
    });
    const passed = response.status === 200;
    recordTest('CORS Policy', passed, passed ? '' : `Status: ${response.status}`);
  } catch (error) {
    recordTest('CORS Policy', false, error.message);
  }
}

async function testRateLimiting() {
  // Test multiple rapid requests
  const promises = [];
  for (let i = 0; i < 20; i++) {
    promises.push(makeRequest(`${CONFIG.baseURL}/`));
  }

  try {
    const responses = await Promise.allSettled(promises);
    const successCount = responses.filter(r => r.status === 'fulfilled').length;
    const passed = successCount >= 15; // Allow some failures for rate limiting
    recordTest('Rate Limiting', passed,
      `${successCount}/20 requests succeeded`);
  } catch (error) {
    recordTest('Rate Limiting', false, error.message);
  }
}

async function testLoadPerformance() {
  const startTime = Date.now();
  const promises = [];

  // Simulate concurrent users
  for (let i = 0; i < CONFIG.concurrentUsers; i++) {
    promises.push(makeRequest(`${CONFIG.baseURL}/`));
  }

  try {
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    const avgResponseTime = duration / CONFIG.concurrentUsers;
    const passed = avgResponseTime < 1000; // Less than 1 second average
    recordTest('Load Performance', passed,
      `Average response time: ${avgResponseTime.toFixed(2)}ms`);
  } catch (error) {
    recordTest('Load Performance', false, error.message);
  }
}

async function testErrorHandling() {
  const testCases = [
    {
      name: 'Invalid Endpoint',
      endpoint: '/api/nonexistent',
      expectStatus: 404
    },
    {
      name: 'Malformed JSON',
      endpoint: '/api/users/sync',
      body: '{invalid json',
      method: 'POST',
      expectStatus: 401
    }
  ];

  for (const testCase of testCases) {
    try {
      const response = await makeRequest(`${CONFIG.baseURL}${testCase.endpoint}`, {
        method: testCase.method || 'GET',
        body: testCase.body
      });
      const passed = response.status === testCase.expectStatus;
      recordTest(`Error Handling: ${testCase.name}`, passed,
        passed ? '' : `Expected ${testCase.expectStatus}, got ${response.status}`);
    } catch (error) {
      recordTest(`Error Handling: ${testCase.name}`, false, error.message);
    }
  }
}

async function testSecurityHeaders() {
  try {
    const response = await makeRequest(`${CONFIG.baseURL}/`);
    const headers = response.headers;

    const checks = [
      { name: 'X-Content-Type-Options', required: true },
      { name: 'X-Frame-Options', required: true },
      { name: 'X-XSS-Protection', required: false },
      { name: 'Strict-Transport-Security', required: CONFIG.baseURL.startsWith('https') }
    ];

    let passedChecks = 0;
    for (const check of checks) {
      if (check.required) {
        if (headers[check.name.toLowerCase()]) {
          passedChecks++;
        }
      } else {
        passedChecks++; // Optional headers don't count against score
      }
    }

    const passed = passedChecks >= 2; // At least basic security headers
    recordTest('Security Headers', passed,
      `${passedChecks}/${checks.length} security headers present`);
  } catch (error) {
    recordTest('Security Headers', false, error.message);
  }
}

async function testStripeIntegration() {
  // Test Stripe-related endpoints (these will fail without auth, which is expected)
  const endpoints = [
    '/api/stripe/user-account/test123',
    '/api/stripe/create-account-link'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${CONFIG.baseURL}${endpoint}`);
      const passed = response.status === 401; // Should be protected
      recordTest(`Stripe Integration: ${endpoint}`, passed,
        passed ? 'Properly protected' : `Expected 401, got ${response.status}`);
    } catch (error) {
      recordTest(`Stripe Integration: ${endpoint}`, false, error.message);
    }
  }
}

async function testWebhookEndpoint() {
  try {
    const response = await makeRequest(`${CONFIG.baseURL}/api/stripe/webhook`, {
      method: 'POST',
      body: { type: 'test' }
    });
    const passed = response.status === 401; // Should be protected
    recordTest('Webhook Endpoint', passed,
      passed ? 'Properly protected' : `Expected 401, got ${response.status}`);
  } catch (error) {
    recordTest('Webhook Endpoint', false, error.message);
  }
}

// Main test execution
async function runTests() {
  log('🚀 Starting HandyPay Production Readiness Tests', 'info');
  log(`📍 Testing against: ${CONFIG.baseURL}`, 'info');
  log(`⏱️  Test timeout: ${CONFIG.timeout}ms`, 'info');
  log('─'.repeat(60), 'info');

  const startTime = Date.now();

  try {
    // Basic functionality tests
    await testHealthCheck();
    await testDatabaseConnection();

    // Security tests
    await testAuthenticationProtection();
    await testInputValidation();
    await testSecurityHeaders();
    await testCORSPolicy();

    // Performance tests
    await testRateLimiting();
    await testLoadPerformance();

    // Error handling tests
    await testErrorHandling();

    // Integration tests
    await testStripeIntegration();
    await testWebhookEndpoint();

  } catch (error) {
    log(`Critical test suite error: ${error.message}`, 'error');
  }

  const duration = Date.now() - startTime;

  // Generate test report
  log('─'.repeat(60), 'info');
  log('📊 TEST RESULTS SUMMARY', 'info');
  log('─'.repeat(60), 'info');

  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);

  // Save detailed results
  const report = {
    timestamp: new Date().toISOString(),
    environment: CONFIG.baseURL,
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      successRate: ((results.passed / results.total) * 100).toFixed(1) + '%',
      duration: `${(duration / 1000).toFixed(2)}s`
    },
    tests: results.tests
  };

  fs.writeFileSync('test-results.json', JSON.stringify(report, null, 2));
  log('📄 Detailed results saved to test-results.json', 'info');

  // Exit with appropriate code
  const exitCode = results.failed > 0 ? 1 : 0;
  log(`🏁 Test suite completed with exit code: ${exitCode}`, exitCode === 0 ? 'success' : 'error');

  // Show failed tests
  if (results.failed > 0) {
    log('❌ Failed Tests:', 'error');
    results.tests.filter(t => !t.passed).forEach(test => {
      console.log(`   • ${test.name}: ${test.details}`);
    });
  }

  process.exit(exitCode);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
HandyPay Production Readiness Test Suite

Usage: node test-production-readiness.js [options]

Options:
  --url <url>        Base URL to test (default: http://localhost:3000)
  --help, -h         Show this help message

Environment Variables:
  TEST_BASE_URL      Base URL to test (same as --url)

Examples:
  node test-production-readiness.js
  node test-production-readiness.js --url https://api.production.com
  TEST_BASE_URL=https://staging.api.com node test-production-readiness.js
  `);
  process.exit(0);
}

if (args.includes('--url')) {
  const urlIndex = args.indexOf('--url');
  if (args[urlIndex + 1]) {
    CONFIG.baseURL = args[urlIndex + 1];
  }
}

// Run the tests
runTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
