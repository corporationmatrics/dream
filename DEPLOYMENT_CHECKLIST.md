# Dream ERP Production Deployment Checklist

## Pre-Deployment Phase

### Code Review & Testing
- [ ] All code changes reviewed and approved by 2+ reviewers
- [ ] All unit tests passing (npm test:unit)
- [ ] All integration tests passing (npm test:e2e)
- [ ] Code coverage >= 80%
- [ ] Security scan (Snyk) shows no CRITICAL vulnerabilities
- [ ] Container images scanned with Trivy - no CRITICAL issues
- [ ] Database migration tested in staging environment
- [ ] API backwards compatibility verified

### Infrastructure & Environment Setup
- [ ] K3s cluster available and healthy (3+ nodes recommended)
- [ ] PostgreSQL 15+ deployed and accessible
- [ ] Valkey/Redis 8.0+ deployed and accessible
- [ ] MinIO S3 storage deployed and working
- [ ] Docker registry (ghcr.io) access configured
- [ ] Kubernetes namespace "dream-erp" created
- [ ] Secrets created in Kubernetes:
  - [ ] api-secrets (DATABASE_URL, JWT_SECRET)
  - [ ] accounting-secrets (datasource credentials)
  - [ ] ghcr-secret (image pull credentials)
- [ ] PersistentVolumes created for databases
- [ ] LoadBalancers/Ingress configured
- [ ] SSL/TLS certificates installed
- [ ] DNS records updated to point to new environment

### Monitoring & Logging Setup
- [ ] Prometheus deployed and scraping targets
- [ ] Grafana dashboards created:
  - [ ] API metrics dashboard (request rate, latency, errors)
  - [ ] Accounting service dashboard
  - [ ] Database performance dashboard
  - [ ] B2B integration dashboard (POIntake, InvoiceGeneration, Webhooks)
- [ ] AlertManager configured with notification channels:
  - [ ] Slack integration for warnings
  - [ ] PagerDuty integration for critical alerts
  - [ ] Email for info/debug logs
- [ ] Log aggregation (ELK/Loki) configured
- [ ] Audit logging enabled for B2B operations
- [ ] Performance baseline metrics recorded

### Partner & Vendor Coordination
- [ ] All B2B partners notified of go-live date
- [ ] Partner endpoint URLs/credentials confirmed
- [ ] Webhook signature keys distributed to partners
- [ ] Partner testing completed and signed off
- [ ] Support contact list distributed
- [ ] Escalation procedures documented
- [ ] SLA agreements in place (99.5% availability target)

### Financial & Compliance
- [ ] GSTIN mapping validated for all partners
- [ ] GST calculation rates verified
- [ ] Ledger posting sequence tested
- [ ] Audit trail configured and tested
- [ ] Data backup strategy confirmed
- [ ] Disaster recovery plan tested
- [ ] Compliance checklist completed (data retention, PII handling)
- [ ] Financial audit trail enabled

---

## Deployment Phase (Pre-Production)

### Database Migration
- [ ] Connect to production PostgreSQL
- [ ] Create database snapshot/backup
- [ ] Run migration: `npm run migrate -- --production`
- [ ] Verify schema:
  - [ ] `b2b_purchase_order` table exists with correct columns
  - [ ] `b2b_invoice` table exists
  - [ ] `b2b_webhook_queue` table exists
  - [ ] All indexes created
  - [ ] All triggers deployed
- [ ] Run data validation queries
- [ ] Document any schema changes for rollback

### Docker Image Deployment
- [ ] Verify Docker images exist in ghcr.io:
  - [ ] ghcr.io/dream-erp/api:main (latest)
  - [ ] ghcr.io/dream-erp/accounting:main (latest)
- [ ] Pull images locally and scan with trivy
- [ ] Push images to registry with semver tags (v1.0.0, etc.)
- [ ] Verify image signatures if applicable

### Kubernetes Deployment Steps

#### 1. Deploy Configuration
```bash
# Apply production manifests
kubectl apply -f k8s/deployments/api-production.yaml
kubectl apply -f k8s/deployments/accounting-production.yaml
kubectl apply -f k8s/monitoring/prometheus-rules.yaml
```

- [ ] Deployments created
- [ ] Services created
- [ ] Secrets created
- [ ] PersistentVolumeClaims bound

#### 2. Verify Pod Health
```bash
# Check pod status
kubectl get pods -n dream-erp
kubectl describe pods -n dream-erp
```

- [ ] API pods ready (3/3)
- [ ] Accounting pods ready (2/2)
- [ ] All containers running
- [ ] No pending pods
- [ ] No CrashLoopBackOff errors

#### 3. Health Endpoint Testing
```bash
# Test API health endpoint
curl https://api.dream-erp.local/health

# Test Accounting health endpoint
curl https://accounting.dream-erp.local/actuator/health
```

- [ ] API returns 200 OK
- [ ] API indicates "ready": true
- [ ] Accounting returns 200 OK
- [ ] Accounting database connectivity: UP
- [ ] All services report UP status

#### 4. Smoke Tests
```bash
# Run basic functionality tests
npm test:smoke -- --env=production
```

- [ ] Health check passes
- [ ] PO submission endpoint responds
- [ ] Invoice generation endpoint responds
- [ ] Database connectivity verified
- [ ] Redis connectivity verified
- [ ] No authentication errors

---

## Validation Phase

### API Endpoint Validation
- [ ] POST /b2b/po/submit returns 202 Accepted
- [ ] GET /b2b/po/{id} returns 200 with data
- [ ] POST /b2b/invoice/generate returns 202 Accepted
- [ ] GET /b2b/invoice/{id} returns 200 with data
- [ ] POST /b2b/webhook/admin/retry returns 202
- [ ] GET /health returns 200

