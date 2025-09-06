# HandyPay Production Readiness Test Suite

This automated test script validates critical production readiness requirements for the HandyPay backend API.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Running HandyPay backend server
- Database connection

### Basic Usage

```bash
# Test local development server
cd handypay-backend
npm run test:local

# Or run directly
node ../test-production-readiness.js --url http://localhost:3000
```

## 📋 What Gets Tested

### ✅ Automated Tests

- **Health Check** - Server availability and basic response
- **Database Connection** - Database connectivity and queries
- **Authentication Protection** - API endpoint security
- **Input Validation** - SQL injection and XSS prevention
- **Security Headers** - Basic security header presence
- **CORS Policy** - Cross-origin request handling
- **Rate Limiting** - Basic rate limiting validation
- **Load Performance** - Concurrent user simulation
- **Error Handling** - Invalid endpoints and malformed requests
- **Stripe Integration** - Payment API endpoint protection
- **Webhook Security** - Webhook endpoint validation

### ⚠️ Manual Tests Required

- Visual/UI testing across devices
- Device compatibility (iPhone, Android)
- User acceptance testing
- Performance monitoring setup
- Security penetration testing

## 🛠️ Configuration

### Environment Variables

```bash
# Set the API endpoint to test
TEST_BASE_URL=http://localhost:3000

# Test user credentials (for authenticated tests)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test123
```

### Command Line Options

```bash
# Show help
node test-production-readiness.js --help

# Test specific environment
node test-production-readiness.js --url https://api.production.com

# Test staging environment
npm run test:staging
```

## 📊 Test Results

### Output Format

```
[2024-01-15T10:30:00.000Z] ℹ️  🚀 Starting HandyPay Production Readiness Tests
[2024-01-15T10:30:00.000Z] ℹ️  📍 Testing against: http://localhost:3000
[2024-01-15T10:30:01.000Z] ✅ Health Check: PASSED
[2024-01-15T10:30:01.500Z] ✅ Database Connection: PASSED
...
```

### Exit Codes

- `0` - All tests passed
- `1` - Some tests failed

### Detailed Results

Results are saved to `test-results.json`:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "http://localhost:3000",
  "summary": {
    "total": 15,
    "passed": 14,
    "failed": 1,
    "successRate": "93.3%",
    "duration": "5.23s"
  },
  "tests": [...]
}
```

## 🔧 Test Customization

### Adding New Tests

Edit `test-production-readiness.js` and add new test functions:

```javascript
async function testYourNewFeature() {
  try {
    const response = await makeRequest(`${CONFIG.baseURL}/api/your-endpoint`);
    const passed = response.status === 200;
    recordTest("Your New Feature", passed);
  } catch (error) {
    recordTest("Your New Feature", false, error.message);
  }
}
```

Then add it to the main test execution in `runTests()`.

### Modifying Test Configuration

Update the `CONFIG` object at the top of the script:

```javascript
const CONFIG = {
  baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
  concurrentUsers: 50, // Increase for load testing
  timeout: 10000, // Increase for slow networks
  // ... other settings
};
```

## 🔒 Security Testing

### SQL Injection Tests

The script automatically tests for:

- Basic SQL injection patterns
- UNION-based attacks
- Comment-based attacks
- Stacked queries

### XSS Prevention

Tests for:

- Script tag injection
- HTML entity encoding
- JavaScript event handler injection

### Authentication Bypass

Validates that:

- Protected endpoints return 401
- Session validation works
- Authorization headers are required

## 📈 Performance Testing

### Load Testing

- Simulates concurrent users (default: 10)
- Measures response times
- Validates server stability
- Tests connection pooling

### Rate Limiting

- Sends rapid requests
- Monitors server responses
- Validates fair usage policies

## 🔍 Interpreting Results

### Common Issues & Solutions

#### ❌ Database Connection Failed

```bash
# Check if database is running
ps aux | grep postgres

# Verify connection string
echo $DATABASE_URL

# Test manual connection
psql $DATABASE_URL -c "SELECT 1"
```

#### ❌ Authentication Tests Failing

```bash
# Check if auth middleware is configured
grep -r "authMiddleware" src/

# Verify JWT secrets are set
echo $JWT_SECRET
```

#### ❌ Performance Issues

```bash
# Check server resources
top -p $(pgrep node)

# Monitor database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"
```

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Production Readiness Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: cd handypay-backend && npm install

      - name: Start database
        run: docker run -d -p 5432:5432 postgres:13

      - name: Run tests
        run: cd handypay-backend && npm run test:local
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'cd handypay-backend && npm install'
                sh 'npm run test:local'
            }
            post {
                always {
                    publishTestResults(testResultsPattern: 'test-results.json')
                }
            }
        }
    }
}
```

## 📝 Test Checklist Integration

This script covers these items from `PRODUCTION_READINESS_TESTS.md`:

### ✅ Automated Coverage

- [x] Authentication bypass testing
- [x] SQL injection attempts
- [x] XSS injection testing
- [x] Input validation
- [x] CORS policy validation
- [x] Rate limiting validation
- [x] Load testing (basic)
- [x] API response time validation
- [x] Error handling testing
- [x] Security header validation

### ⚠️ Manual Testing Still Required

- [ ] Visual/UI testing
- [ ] Device compatibility testing
- [ ] User acceptance testing
- [ ] Advanced security testing
- [ ] Performance monitoring setup

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**

   ```bash
   # Check if server is running
   curl http://localhost:3000/

   # Start server if needed
   cd handypay-backend && npm run dev
   ```

2. **Database Connection Failed**

   ```bash
   # Check database status
   psql $DATABASE_URL -c "SELECT version()"

   # Verify environment variables
   echo $DATABASE_URL
   ```

3. **Tests Timeout**
   ```bash
   # Increase timeout in script
   CONFIG.timeout = 10000; // 10 seconds
   ```

## 📞 Support

For issues with the test script:

1. Check the `test-results.json` for detailed error information
2. Review server logs for API errors
3. Verify all environment variables are set
4. Ensure the database is accessible

---

**Happy Testing! 🎉**

_This test suite ensures your HandyPay backend is production-ready and secure._
