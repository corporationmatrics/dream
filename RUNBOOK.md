# Dream ERP Production Runbook

## Table of Contents
1. [Common Issues & Fixes](#common-issues--fixes)
2. [Monitoring & Alerts](#monitoring--alerts)
3. [Backup & Recovery](#backup--recovery)
4. [Scaling Operations](#scaling-operations)
5. [Database Maintenance](#database-maintenance)
6. [Performance Tuning](#performance-tuning)

---

## Common Issues & Fixes

### Issue: API Pods Not Starting

**Symptoms:** API pods in CrashLoopBackOff or Pending state

**Diagnosis:**
```bash
kubectl describe pod <pod-name> -n dream-erp
kubectl logs <pod-name> -n dream-erp
```

**Solutions:**

1. **Missing environment variables:**
   ```bash
   kubectl get secrets -n dream-erp
   kubectl describe secret api-secrets -n dream-erp
   ```
   - Verify DATABASE_URL and JWT_SECRET exist
   - Recreate if missing: `kubectl create secret generic api-secrets --from-literal=...`

2. **Database connectivity failed:**
   ```bash
   # Test database from pod
   kubectl run -it --rm debug --image=postgres:15-alpine --restart=Never -- \
     psql -h postgres.dream-erp.svc -U postgres -d dream_erp -c "SELECT 1;"
   ```
   - Check PostgreSQL service is running: `kubectl get svc postgres -n dream-erp`
   - Verify network policies allow communication

3. **Insufficient resources:**
   ```bash
   kubectl describe node <node-name>
   kubectl top nodes
   ```
   - Scale down other deployments or add more nodes
   - Check resource requests/limits in deployment

**Recovery:**
```bash
# Force restart
kubectl rollout restart deployment/api -n dream-erp
kubectl rollout status deployment/api -n dream-erp

# If still failing, check previous version
kubectl rollout history deployment/api -n dream-erp
kubectl rollout undo deployment/api -n dream-erp
```

---

### Issue: Webhook Delivery Failing

**Symptoms:** Webhooks stuck in FAILED status, high dead letter queue

**Diagnosis:**
```bash
# Check webhook queue
kubectl exec -it <api-pod> -n dream-erp -- \
  npm run cli -- db query "SELECT COUNT(*), status FROM b2b_webhook_queue GROUP BY status;"

# Check recent webhook logs
kubectl logs -f <api-pod> -n dream-erp | grep -i webhook
```

**Solutions:**

1. **Network connectivity to partner:**
   ```bash
   # Test from pod
   kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
     curl -v https://<partner-endpoint>
   ```
   - Contact partner to verify endpoint is accessible
   - Check firewall rules allow outbound HTTPS

2. **Authentication failure:**
   ```bash
   # Verify webhook signature
   npm run cli -- webhook validate <webhook-id>
   ```
   - Verify shared secret in database matches partner's key
   - Check X-Dream-Signature header format

3. **Partner endpoint returning errors:**
   ```bash
   # Inspect webhook response
   kubectl logs <api-pod> -n dream-erp | grep "webhook.*response"
   ```
   - Review partner logs for validation errors
   - Verify payload format matches partner's schema

**Recovery:**
```bash
# Retry failed webhooks (manual)
npm run cli -- webhook retry --status=FAILED --retry_count=0

# Or via Kubernetes job
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: webhook-retry-job
  namespace: dream-erp
spec:
  template:
    spec:
      containers:
      - name: retry
        image: ghcr.io/dream-erp/api:main
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: database-url
        command: ["npm", "run", "cli", "--", "webhook", "retry", "--status=FAILED"]
      restartPolicy: Never
EOF
```

---

### Issue: Database Performance Degradation

**Symptoms:** Queries taking > 200ms, high CPU usage

**Diagnosis:**
```bash
# Connect to PostgreSQL
kubectl exec -it postgres-0 -n dream-erp -- psql -U postgres -d dream_erp

-- Check long-running queries
SELECT pid, usename, state, query, query_start 
FROM pg_stat_activity 
WHERE state != 'idle' 
ORDER BY query_start;

-- Check slow query log
SELECT query, calls, mean_time, max_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check table bloat
SELECT schemaname, tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'b2b'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Solutions:**

1. **Missing indexes:**
   ```bash
   -- Create missing indexes
   CREATE INDEX CONCURRENTLY idx_b2b_po_partner_id 
   ON b2b_purchase_order(partner_id);
   
   CREATE INDEX CONCURRENTLY idx_b2b_invoice_po_id 
   ON b2b_invoice(po_id);
   ```

2. **Table bloat (needs VACUUM):**
   ```bash
   -- Manual vacuum
   VACUUM ANALYZE b2b_purchase_order;
   VACUUM ANALYZE b2b_invoice;
   
   -- Full reindex if severe
   REINDEX TABLE b2b_purchase_order;
   ```

3. **Connection pool exhausted:**
   ```bash
   -- Check connections
   SELECT count(*) FROM pg_stat_activity;
   
   -- Increase pool size in deployment
   kubectl set env deployment/api -n dream-erp \
     DATABASE_POOL_MIN=5 DATABASE_POOL_MAX=20
   ```

---

### Issue: High Memory Usage / OOM Errors

**Symptoms:** Pod killed with OOMKilled, Redis evicting keys

**Diagnosis:**
```bash
# Check pod memory
kubectl top pods -n dream-erp

# Check container limits
kubectl describe pod <pod-name> -n dream-erp | grep -A 5 "Limits"

# Check Redis memory
kubectl exec -it valkey-0 -n dream-erp -- redis-cli INFO memory
```

**Solutions:**

1. **Increase pod memory limits:**
   ```bash
   kubectl set resources deployment/api -n dream-erp \
     --limits=memory=1Gi,cpu=1000m \
     --requests=memory=512Mi,cpu=500m
   ```

2. **Increase Redis memory:**
   ```bash
   # Manual increase
   kubectl exec -it valkey-0 -- redis-cli CONFIG SET maxmemory 512mb
   
   # Persistent: Update helm values
   helm upgrade valkey bitnami/redis \
     --set master.arguments="--maxmemory 512mb"
   ```

3. **Memory leak investigation:**
   ```bash
   # Check Node.js heap
   kubectl exec <api-pod> -- node --expose-gc -e \
     "setInterval(() => global.gc(), 60000); require('.')"
   
   # Enable memory profiling
   NODE_DEBUG=memwatch npm start
   ```

---

## Monitoring & Alerts

### Checking Alert Status
```bash
# View all alerts
kubectl get PrometheusRule -n monitoring

# View alert manager config
kubectl get alertmanager -n monitoring

# Check alert firing
kubectl exec -it prometheus-0 -n monitoring -- \
  promtool query instant "ALERTS{alertstate='firing'}"
```

### Common Alert Responses

| Alert | Severity | Action |
|-------|----------|--------|
| APIServiceDown | CRITICAL | 1. Check pod status<br>2. Check logs<br>3. Restart pod if needed<br>4. Page on-call |
| APIHighErrorRate | WARNING | 1. Check error logs<br>2. Assess database/external service impact<br>3. Notify team if > 5% errors |
| WebhookDeliveryFailure | WARNING | 1. Check partner endpoint<br>2. Verify network connectivity<br>3. Inspect recent webhook logs |
| DeadLetterQueueGrowing | CRITICAL | 1. Investigate webhook failures<br>2. Manual retry if safe<br>3. Escalate to B2B team |
| PostgresHighConnections | WARNING | 1. Check active connections<br>2. Kill idle connections if safe<br>3. Scale up connection pool |

### Viewing Metrics

**Grafana Dashboard:**
1. Navigate to https://grafana.dream-erp.local
2. Login and select "Dream ERP" dashboard
3. Check key metrics:
   - API Request Rate & Latency
   - Error Rates (by service)
   - Database Performance
   - B2B Workflow Status

**Prometheus Direct Query:**
```bash
# API request rate (per second)
rate(http_requests_total[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate percentage
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Webhook success rate
rate(b2b_webhook_success_total[5m]) / rate(b2b_webhook_attempted_total[5m])
```

---

## Backup & Recovery

### Manual Database Backup

```bash
# Full backup
kubectl exec -it postgres-0 -n dream-erp -- \
  pg_dump -U postgres -d dream_erp -Fc > backup-$(date +%Y%m%d-%H%M%S).dump

# Backup to PVC
kubectl exec postgres-0 -n dream-erp -- \
  pg_dump -U postgres -d dream_erp -Fc -f /var/lib/postgresql/data/backups/dream_erp.dump

# Verify backup
pg_restore -l backup.dump | head -20
```

### Database Restore

```bash
# Restore from backup
kubectl cp backup.dump dream-erp/postgres-0:/tmp/
kubectl exec -it postgres-0 -n dream-erp -- \
  pg_restore -U postgres -d dream_erp /tmp/backup.dump

# Verify restored data
kubectl exec -it postgres-0 -n dream-erp -- \
  psql -U postgres -d dream_erp -c "SELECT COUNT(*) FROM b2b_purchase_order;"
```

### Point-in-Time Recovery

```bash
# Using WAL archives (if enabled)
kubectl exec -it postgres-0 -n dream-erp -- \
  pg_basebackup -D /mnt/wal-backup -P -v

# Create recovery configuration
cat > recovery.conf <<EOF
restore_command = 'cp /mnt/wal-archive/%f "%p"'
recovery_target_timeline = 'latest'
recovery_target_xid = '12345678'  # Replace with target XID
EOF
```

### Redis Backup/Restore

```bash
# Backup Redis
kubectl exec valkey-0 -n dream-erp -- \
  redis-cli BGSAVE

# Access backup file
kubectl cp dream-erp/valkey-0:/data/dump.rdb ./redis-backup.rdb

# Restore Redis
kubectl cp redis-backup.rdb dream-erp/valkey-0:/data/dump.rdb
kubectl exec valkey-0 -- redis-cli SHUTDOWN NOSAVE
kubectl delete pod valkey-0 -n dream-erp
# Pod will restart automatically
```

---

## Scaling Operations

### Horizontal Scaling (Increase Replicas)

```bash
# Scale API deployment
kubectl scale deployment api --replicas=5 -n dream-erp

# Or update manifest
kubectl set replicas deployment/api -n dream-erp --replicas=5

# Verify scaling
kubectl get pods -n dream-erp -l app=api
```

### Vertical Scaling (Increase Resource Limits)

```bash
# Increase API resource limits
kubectl set resources deployment/api -n dream-erp \
  --limits=memory=1Gi,cpu=1000m \
  --requests=memory=512Mi,cpu=500m

# Verify update
kubectl get deployment api -n dream-erp -o yaml | grep -A 10 "resources:"
```

### Auto-Scaling Configuration

```bash
# Create HorizontalPodAutoscaler
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
  minReplicas: 2
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

## Database Maintenance

### Regular Maintenance Schedule

**Daily:**
- Monitor slow queries
- Check database size growth
- Verify backups completed

**Weekly:**
- VACUUM ANALYZE on large tables
- Review table bloat
- Archive old audit logs

**Monthly:**
- REINDEX fragmented indexes
- Analyze query performance trends
- Update table statistics

### Executing Maintenance Tasks

```bash
# Connect to database
kubectl exec -it postgres-0 -n dream-erp -- psql -U postgres -d dream_erp

-- Run maintenance
VACUUM (ANALYZE, VERBOSE) b2b_purchase_order;
VACUUM (ANALYZE, VERBOSE) b2b_invoice;
VACUUM (ANALYZE, VERBOSE) b2b_webhook_queue;

-- Reindex if needed
REINDEX TABLE CONCURRENTLY b2b_purchase_order;

-- Update statistics
ANALYZE b2b_purchase_order;
ANALYZE b2b_invoice;
```

### Archive Old Audit Logs

```bash
-- Archive audit logs > 90 days old
INSERT INTO b2b_audit_log_archive 
SELECT * FROM b2b_audit_log 
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM b2b_audit_log 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Verify
SELECT COUNT(*) FROM b2b_audit_log_archive;
```

---

## Performance Tuning

### Query Optimization

```bash
-- Find slow queries
SELECT query, calls, mean_time, max_time 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC 
LIMIT 20;

-- Get query plan
EXPLAIN ANALYZE 
SELECT * FROM b2b_purchase_order 
WHERE partner_id = 'VENDOR-001' AND created_at > NOW() - INTERVAL '7 days';
```

### Connection Pool Tuning

```bash
# Increase connection pool for API
kubectl set env deployment/api -n dream-erp \
  DATABASE_POOL_MIN=10 \
  DATABASE_POOL_MAX=30 \
  DATABASE_POOL_IDLE_TIMEOUT=30000 \
  DATABASE_POOL_CONNECTION_TIMEOUT=5000
```

### Cache Optimization

```bash
# Monitor Redis memory
kubectl exec valkey-0 -n dream-erp -- redis-cli INFO memory

# Adjust eviction policy if needed
kubectl exec valkey-0 -n dream-erp -- \
  redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Application Tuning

```bash
# Increase Node.js max heap
kubectl set env deployment/api -n dream-erp \
  NODE_OPTIONS="--max-old-space-size=512"

# Enable compression for responses
NODE_ENV=production npm start
```

---

## Emergency Procedures

### Data Breach Response
1. Isolate affected services immediately
2. Rotate all secrets and API keys
3. Review audit logs for unauthorized access
4. Notify compliance team
5. Document timeline and actions taken

### System Down Response
1. Assess scope (API only, database, infrastructure)
2. Check monitoring/alerts for root cause
3. Implement quick fix or rollback
4. Notify stakeholders with ETA
5. Document incident for postmortem

### Performance Crisis Response
1. Check real-time metrics (CPU, memory, disk)
2. Identify bottleneck (database, API, network)
3. Scale horizontally if resource constrained
4. Kill long-running queries if needed
5. Implement temporary rate limiting if necessary

---

## Contact Information

**On-Call DevOps Engineer:** 
- Phone: +1-555-DEVOPS1
- Slack: @devops-oncall
- Escalation: manager@company.com

**Database Administrator:**
- Phone: +1-555-DBA0001
- Slack: @dba-primary

**B2B Engineering Lead:**
- Phone: +1-555-B2B0001
- Slack: @b2b-lead

---

*Last Updated: 2024-02-07*
*Next Review: 2024-02-21*