### Database Validation
```sql
-- Run validation queries
SELECT COUNT(*) FROM b2b_purchase_order;
SELECT COUNT(*) FROM b2b_invoice;
SELECT COUNT(*) FROM b2b_webhook_queue;
SELECT COUNT(*) FROM b2b_audit_log;
```

- [ ] Tables accessible and queryable
- [ ] Triggers firing on INSERT/UPDATE
- [ ] Audit logs being written
- [ ] Sequences working correctly

### Webhook Integration
- [ ] Webhook delivery tested with staging partner
- [ ] HMAC-SHA256 signature validation working
- [ ] Retry logic functioning (exponential backoff)
- [ ] Dead letter queue functional
- [ ] Manual retry endpoint working
- [ ] Webhook logs captured in audit trail

### Performance Baseline
```bash
# Run load tests
npm run test:load -- --vus=100 --duration=5m
```

- [ ] Response time p95 < 500ms (PO submission)
- [ ] Response time p99 < 1000ms
- [ ] Error rate < 1%
- [ ] Throughput > 100 requests/second
- [ ] Memory usage stable under load
- [ ] Database connection pool health

### Security Validation
- [ ] JWT tokens validated
- [ ] Partner authentication working
- [ ] CORS headers correct
- [ ] SQL injection tests pass
- [ ] Rate limiting active (100 POs/min per partner)
- [ ] No sensitive data in logs
- [ ] Secrets encrypted at rest

---

## Post-Deployment Monitoring

### First 24 Hours (Critical)
- [ ] Monitor error logs for exceptions
- [ ] Check CPU/Memory usage (should be < 70%)
- [ ] Monitor database performance
- [ ] Track webhook delivery success rate (target: > 99%)
- [ ] Monitor invoice generation queue depth
- [ ] Check for any database deadlocks
- [ ] Review audit logs for anomalies
- [ ] Verify no OOM kills or crashes
- [ ] Alert thresholds active and functioning

### Metrics to Monitor
| Metric | Target | Alert if |
|--------|--------|----------|
| API response time (p95) | < 500ms | > 750ms |
| API error rate | < 1% | > 2% |
| Webhook success rate | > 99.5% | < 98% |
| Database queries (p95) | < 100ms | > 200ms |
| Dead letter queue size | 0 | > 5 |
| Pod restart count | 0 | > 0 in 1hr |

### Weekly Monitoring Checklist
- [ ] Review error trends
- [ ] Analyze performance trends
- [ ] Check storage usage
- [ ] Verify backup jobs running
- [ ] Test disaster recovery procedure
- [ ] Review security audit logs
- [ ] Check certificate expiration dates

---

## Rollback Procedure (if needed)

### Failover Steps
```bash
# Get previous deployment image tag
kubectl rollout history deployment/api -n dream-erp

# Rollback to previous version
kubectl rollout undo deployment/api -n dream-erp --to-revision=N
kubectl rollout undo deployment/accounting -n dream-erp --to-revision=N

# Verify rollback
kubectl rollout status deployment/api -n dream-erp
kubectl rollout status deployment/accounting -n dream-erp
```

- [ ] Previous version deployed
- [ ] All pods healthy after rollback
- [ ] Health checks passing
- [ ] Database queries responding
- [ ] Webhook delivery resumed
- [ ] Incident documented

### Database Rollback (if schema changes caused issues)
```bash
# Restore from pre-deployment backup
psql -U postgres -d dream_erp < backup-20240207-before-deploy.sql

# Verify data integrity
SELECT COUNT(*) FROM b2b_purchase_order;
SELECT COUNT(*) FROM b2b_invoice;
```

- [ ] Data restored from snapshot
- [ ] Verify row counts match expected
- [ ] Run integrity checks
- [ ] Resume normal operations

---

## Post-Deployment Sign-Off

- [ ] **DevOps Lead**: Verified infrastructure health _____ Date: _____
- [ ] **QA Lead**: Confirmed all tests passing _____ Date: _____
- [ ] **B2B Product Owner**: Validated business requirements _____ Date: _____
- [ ] **Security Officer**: Security validation complete _____ Date: _____
- [ ] **Operations**: Monitoring configured and active _____ Date: _____

---

## Documentation & Knowledge Transfer

- [ ] Runbook updated with production URLs
- [ ] Team trained on deployment process
- [ ] Incident response plan reviewed
- [ ] Escalation contacts updated
- [ ] Partner communication templates sent
- [ ] Performance baseline documented
- [ ] Known issues/limitations documented
- [ ] Future optimization opportunities listed

---

## Success Criteria

✅ **Deployment is successful if:**
1. All pods healthy and running
2. API health endpoint returns 200 OK
3. At least 1 successful PO→Invoice→Ledger workflow
4. No critical alerts triggered in first hour
5. Error rate < 1%
6. Response time p95 < 500ms
7. Webhook delivery success rate > 99%
8. No database deadlocks or connection pool exhaustion
9. All audit logs being captured
10. Monitoring dashboards showing normal metrics

---

## Contact & Escalation

**On-Call DevOps**: [Phone/Slack]
**Database DBA**: [Phone/Slack]
**Security Officer**: [Phone/Slack]
**Product Owner**: [Phone/Slack]

**If critical issue within 1 hour of deployment:**
1. Assess severity
2. Notify team lead
3. Consider rollback if error rate > 5%
4. Document issue in postmortem

---

*Last Updated: 2024-02-07*
*Next Review: 2024-02-14*
