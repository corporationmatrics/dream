# Deployment & Operations Guide

Complete guide for deploying, scaling, monitoring, and troubleshooting the Dream ERP B2B integration system.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Process](#deployment-process)
3. [Post-Deployment Verification](#post-deployment-verification)
4. [Scaling Operations](#scaling-operations)
5. [Database Management](#database-management)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Disaster Recovery](#disaster-recovery)
9. [Performance Tuning](#performance-tuning)

---

## Pre-Deployment Checklist

### Code Review & Testing
- [ ] All code changes reviewed and approved (2+ reviewers)
- [ ] All unit tests passing: `npm test:unit`
- [ ] All integration tests passing: `npm test:e2e`
- [ ] Code coverage >= 80%
- [ ] Security scan shows no CRITICAL vulnerabilities (Snyk)
- [ ] Container images scanned (Trivy) - no CRITICAL issues
- [ ] Database migration tested in staging
- [ ] API backwards compatibility verified

### Infrastructure & Environment
- [ ] K3s cluster healthy (3+ nodes for production)
- [ ] PostgreSQL 15+ deployed and accessible
- [ ] Valkey/Redis 8.0+ deployed and accessible
- [ ] MinIO S3 storage deployed
- [ ] Kubernetes namespace `dream-erp` created
- [ ] All required secrets created:
  - `api-secrets` (DATABASE_URL, JWT_SECRET)
  - `accounting-secrets` (datasource credentials)
  - `ghcr-secret` (image pull credentials)
- [ ] PersistentVolumes configured
- [ ] LoadBalancers/Ingress configured
- [ ] SSL/TLS certificates installed
- [ ] DNS records pointing to load balancers

### Monitoring Setup
- [ ] Prometheus deployed and scraping targets
- [ ] Grafana dashboards created:
  - API performance metrics
  - Database performance
  - B2B integration status
  - Infrastructure metrics
- [ ] AlertManager configured (Slack, PagerDuty)
- [ ] Log aggregation configured
- [ ] Audit logging enabled
- [ ] Performance baseline recorded

### Partner Coordination
- [ ] All B2B partners notified of deployment
- [ ] Partner endpoint URLs confirmed
- [ ] Webhook signature keys distributed
- [ ] Partner testing completed
- [ ] Support contact list distributed
- [ ] SLA agreements in place (99.5% target)

### Compliance & Financial
- [ ] GSTIN mapping validated for all partners
- [ ] GST calculation rates verified
- [ ] Ledger posting sequence tested
- [ ] Audit trail configured
- [ ] Backup strategy confirmed
- [ ] Disaster recovery plan reviewed
- [ ] Data compliance checklist completed

---

## Deployment Process

### Step 1: Database Migration

```bash
# Connect to target environment
export PGPASSWORD=<password>

# Create backup
pg_dump -h <host> -U postgres -d dream_erp -Fc > backup-$(date +%Y%m%d-%H%M%S).dump

# Run migration
kubectl run db-migrate \
  --image=ghcr.io/dream-erp/api:main \
  --namespace=dream-erp \
  --env="DATABASE_URL=postgresql://postgres:$PGPASSWORD@postgres:5432/dream_erp" \
  -- npm run migrate

# Verify schema
psql -h <host> -U postgres -d dream_erp <<EOF
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'b2b';
SELECT COUNT(*) as index_count FROM pg_indexes 
WHERE schemaname = 'b2b';
EOF
```

**Verification:**
- [ ] All `b2b_*` tables created
- [ ] All `idx_b2b_*` indexes created
- [ ] All triggers deployed
- [ ] Data integrity confirmed

### Step 2: Deploy Services

**Staging Deployment:**
```bash
# Create namespace
kubectl create namespace dream-erp-staging

# Deploy PostgreSQL & Valkey via Helm
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm install postgres bitnami/postgresql \
  --namespace dream-erp-staging \
  --values k8s/helm/postgres-values-staging.yaml \
  --wait --timeout 5m

helm install valkey bitnami/redis \
  --namespace dream-erp-staging \
  --values k8s/helm/valkey-values-staging.yaml \
  --wait --timeout 5m

# Deploy application services
kubectl apply -f k8s/deployments/api-production.yaml -n dream-erp-staging
kubectl apply -f k8s/deployments/accounting-production.yaml -n dream-erp-staging
```

**Production Deployment:**
```bash
# Create namespace
kubectl create namespace dream-erp

# Deploy with image pull secrets
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=<username> \
  --docker-password=<token> \
  -n dream-erp

# Deploy services
kubectl apply -f k8s/deployments/api-production.yaml -n dream-erp
kubectl apply -f k8s/deployments/accounting-production.yaml -n dream-erp
```

### Step 3: Verify Pod Health

```bash
# Wait for rollout
kubectl rollout status deployment/api -n dream-erp --timeout=5m
kubectl rollout status deployment/accounting -n dream-erp --timeout=5m

# Check pod status
kubectl get pods -n dream-erp
kubectl describe pods -n dream-erp

# Check for errors
kubectl logs deployment/api -n dream-erp | tail -50
kubectl logs deployment/accounting -n dream-erp | tail -50
```

**Expected State:**
- API pods: `3/3` replicas ready (production) or `2/2` (staging)
- Accounting pods: `2/2` replicas ready (production) or `1/1` (staging)
- No `CrashLoopBackOff` or `Pending` pods
- All containers running

### Step 4: Smoke Tests

```bash
# Get API endpoint
API_URL=$(kubectl get svc api -n dream-erp -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test health endpoint
curl -f https://$API_URL/health

# Test API connectivity
curl -s https://$API_URL/b2b/po/status | jq .

# Test database connectivity
kubectl exec -it <api-pod> -n dream-erp -- npm run cli -- db test

# Test Redis connectivity
kubectl exec -it <api-pod> -n dream-erp -- npm run cli -- redis test
```

**Success Criteria:**
- Health endpoint returns 200 OK
- Database connectivity: UP
- Redis connectivity: UP
- No authentication errors

---

## Post-Deployment Verification

### Health Checks

```bash
# API health
curl https://api.dream-erp.local/health

# Accounting health
curl https://accounting.dream-erp.local/actuator/health

# Database connectivity (from pod)
kubectl exec -it <pod> -- psql -h postgres -U postgres -c "SELECT 1;"

# Redis connectivity
kubectl exec -it <pod> -- redis-cli -h valkey ping
```

### Validation Queries

```sql
-- Check table creation
SELECT COUNT(*) FROM b2b_purchase_order;
SELECT COUNT(*) FROM b2b_invoice;
SELECT COUNT(*) FROM b2b_webhook_queue;

-- Check triggers
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'b2b';

-- Check audit logs
SELECT COUNT(*) FROM b2b_audit_log WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check sequences
SELECT * FROM information_schema.sequences 
WHERE sequence_schema = 'b2b';
```

### First 24-Hour Monitoring

| Metric | Action |
|--------|--------|
| CPU > 70% | Investigate resource usage |
| Memory growing | Check for memory leaks |
| Error rate > 1% | Review error logs |
| Webhook failures > 5 | Check partner endpoints |
| Response time p95 > 750ms | Check database performance |
| Pod restarts > 0 | Review crash logs |

---

## Scaling Operations

### Horizontal Scaling (More Pods)

```bash
# Scale API to 5 replicas
kubectl scale deployment api --replicas=5 -n dream-erp

# Scale Accounting to 3 replicas
kubectl scale deployment accounting --replicas=3 -n dream-erp

# Verify
kubectl get pods -n dream-erp
```

### Vertical Scaling (More Resources)

```bash
# Increase API resource limits
kubectl set resources deployment/api -n dream-erp \
  --limits=memory=1Gi,cpu=1000m \
  --requests=memory=512Mi,cpu=500m

# Increase Accounting resources
kubectl set resources deployment/accounting -n dream-erp \
  --limits=memory=2Gi,cpu=2000m \
  --requests=memory=1Gi,cpu=1000m
```

### Auto-Scaling Configuration

```bash
# Create HorizontalPodAutoscaler for API
kubectl apply -f - <<EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-autoscaler
  namespace: dream-erp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
EOF

# Check HPA status
kubectl get hpa -n dream-erp
kubectl describe hpa api-autoscaler -n dream-erp
```

---

## Database Management

### Backup Procedures

**Full Backup:**
```bash
# Create full backup
kubectl exec postgres-0 -n dream-erp -- \
  pg_dump -U postgres -d dream_erp -Fc > backup-$(date +%Y%m%d-%H%M%S).dump

# Backup to persistent storage
kubectl exec postgres-0 -n dream-erp -- \
  pg_dump -U postgres -d dream_erp -Fc -f /var/lib/postgresql/data/backups/dream_erp.dump

# Verify backup
pg_restore -l backup.dump | head -20
```

**Scheduled Backups:**
```yaml
# CronJob for daily backups
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: dream-erp
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - pg_dump -U postgres -h postgres -d dream_erp -Fc > /backups/backup-$(date +\%Y\%m\%d-\%H\%M\%S).dump
            volumeMounts:
            - name: backup-storage
              mountPath: /backups
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: postgres-backup-pvc
          restartPolicy: OnFailure
```

### Restore Procedures

```bash
# Restore from backup
kubectl cp backup.dump dream-erp/postgres-0:/tmp/
kubectl exec -it postgres-0 -n dream-erp -- \
  pg_restore -U postgres -d dream_erp -v /tmp/backup.dump

# Verify restored data
kubectl exec -it postgres-0 -n dream-erp -- \
  psql -U postgres -d dream_erp -c "SELECT COUNT(*) FROM b2b_purchase_order;"
```

### Maintenance Tasks

**Weekly VACUUM:**
```sql
VACUUM (ANALYZE, VERBOSE) b2b_purchase_order;
VACUUM (ANALYZE, VERBOSE) b2b_invoice;
VACUUM (ANALYZE, VERBOSE) b2b_webhook_queue;
```

**Monthly REINDEX:**
```sql
REINDEX TABLE CONCURRENTLY b2b_purchase_order;
REINDEX TABLE CONCURRENTLY b2b_invoice;
```

**Archive Audit Logs (>90 days):**
```sql
INSERT INTO b2b_audit_log_archive 
SELECT * FROM b2b_audit_log 
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM b2b_audit_log 
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## Monitoring & Alerts

### Checking Alert Status

```bash
# View all active alerts
kubectl exec -it prometheus-0 -n monitoring -- \
  promtool query instant "ALERTS{alertstate='firing'}"

# View specific alert
kubectl get PrometheusRule -n monitoring
kubectl describe PrometheusRule dream-erp-alerts -n monitoring
```

### Alert Response Matrix

| Alert | Severity | First Action |
|-------|----------|--------------|
| APIServiceDown | CRITICAL | 1. Check pod status<br>2. Check logs<br>3. Restart if needed |
| HighErrorRate | WARNING | 1. Check error logs<br>2. Assess database impact<br>3. Page on-call if > 5% |
| WebhookFailure | WARNING | 1. Check partner endpoint<br>2. Test network connectivity<br>3. Verify signature keys |
| DeadLetterQueueGrowing | CRITICAL | 1. Investigate webhook failures<br>2. Manual retry if safe<br>3. Escalate immediately |
| HighLatency | WARNING | 1. Check database performance<br>2. Review slow queries<br>3. Check resource usage |

### Key Metrics to Monitor

```
API Metrics:
- Request rate (requests/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- Active connections

Database Metrics:
- Query time (avg, p95)
- Connection count
- Cache hit ratio
- Transaction rate

B2B Metrics:
- PO intake rate (POs/min)
- Invoice generation rate (invoices/min)
- Webhook success rate (%)
- Dead letter queue size
```

### Accessing Dashboards

```
Grafana: https://grafana.dream-erp.local
Prometheus: https://prometheus.dream-erp.local
AlertManager: https://alertmanager.dream-erp.local
```

---

## Common Issues & Solutions

### Issue 1: API Pods in CrashLoopBackOff

**Diagnosis:**
```bash
kubectl describe pod <pod> -n dream-erp
kubectl logs <pod> -n dream-erp --previous
```

**Solutions:**
1. **Missing secrets:**
   ```bash
   kubectl get secrets -n dream-erp
   kubectl describe secret api-secrets -n dream-erp
   ```

2. **Database unavailable:**
   ```bash
   kubectl run db-test --image=postgres:15-alpine \
     -- psql -h postgres.dream-erp.svc -U postgres -c "SELECT 1;"
   ```

3. **Insufficient resources:**
   ```bash
   kubectl describe node <node>
   kubectl top nodes
   ```

**Recovery:**
```bash
kubectl rollout restart deployment/api -n dream-erp
kubectl rollout status deployment/api -n dream-erp
```

### Issue 2: Webhook Delivery Failing

**Diagnosis:**
```bash
# Check failed webhooks
kubectl exec -it <api-pod> -- npm run cli -- webhook list --status=FAILED

# Check partner endpoint
kubectl run curl --image=curlimages/curl \
  -- curl -v https://<partner-endpoint>
```

**Solutions:**
1. **Network connectivity:** Verify firewall rules allow outbound HTTPS
2. **Authentication:** Verify shared secrets match in database
3. **Partner errors:** Contact partner for endpoint validation

**Recovery:**
```bash
# Retry failed webhooks
npm run cli -- webhook retry --status=FAILED --retry_count=0
```

### Issue 3: High Database Query Time

**Diagnosis:**
```sql
SELECT query, calls, mean_time, max_time 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC 
LIMIT 10;
```

**Solutions:**
1. **Missing indexes:** Create needed indexes
2. **Table bloat:** Run `VACUUM ANALYZE`
3. **Connection exhaustion:** Increase pool size

### Issue 4: Memory Usage Growing

**Diagnosis:**
```bash
kubectl top pods -n dream-erp
kubectl exec <pod> -- node -e "console.log(process.memoryUsage())"
```

**Solutions:**
1. **Increase pod limits:**
   ```bash
   kubectl set resources deployment/api -n dream-erp \
     --limits=memory=1Gi
   ```

2. **Enable memory profiling:**
   ```bash
   NODE_DEBUG=memwatch npm start
   ```

3. **Identify memory leaks:**
   - Review recent code changes
   - Check for database connection leaks
   - Monitor Redis key expiration

---

## Disaster Recovery

### Rollback Procedures

**Application Rollback:**
```bash
# View deployment history
kubectl rollout history deployment/api -n dream-erp

# Rollback to previous version
kubectl rollout undo deployment/api -n dream-erp --to-revision=N

# Verify rollback
kubectl rollout status deployment/api -n dream-erp
```

**Database Rollback:**
```bash
# Restore from backup (see Backup Procedures section)
kubectl cp backup.dump dream-erp/postgres-0:/tmp/
kubectl exec postgres-0 -n dream-erp -- \
  pg_restore -U postgres -d dream_erp /tmp/backup.dump
```

### Data Recovery

```bash
# Point-in-time recovery
kubectl exec postgres-0 -n dream-erp -- \
  pg_basebackup -D /tmp/wal-backup -P -v

# Check WAL archives
ls -la /var/lib/postgresql/wal_archives/
```

### Complete System Failure

1. Restore cluster from backup
2. Restore database
3. Restart all services
4. Verify data integrity
5. Resume webhook delivery

---

## Performance Tuning

### Application Tuning

```bash
# Increase Node.js heap size
kubectl set env deployment/api -n dream-erp \
  NODE_OPTIONS="--max-old-space-size=512"

# Enable compression
kubectl set env deployment/api -n dream-erp \
  COMPRESSION_ENABLED=true

# Adjust connection pool
kubectl set env deployment/api -n dream-erp \
  DATABASE_POOL_MIN=10 \
  DATABASE_POOL_MAX=30
```

### Database Tuning

```sql
-- Create missing indexes
CREATE INDEX CONCURRENTLY idx_b2b_po_partner_date 
ON b2b_purchase_order(partner_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_b2b_webhook_status_retry
ON b2b_webhook_queue(status, next_retry_at);

-- Optimize queries
VACUUM ANALYZE;

-- Check query plans
EXPLAIN ANALYZE SELECT * FROM b2b_purchase_order 
WHERE partner_id = 'VENDOR-001' 
AND created_at > NOW() - INTERVAL '7 days';
```

### Redis Optimization

```bash
# Check memory usage
kubectl exec valkey-0 -n dream-erp -- redis-cli INFO memory

# Adjust max memory policy
kubectl exec valkey-0 -n dream-erp -- \
  redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Monitor hit rate
kubectl exec valkey-0 -n dream-erp -- redis-cli INFO stats
```

---

## Support & Emergency Contacts

### By Issue Type

**Deployment Issues:** DevOps Team
- Phone: +1-555-DEVOPS1
- Slack: @devops-oncall

**Database Issues:** DBA
- Phone: +1-555-DBA0001
- Slack: @database-admin

**Performance Issues:** Engineering Lead
- Phone: +1-555-ENG0001
- Slack: @performance-lead

**B2B Integration:** B2B Team
- Phone: +1-555-B2B0001
- Slack: @b2b-engineering

---

**Last Updated:** 2024-02-07
**Next Review:** 2024-02-21
