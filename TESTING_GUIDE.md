# Testing Guide

Complete testing strategy for Dream ERP B2B integration, covering unit tests, integration tests, load tests, and compliance validation.

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [Load Testing](#load-testing)
5. [Security Testing](#security-testing)
6. [Running Tests Locally](#running-tests-locally)
7. [CI/CD Test Pipeline](#cicd-test-pipeline)

---

## Testing Overview

### Test Pyramid

```
        /\
       /  \  E2E Tests (30 scenarios)
      /----\
     /      \  Integration Tests (complex workflows)
    /--------\
   /          \ Unit Tests (87 tests)
  /____________\
```

### Coverage by Service

| Service | Unit Tests | Integration | Load Tests | Coverage |
|---------|-----------|-------------|-----------|----------|
| POIntakeService | 25 tests | ✅ 8 scenarios | ✅ | 95% |
| InvoiceGeneratorService | 22 tests | ✅ 8 scenarios | ✅ | 92% |
| WebhookNotifierService | 40 tests | ✅ 6 scenarios | ✅ | 98% |
| Controllers (3x) | - | ✅ 8 scenarios | ✅ | 90% |
| **Total** | **87 tests** | **30 scenarios** | **Full workflow** | **95%** |

---

## Unit Testing

### Test Files

1. **po-intake.service.spec.ts** (500+ lines, 25 tests)
   - Service: POIntakeService (9-step workflow)
   - Coverage: JSON validation, partner auth, duplicate detection, inventory, rate limiting

2. **invoice-generator.service.spec.ts** (450+ lines, 22 tests)
   - Service: InvoiceGeneratorService (8-step workflow)
   - Coverage: Invoice numbering, signature generation, webhook queuing

3. **webhook-notifier.service.spec.ts** (550+ lines, 40 tests)
   - Service: WebhookNotifierService (async delivery)
   - Coverage: Delivery, retries, exponential backoff, dead letter queue

### Unit Test Examples

#### Test 1: PO Validation
```typescript
describe('POIntakeService - STEP 1: JSON Validation', () => {
  it('should reject PO without po_header', async () => {
    const invalidPO = {
      po_lines: [...],
      sender: {...}
    };
    
    await expect(service.validateSchema(invalidPO)).rejects.toThrow();
  });

  it('should accept valid PO with all required fields', async () => {
    const validPO = {
      po_header: {...},
      po_lines: [{...}],
      sender: {...}
    };
    
    const result = await service.validateSchema(validPO);
    expect(result).toBe(true);
  });
});
```

#### Test 2: Duplicate Detection
```typescript
describe('POIntakeService - STEP 3: Duplicate Detection', () => {
  it('should detect duplicate PO for same partner', async () => {
    await repository.save({
      po_number: 'PO-001',
      partner_id: 'VENDOR-TEST-001',
      status: 'SUBMITTED'
    });
    
    await expect(
      service.checkDuplicate('PO-001', 'VENDOR-TEST-001')
    ).rejects.toThrow('Duplicate PO');
  });
});
```

#### Test 3: Invoice Signature
```typescript
describe('InvoiceGeneratorService - Signature Generation', () => {
  it('should generate consistent SHA-256 signature', async () => {
    const payload = {
      invoice_number: 'GEN-INV-20250207-00001',
      amount: 5900,
      gst: 900
    };
    
    const sig1 = service.generateSignature(payload);
    const sig2 = service.generateSignature(payload);
    
    expect(sig1).toBe(sig2);
    expect(sig1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
  });
});
```

#### Test 4: Webhook Retry Logic
```typescript
describe('WebhookNotifierService - Exponential Backoff', () => {
  it('should schedule retry at correct times', async () => {
    const webhook = { retry_count: 0, next_retry_at: null };
    
    service.calculateNextRetry(webhook);
    
    expect(webhook.next_retry_at).toBe(NOW + 300 * 1000); // 5 minutes
    
    webhook.retry_count = 1;
    service.calculateNextRetry(webhook);
    expect(webhook.next_retry_at).toBe(NOW + 1800 * 1000); // 30 minutes
  });

  it('should move to dead letter after 5 retries', async () => {
    const webhook = { retry_count: 5, status: 'FAILED' };
    
    service.processFailedWebhook(webhook);
    
    expect(webhook.status).toBe('DEAD_LETTER');
    expect(webhook.moved_to_dlq_at).toBeDefined();
  });
});
```

### Running Unit Tests

```bash
# Run all unit tests
npm test:unit

# Run specific service tests
npm test:unit -- po-intake.service.spec.ts
npm test:unit -- invoice-generator.service.spec.ts
npm test:unit -- webhook-notifier.service.spec.ts

# Run with coverage report
npm test:unit -- --coverage

# Watch mode (re-run on file changes)
npm test:unit -- --watch

# Generate HTML coverage report
npm test:unit -- --coverage --coverageReporters=html
open coverage/index.html
```

---

## Integration Testing

### Test Files

**b2b-integration.e2e.spec.ts** (600+ lines, 30 test scenarios)

### Test Scenarios

#### 1. Happy Path Workflow (8 steps)
```typescript
describe('B2B Integration - Happy Path', () => {
  it('should complete PO→Invoice→Ledger workflow', async () => {
    // STEP 1: Submit PO
    const poResponse = await agent.post('/b2b/po/submit')
      .send(validPOPayload)
      .expect(202); // Accepted (async)
    
    const referenceNumber = poResponse.body.reference_number;
    
    // STEP 2: Wait for processing
    await new Promise(r => setTimeout(r, 500));
    
    // STEP 3: Verify PO created
    const po = await agent.get(`/b2b/po/${referenceNumber}`)
      .expect(200);
    expect(po.body.status).toBe('ACCEPTED');
    
    // STEP 4: Generate invoice
    const invoiceResponse = await agent.post('/b2b/invoice/generate')
      .send({ po_id: referenceNumber })
      .expect(202);
    
    // STEP 5: Verify invoice created
    await new Promise(r => setTimeout(r, 500));
    const invoice = await agent.get(`/b2b/invoice/${invoiceResponse.body.invoice_number}`)
      .expect(200);
    expect(invoice.body.status).toBe('GENERATED');
    
    // STEP 6-8: Verify webhook queued & ledger posted
    expect(invoice.body.webhook_sent).toBe(true);
    expect(invoice.body.ledger_posted).toBe(true);
  });
});
```

#### 2. Validation Error Scenarios
```typescript
describe('B2B Integration - Validation Errors', () => {
  it('should reject invalid JSON schema', async () => {
    const invalidPO = { po_number: 'PO-001' }; // Missing required fields
    
    await agent.post('/b2b/po/submit')
      .send(invalidPO)
      .expect(400)
      .expect(res => {
        expect(res.body.error).toContain('schema');
      });
  });

  it('should reject inactive partner', async () => {
    const poPayload = {
      po_header: { sender: { gst_in: 'INACTIVE-VENDOR' } },
      po_lines: [...],
      sender: { company_name: 'Inactive Vendor' }
    };
    
    await agent.post('/b2b/po/submit')
      .send(poPayload)
      .set('X-Partner-ID', 'INACTIVE-VENDOR')
      .expect(403);
  });

  it('should reject duplicate PO', async () => {
    const poPayload = { po_number: 'PO-DUPLICATE', ... };
    
    // First submission
    await agent.post('/b2b/po/submit').send(poPayload).expect(202);
    
    // Duplicate submission
    await agent.post('/b2b/po/submit')
      .send(poPayload)
      .expect(409); // Conflict
  });
});
```

#### 3. Inventory Shortage
```typescript
describe('B2B Integration - Inventory Handling', () => {
  it('should reject PO when inventory insufficient', async () => {
    const poPayload = {
      po_header: {...},
      po_lines: [{
        material_id: 'LOW-STOCK-001',
        quantity: 5000 // Exceeds available
      }],
      sender: {...}
    };
    
    await agent.post('/b2b/po/submit')
      .send(poPayload)
      .expect(422); // Unprocessable Entity
  });
});
```

#### 4. Webhook Delivery & Retry
```typescript
describe('B2B Integration - Webhook Delivery', () => {
  it('should deliver webhook with valid signature', async () => {
    // Mock partner webhook endpoint
    const webhookMock = jest.fn().mockResolvedValue({ status: 200 });
    
    // Trigger webhook delivery
    await service.deliverWebhook(webhook);
    
    expect(webhookMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Dream-Signature': expect.stringMatching(/^sha256=/),
          'X-Message-ID': expect.any(String)
        })
      })
    );
  });

  it('should retry on failure with exponential backoff', async () => {
    // Webhook delivery fails
    const webhook = { retry_count: 0, status: 'FAILED' };
    
    service.scheduleRetry(webhook);
    
    expect(webhook.retry_count).toBe(1);
    expect(webhook.next_retry_at).toBe(NOW + 300000); // 5 min
  });
});
```

### Running Integration Tests

```bash
# Run all integration tests
npm test:e2e

# Run specific test file
npm test:e2e -- b2b-integration.e2e.spec.ts

# Run with database services
npm test:e2e -- --runInBand --forceExit

# Watch mode
npm test:e2e -- --watch
```

---

## Load Testing

### K6 Performance Tests

**Scenarios (k6-test.js):**

1. **Health Check** (baseline)
   - Endpoint: GET /health
   - Validation: 200 status, < 50ms

2. **PO Submission** (primary workflow)
   - Endpoint: POST /b2b/po/submit
   - Payload: Valid PO with 1-3 line items
   - Validation: 202 status, < 500ms p95
   - Concurrent users: 100

3. **Invoice Generation** (secondary workflow)
   - Endpoint: POST /b2b/invoice/generate
   - Validation: 202 status, < 1000ms p95

4. **Ledger Posting** (downstream)
   - Endpoint: POST /accounting/ledger/post
   - Validation: 200 status, < 1000ms p95

### Load Test Configuration

```yaml
Virtual Users: 100 (default, configurable)
Duration: 5 minutes
Ramp-up: 1 minute
Steady-state: 3 minutes
Ramp-down: 1 minute

Performance Targets:
- Response time (p95): < 500ms (PO), < 1000ms (others)
- Response time (p99): < 1000ms
- Error rate: < 1%
- Throughput: > 100 requests/sec
```

### Running Load Tests

```bash
# Run locally with K6
npm run test:load

# Run with custom parameters
k6 run k6-test.js \
  -e VUS=200 \
  -e DURATION=10m \
  -e API_URL=https://api-staging.dream-erp.local

# Generate HTML report
k6 run --out json=results.json k6-test.js
npm run report:load results.json
```

---

## Security Testing

### Automated Security Scans (CI/CD)

1. **Dependency Scanning**
   - npm audit (npm packages)
   - Snyk (vulnerability database)
   - OWASP DependencyCheck (Java/Spring)

2. **Container Scanning**
   - Trivy (image vulnerabilities)
   - Grype/Anchore (SBOM generation)

3. **Code Scanning**
   - SonarQube (code quality, SAST)
   - ESLint (JavaScript/TypeScript)
   - CodeQL (GitHub SAST)

4. **Penetration Testing**
   - OWASP ZAP (web vulnerability scanner)
   - SQL injection tests
   - Authentication tests
   - Authorization tests

### Manual Security Testing

```bash
# SQL Injection test
curl "https://api.dream-erp.local/b2b/po/1' OR '1'='1"

# Authentication bypass
curl -X POST https://api.dream-erp.local/b2b/po/submit \
  -H "Content-Type: application/json"

# XSS payload
curl -X POST https://api.dream-erp.local/b2b/po/submit \
  -d '{"sender":{"company_name":"<script>alert(1)</script>"}}'

# Rate limiting test
for i in {1..200}; do
  curl -s https://api.dream-erp.local/health
done
```

### Running Security Scans

```bash
# Run all security tests
npm run test:security

# Dependency audit
npm audit --audit-level=high

# Snyk scan
snyk test --severity-threshold=high

# Container scan
trivy image ghcr.io/dream-erp/api:main

# Code quality
sonar-scanner -Dsonar.projectKey=dream-erp
```

---

## Running Tests Locally

### Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.test

# Ensure PostgreSQL is running
# Ensure Redis is running
# Ensure MinIO is running (optional)
```

### Test Commands

```bash
# Run all tests
npm test

# Unit tests with coverage
npm test:unit -- --coverage

# Integration tests
npm test:e2e -- --runInBand

# Load tests
npm run test:load

# Security scans
npm run test:security

# All tests (full suite)
npm run test:all
```

### Test Output

```
PASS  src/services/po-intake.service.spec.ts
  POIntakeService
    STEP 1: JSON Schema Validation
      ✓ should reject PO without po_header (15ms)
      ✓ should accept valid PO with all required fields (8ms)
    STEP 2: Partner Authentication
      ✓ should authenticate active partner (12ms)
      ✓ should reject inactive partner (10ms)
    ...

PASS  src/services/b2b-integration.e2e.spec.ts
  B2B Integration - Happy Path
    ✓ should complete PO→Invoice→Ledger workflow (520ms)
  B2B Integration - Error Scenarios
    ✓ should reject invalid schema (45ms)
    ✓ should reject duplicate PO (38ms)
    ...

Test Suites: 4 passed, 4 total
Tests:       117 passed, 117 total
Coverage: ✓ 95% statements, 93% branches, 91% functions, 94% lines
```

---

## CI/CD Test Pipeline

### Automated Testing Flow

```
Push/PR
  │
  ├─→ [test-unit] npm test:unit --coverage
  │   └─→ [PASS] Upload to Codecov
  │
  ├─→ [test-integration] npm test:e2e --runInBand
  │   └─→ [PASS] Generate test results
  │
  ├─→ [test-database] Run migration + verify schema
  │   └─→ [PASS] Confirm all tables/indexes created
  │
  └─→ [test-security] npm audit + Snyk + Trivy
      └─→ [PASS] No CRITICAL vulnerabilities
          │
          └─→ [build] Docker buildx (multi-platform)
              └─→ [push] ghcr.io/dream-erp/*
                  │
                  └─→ [deploy-staging] K3s auto-deploy
                      └─→ [load-test] K6 performance validation
```

### GitHub Actions Workflows

1. **test.yml**: Unit, integration, database, security tests
2. **build.yml**: Docker image building + container scanning
3. **load-test.yml**: Scheduled performance testing
4. **compliance.yml**: Weekly security & compliance audit

---

## Test Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Services | 95% | 95% |
| Controllers | 85% | 90% |
| Database layer | 90% | 92% |
| Error handling | 90% | 88% |
| **Overall** | **90%** | **95%** |

---

## Debugging Failed Tests

### Common Issues

1. **Database connection timeout**
   ```bash
   # Check if PostgreSQL is running
   psql -U postgres -d dream_erp -c "SELECT 1;"
   
   # Check connection string
   echo $DATABASE_URL
   ```

2. **Redis connection error**
   ```bash
   # Check if Redis is running
   redis-cli ping
   
   # Check Redis URL
   echo $REDIS_URL
   ```

3. **Test timeout**
   ```bash
   # Increase timeout in jest.config.js
   testTimeout: 10000 // 10 seconds
   ```

4. **Port already in use**
   ```bash
   # Find and kill process on port
   lsof -i :3000
   kill -9 <PID>
   ```

### Test Debugging

```bash
# Run single test with debug output
DEBUG=* npm test:unit -- po-intake.service.spec.ts

# Run with verbose logging
npm test:unit -- --verbose

# Use Jest debugger
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

---

**Last Updated:** 2024-02-07

