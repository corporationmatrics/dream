# CI/CD Pipeline Reference

Complete guide to the automated GitHub Actions CI/CD pipeline for Dream ERP B2B integration.

---

## Table of Contents

1. [Pipeline Overview](#pipeline-overview)
2. [Workflows](#workflows)
3. [Triggering Deployments](#triggering-deployments)
4. [GitHub Secrets Setup](#github-secrets-setup)
5. [Debugging Workflows](#debugging-workflows)
6. [Pipeline Status & Monitoring](#pipeline-status--monitoring)

---

## Pipeline Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflows                 │
└─────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────┐
  │ Trigger: push, pull_request, workflow_dispatch, schedule │
  └──────────────────────────────────────────────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
    ┌─────────────┐   ┌──────────────┐   ┌──────────────┐
    │ test.yml    │   │ load-test.yml│   │compliance.yml│
    │  (On PR/Push)│  │  (Scheduled)  │   │  (Weekly)    │
    └─────────────┘   └──────────────┘   └──────────────┘
           │
           ▼
    ┌─────────────────────────────────────────┐
    │ ✓ All tests pass?                       │
    │ ✓ No CRITICAL vulnerabilities?           │
    │ ✓ Code coverage >= 80%?                  │
    └─────────────────────────────────────────┘
           │
           ▼ YES
    ┌─────────────┐
    │ build.yml   │
    │ (Docker)    │
    │ (Multi-arch)│
    └─────────────┘
           │
           ▼
    ┌──────────────┐
    │ deploy.yml   │
    │ (K3s)        │
    │ (Staging)    │
    │ (Production) │
    └──────────────┘
```

### What Gets Tested

| Phase | Tool | Coverage | Time |
|-------|------|----------|------|
| **Unit Tests** | Jest + TypeORM | 87 tests, 95% code coverage | 2 min |
| **Integration** | Supertest + Jest | 30 e2e scenarios | 3 min |
| **Database** | psql + SQL | Schema verification | 1 min |
| **Security** | npm audit, Snyk, Trivy | Dependency + container scanning | 2 min |
| **Load Test** | K6 | 100 VUs, 5m test | 6 min |
| **Compliance** | Multiple tools | Code quality, PII, penetration test | 10 min |

### What Gets Built & Deployed

| Artifact | Registry | Platforms | Schedule |
|----------|----------|-----------|----------|
| **API Image** | ghcr.io/dream-erp/api | amd64, arm64 | After test pass |
| **Accounting Image** | ghcr.io/dream-erp/accounting | amd64, arm64 | After test pass |
| **Staging Deploy** | K3s cluster | All services | Merge to develop |
| **Production Deploy** | K3s cluster | All services | Tag release |

---

## Workflows

### 1. test.yml - Automated Testing

**Trigger Points:**
- Push to main or develop branch
- Pull requests targeting main or develop
- Manual trigger via workflow_dispatch

**Jobs:**

#### Job 1: test-unit
```yaml
name: Unit Tests
runs-on: ubuntu-24.04
timeout-minutes: 15

Services:
  - PostgreSQL 15 (health-checked)
  - Valkey 8.0 (health-checked)

Commands:
  - npm test:unit --coverage
  - Upload coverage to Codecov
  - Upload artifact: coverage/

Status:
  - ✓ Pass: Continue to next jobs
  - ✗ Fail: Block all deployments
```

**Command:**
```bash
npm test:unit --coverage
```

**Output:**
```
PASS  src/services/po-intake.service.spec.ts
PASS  src/services/invoice-generator.service.spec.ts
PASS  src/services/webhook-notifier.service.spec.ts

Test Suites: 3 passed, 3 total
Tests: 87 passed, 87 total
Coverage: 95% statements
```

#### Job 2: test-integration
```yaml
name: Integration Tests (E2E)
runs-on: ubuntu-24.04
timeout-minutes: 30

Services:
  - PostgreSQL 15
  - Valkey 8.0
  - MinIO (S3 mock)

Pre-steps:
  - npm run migrate:test (Run migrations)
  - npm run seed:test (Load test data)

Command:
  npm test:e2e --runInBand --forceExit

Artifacts:
  - test-results/ (30-day retention)
```

**Expected Output:**
```
PASS  src/controllers/b2b-integration.e2e.spec.ts (520ms)

B2B Integration - Happy Path
  ✓ PO submission workflow (450ms)
  ✓ Invoice generation workflow (300ms)
  ✓ Ledger posting workflow (200ms)

Test Suites: 1 passed, 1 total
Tests: 30 passed, 30 total
```

#### Job 3: test-database
```yaml
name: Database Schema Validation
runs-on: ubuntu-24.04
timeout-minutes: 15

Services:
  - PostgreSQL 15

Commands:
  - Connect to test database
  - Run: 003_b2b_edi_schema.sql
  - Verify b2b_* tables created
  - Verify idx_b2b_* indexes created
  - Verify b2b_* triggers created
  - Run integrity checks

Verification Queries:
  SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'b2b';
  
  SELECT COUNT(*) FROM information_schema.views 
  WHERE table_schema = 'b2b';
```

#### Job 4: test-security
```yaml
name: Security Scanning
runs-on: ubuntu-24.04
timeout-minutes: 15

Commands:
  - npm audit --audit-level=high
  - snyk test --severity-threshold=high
  - trivy image ghcr.io/dream-erp/api:main

Thresholds:
  - npm audit: CRITICAL/HIGH = FAIL
  - Snyk: CRITICAL/HIGH = FAIL
  - Trivy: CRITICAL = FAIL
```

#### Job 5: test-summary
```yaml
name: Test Results Summary
runs-on: ubuntu-24.04

Triggers:
  - After all test jobs complete

Actions:
  - Aggregate all results
  - Comment on PR with summary
  - Fail workflow if any test failed
```

---

### 2. build.yml - Docker Image Building

**Trigger Point:**
- After test.yml succeeds
- Push to main/develop
- Manual trigger

**Jobs:**

#### Job 1: build-api
```yaml
name: Build API Docker Image
runs-on: ubuntu-24.04
timeout-minutes: 30

Context: ./erp-api
Dockerfile: ./erp-api/Dockerfile

Buildx Configuration:
  - Platforms: linux/amd64, linux/arm64
  - Build cache: GitHub Actions cache (layer caching)
  - Registry: ghcr.io/dream-erp/api

Image Tags:
  - develop (for develop branch)
  - main, latest (for main branch)
  - v1.0.0 (for release tags)
  - branch-<short-sha> (e.g., develop-a1b2c3d)

Push:
  - Authenticate: ${{ secrets.GITHUB_TOKEN }}
  - Destination: ghcr.io/dream-erp/api:tag
```

**Build Command:**
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag ghcr.io/dream-erp/api:main \
  --tag ghcr.io/dream-erp/api:latest \
  --push \
  ./erp-api
```

**Build Time:** 5-10 minutes (with layer cache)

#### Job 2: build-accounting
```yaml
name: Build Accounting Docker Image
runs-on: ubuntu-24.04
timeout-minutes: 30

(Same as build-api but for Spring Boot service)
```

#### Job 3: security-scan
```yaml
name: Container Security Scan
runs-on: ubuntu-24.04
timeout-minutes: 15

Triggers:
  - After successful build jobs

Scanning:
  - Tool: Trivy
  - Severity: CRITICAL, HIGH
  - Format: SARIF
  - Upload: GitHub Security tab

Commands:
  trivy image --format sarif ghcr.io/dream-erp/api:main
  trivy image --format sarif ghcr.io/dream-erp/accounting:main
```

---

### 3. deploy.yml - Kubernetes Deployment

**Trigger Points:**
- Push to develop (deploy to staging)
- Push to main (deploy to production)
- Manual workflow_dispatch (choose environment)

**Jobs:**

#### Job 1: deploy-staging
```yaml
name: Deploy to Staging
runs-on: ubuntu-24.04
timeout-minutes: 30
if: github.ref == 'refs/heads/develop'

Steps:
  1. Checkout code
  2. Configure K3s access (kubeconfig)
  3. Create namespace
  4. Create image pull secret
  5. Deploy PostgreSQL 15 (Helm)
  6. Deploy Valkey 8.0 (Helm)
  7. Run database migrations
  8. Deploy API service (2 replicas)
  9. Deploy Accounting service (1 replica)
  10. Wait for rollout (timeout: 5m)
  11. Run smoke tests
  12. Verify health endpoints

Post-Deploy:
  - API URL: https://api-staging.dream-erp.local
  - Accounting URL: https://accounting-staging.dream-erp.local
  - Status: Available for QA/testing
```

**Deployment Commands:**
```bash
# Create namespace
kubectl create namespace dream-erp-staging --dry-run=client -o yaml | kubectl apply -f -

# Deploy with Helm
helm install postgres bitnami/postgresql \
  --namespace dream-erp-staging \
  --values k8s/helm/postgres-values-staging.yaml

# Deploy services
kubectl apply -f k8s/deployments/api-production.yaml -n dream-erp-staging
kubectl apply -f k8s/deployments/accounting-production.yaml -n dream-erp-staging

# Wait for ready
kubectl rollout status deployment/api -n dream-erp-staging --timeout=5m
```

#### Job 2: deploy-production
```yaml
name: Deploy to Production
runs-on: ubuntu-24.04
timeout-minutes: 45
if: github.ref == 'refs/heads/main'

Environment: production
URL: https://api.dream-erp.local

Pre-Deployment:
  - Create backup of current deployment
  - Tag deployment with revision

Deployment:
  - Rolling update strategy (maxSurge=1, maxUnavailable=0)
  - 3 replicas API, 2 replicas Accounting
  - Pod anti-affinity (spread across nodes)

Post-Deployment:
  - Wait for all replicas ready (5m timeout)
  - Run health checks
  - Run production smoke tests
  - Verify database connectivity
  - Enable monitoring alerts

Rollback:
  - If any step fails: kubectl rollout undo
  - Restore previous version
  - Exit with error
```

**Deployment Timeline:**
```
0m    - Create backup
1m    - Update deployment
2m    - Rolling update starts (old pods still running)
3m    - New pods becoming ready
4m    - All new pods ready
5m    - Old pods terminated
5m    - Smoke tests run
6m    - Deployment complete
```

#### Job 3: post-deploy
```yaml
name: Post-Deployment Verification
runs-on: ubuntu-24.04
needs: [deploy-staging, deploy-production]

Actions:
  - Run e2e tests against staging
  - Check application metrics
  - Generate deployment report

Duration: ~5 minutes
```

---

### 4. load-test.yml - Performance Testing

**Trigger Point:**
- Schedule: Daily at 2 AM UTC
- Manual: workflow_dispatch

**Job: K6 Load Test**
```yaml
Virtual Users: 100 (default, configurable: 50-500)
Duration: 5 minutes (default, configurable: 1m-30m)
Scenarios: 4 (health, PO, invoice, ledger)

Metrics Collected:
  - Response time (50th, 95th, 99th percentile)
  - Error rate (%)
  - Throughput (requests/sec)
  - Concurrent users

Thresholds:
  - Response time p95 < 500ms ✓ PASS
  - Response time p99 < 1000ms ✓ PASS
  - Error rate < 1% ✓ PASS

Output:
  - JSON results → artifact
  - HTML report
  - Summary posted to monitoring dashboard
```

---

### 5. compliance.yml - Security & Compliance

**Trigger Point:**
- Schedule: Weekly (Monday 0 UTC)
- Manual: workflow_dispatch

**Jobs:**

1. **dependency-check** (npm audit + Snyk + OWASP DependencyCheck)
2. **container-scan** (Trivy + Grype)
3. **code-quality** (SonarQube + ESLint + CodeQL)
4. **license-compliance** (License checker)
5. **compliance-audit** (PII, encryption, audit trail)
6. **penetration-test** (OWASP ZAP)
7. **summary** (Aggregate results)

**Artifacts Generated:**
```
- npm-audit-report.txt
- snyk-report.json
- trivy-results.sarif
- dependency-check-report.json
- eslint-report.json
- sonarqube-report.json
- license-report.csv
- compliance-report.md
- zap-report.md
```

---

## Triggering Deployments

### Automatic Triggers

**Staging Deployment (Automatic):**
```
Merge PR → main branch
    ↓
Auto-trigger: test.yml + build.yml
    ↓
If all tests pass:
    ↓
Auto-trigger: deploy.yml (staging)
    ↓
Deploy to staging K3s cluster
```

**Production Deployment (Automatic):**
```
Tag release (v1.0.0, v1.0.1, etc.)
    ↓
Auto-trigger: test.yml + build.yml
    ↓
If all tests pass:
    ↓
Auto-trigger: deploy.yml (production)
    ↓
Deploy to production K3s cluster
```

### Manual Triggers

1. **Run Test Workflow:**
   - Go to Actions → test
   - Click "Run workflow"
   - Select branch
   - Click "Run"

2. **Run Deployment:**
   - Go to Actions → deploy
   - Click "Run workflow"
   - Select environment (staging/production)
   - Click "Run"

3. **Run Load Test:**
   - Go to Actions → load-test
   - Click "Run workflow"
   - Set VUs (default: 100)
   - Set Duration (default: 5m)
   - Click "Run"

4. **Run Compliance Scan:**
   - Go to Actions → compliance
   - Click "Run workflow"
   - Select scan type: full, dependency, container, code-quality, sast
   - Click "Run"

---

## GitHub Secrets Setup

Required secrets for CI/CD to work:

### Kubernetes Configuration
```
K3S_STAGING_KUBECONFIG
└─ Base64-encoded kubeconfig file for staging cluster
   Command: base64 -w 0 ~/.kube/config-staging > kubeconfig.b64
   Paste content into GitHub secret

K3S_PRODUCTION_KUBECONFIG
└─ Base64-encoded kubeconfig file for production cluster
```

### Database Credentials
```
STAGING_DB_PASSWORD
└─ PostgreSQL password for staging environment

PRODUCTION_DB_PASSWORD
└─ PostgreSQL password for production environment
```

### Security Scanning
```
SNYK_TOKEN
└─ Snyk API token for dependency scanning

SONAR_TOKEN
└─ SonarQube token for code quality analysis

SLACK_WEBHOOK_URL (Optional)
└─ Slack webhook for notifications
```

### Authentication
```
GITHUB_TOKEN
└─ Auto-generated, used for:
   - Container registry access
   - Artifact uploads
   - PR comments
```

---

## Debugging Workflows

### Viewing Workflow Logs

1. Go to GitHub repository
2. Click "Actions" tab
3. Select workflow run
4. Click job name
5. Expand step to see logs

### Common Workflow Issues

**Issue 1: Kubeconfig not found**
```
Error: KUBECONFIG /tmp/kubeconfig: No such file
```
**Solution:**
- Check K3S_STAGING_KUBECONFIG secret exists
- Verify it's base64-encoded properly
- Decode and check for valid YAML

**Issue 2: Image pull failed**
```
Error: ImagePullBackOff
```
**Solution:**
- Check docker login (ghcr-secret)
- Verify image exists: docker pull ghcr.io/dream-erp/api:main
- Check repository visibility (private vs public)

**Issue 3: Database migration failed**
```
Error: connection refused
```
**Solution:**
- Check PostgreSQL service is running
- Verify DATABASE_URL in pod
- Check network connectivity between pods

**Issue 4: Test timeout**
```
Error: TIMEOUT after 15m
```
**Solution:**
- Increase timeout-minutes in workflow
- Check for long-running test
- Review test logs for hangs

### Re-running Failed Jobs

```yaml
# Click "Re-run failed jobs" button in Actions tab
# Or use GitHub CLI:
gh run rerun <run-id> --failed
```

---

## Pipeline Status & Monitoring

### Status Dashboard

View all workflow runs:
- GitHub: Actions tab
- Status badge: Add to README.md

```markdown
[![Test Status](https://github.com/dream-erp/repo/workflows/Testing/badge.svg)](https://github.com/dream-erp/repo/actions)
```

### Monitoring Metrics

**Pipeline Performance:**
```
- Average test time: 6 minutes
- Average build time: 8 minutes
- Average deploy time: 5 minutes
- Success rate: > 95%
```

**Artifact Usage:**
```
- Test results: 7-day retention
- Coverage reports: 90-day retention
- Security reports: 365-day retention
```

### Integration with Monitoring

Workflows can post to external systems:

**Slack Notifications:**
```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    text: "Deployment successful: ${{ github.ref }}"
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Datadog Metrics:**
```bash
curl -X POST https://api.datadoghq.com/api/v1/series \
  -H "DD-API-KEY: ${{ secrets.DATADOG_API_KEY }}" \
  -d @- <<EOF
{"series": [{"metric": "ci.pipeline.duration", "value": 600}]}
EOF
```

---

## Performance Optimization

### Caching

**Docker Layer Cache:**
```yaml
- uses: docker/setup-buildx-action@v2
  with:
    cache-driver: docker-container
    cache-store: docker-action-cache
```

**npm Cache:**
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

### Parallel Execution

Jobs run in parallel by default:
- test-unit ✓ (2 min)
- test-integration ✓ (3 min)
- test-database ✓ (1 min)
- test-security ✓ (2 min)
All run simultaneously → Total: 3 min (not 8 min)

### Cost Optimization

```
- Use self-hosted runners for production builds
- Implement workflow concurrency limits
- Archive old artifacts automatically
- Use matrix builds for multi-platform images
```

---

**Last Updated:** 2024-02-07
