# Monitoring System Quick Reference

## 🎯 Quick Links

| Component | URL | Port | Status |
|-----------|-----|------|--------|
| API Metrics | http://localhost:3002/metrics | 3002 | /metrics |
| API Health | http://localhost:3002/metrics/health | 3002 | /metrics/health |
| Prometheus | http://localhost:9090 | 9090 | /targets, /alerts, /graph |
| Grafana | http://localhost:3001 | 3001 | admin/admin |
| Prometheus Alerts | http://localhost:9090/alerts | 9090 | Alert Rules List |
| Prometheus Targets | http://localhost:9090/targets | 9090 | Scrape Status |

---

## 📊 Dashboard Quick Guide

### Business Metrics Dashboard
**Purpose**: Track revenue, payments, user activity, and conversion funnel

| Metric | What It Means | Green Zone | Yellow | Red |
|--------|---------------|-----------|--------|-----|
| Request Rate | API calls/sec | > 10/sec | 5-10 | < 5 |
| P95 Latency | 95% responses < X ms | < 500ms | 500-1000 | > 1000ms |
| Error Rate | Failed requests % | < 1% | 1-5% | > 5% |
| Payment Success | Successful payments % | > 99% | 95-99% | < 95% |
| Credit Approvals | Approved credits % | > 85% | 70-85% | < 70% |

### Operations Dashboard
**Purpose**: Monitor infrastructure health, database performance, errors

| Component | Metric | Action If Red |
|-----------|--------|---------------|
| API | P99 Latency > 2s | Check slow database queries |
| API | 5xx Errors > 5% | Review application logs |
| Database | Connections > 80% | Optimize connection pooling |
| Database | Query P95 > 500ms | Add indexes, optimize queries |
| Memory | Redis > 80% | Clear cache or upgrade instance |

### Logistics Dashboard
**Purpose**: Track delivery performance, SLA compliance, fleet utilization

| KPI | Target | Warning | Critical |
|-----|--------|---------|----------|
| SLA Compliance | > 98% | 95-98% | < 95% |
| Avg Delivery Time | < 30min | 30-45min | > 45min |
| Vehicle Utilization | 75-85% | 85-95% | > 95% |
| On-Time Rate | > 95% | 90-95% | < 90% |

---

## 🔧 Common Tasks

### Check If System Is Healthy
```bash
# Quick health check
curl http://localhost:3002/metrics/health

# Expected response: 200 OK with uptime, version info
```

### View Current Request Rate
```bash
# In Prometheus Query Editor (http://localhost:9090/graph)
rate(http_requests_total[1m])
```

### Check Error Rate
```promql
# Percentage of 5xx errors
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100
```

### Monitor Payment Processing
```promql
# Payment success rate (last hour)
rate(successful_payments_total[1h]) / (rate(successful_payments_total[1h]) + rate(failed_payments_total[1h])) * 100
```

### Check Database Performance
```promql
# Average query time
histogram_quantile(0.50, rate(database_query_duration_seconds_bucket[5m])) * 1000
```

### View Delivery SLA Compliance
```promql
# SLA violation rate
rate(delivery_sla_violations_total[1h]) / rate(deliveries_completed_total[1h]) * 100
```

---

## 🚨 Alert Rules Reference

| Alert Name | Triggers When | Severity | Action |
|------------|---------------|----------|--------|
| HighAPILatency | P95 latency > 1s | Warning | Check application logs, look for slow queries |
| HighErrorRate | 5xx errors > 5% | Critical | Immediate investigation, check error logs |
| DatabaseConnectionLimit | Connections > 80% | Warning | Monitor and plan connection pool increase |
| RedisMemoryUsage | Redis usage > 80% | Warning | Clear cache sessions or upgrade Redis |
| LowPaymentSuccessRate | Success rate < 95% | Critical | Check payment gateway status/logs |
| HighCreditDefaultRate | Defaults > 5% | Critical | Review credit policies, adjust risk model |
| SLAViolations | > 10% in 1h | Warning | Allocate additional delivery resources |
| HighVehicleUtilization | > 95% | Warning | Check fleet capacity, consider adding vehicles |

### When Alert Fires
1. Alert appears in Prometheus `/alerts` page (FIRING state)
2. Visible as red/orange line on dashboard
3. Notification sent to configured channels (Slack, email, etc.)
4. Check dashboard → Review logs → Execute fix

---

## 📈 Common Queries

### Daily Active Users
```promql
increase(active_user_sessions[24h])
```

### Order Pipeline
```promql
# Orders created today
increase(orders_created_total[24h])

# Average order value
sum(order_total_rupees[24h]) / increase(orders_created_total[24h])
```

### Credit Risk
```promql
# Credit limits exhausted percentage
(credit_limit_utilization_pct / 100) * credit_requests_total

# Default rate trend
rate(credit_defaults_total[24h]) / rate(credit_requests_total[24h]) * 100
```

### Logistics Network
```promql
# Deliveries completed per hour
increase(deliveries_completed_total[1h])

# Average time vs SLA
histogram_quantile(0.50, delivery_time_vs_eta_minutes) - 0
```

---

## 🔌 Metric Categories

### HTTP Metrics (Auto-collected)
- `http_requests_total` - Request count by method/status/route
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_total{status=~"5.."}` - Server errors
- `http_requests_total{status=~"4.."}` - Client errors

### Credit Ledger Metrics
- `credit_requests_total` - Total credit requests
- `credit_approved_pct` - Approval percentage
- `credit_limit_utilization_pct` - Credit exhaustion rate
- `credit_defaults_total` - Default count
- `credit_overdue_days` - Overdue amount tracking

### Payment Metrics
- `successful_payments_total` - Completed payments by method
- `failed_payments_total` - Failed payment count
- `payment_processing_duration_seconds` - Processing time
- `payment_revenue_rupees` - Total payment value

### Order Metrics
- `orders_created_total` - New orders
- `order_total_rupees` - Order value
- `order_processing_duration_minutes` - Fulfillment time
- `orders_pending_count` - Current backlog

### Product Metrics
- `product_searches_total` - Search queries
- `product_views_total` - Product views
- `product_inventory_count` - Stock levels
- `stockout_products_count` - Out of stock items

### Delivery Metrics
- `deliveries_completed_total` - Delivered packages
- `delivery_time_vs_eta_minutes` - Performance vs target
- `delivery_sla_violations_total` - Missed SLA
- `vehicle_utilization_percent` - Fleet usage

### Database Metrics
- `database_query_duration_seconds` - Query performance
- `pg_stat_activity_count` - Active connections
- `pg_connections_max` - Connection limit

---

## 🛠️ Troubleshooting

### Dashboard Shows "No Data"
```bash
# 1. Check API is returning metrics
curl http://localhost:3002/metrics | grep http_requests

# 2. Check Prometheus scraping API
# Go to http://localhost:9090/targets
# Look for erp-api job state

# 3. Check metric exists in Prometheus
# Go to http://localhost:9090/graph
# Query: http_requests_total
# Should return results
```

### Prometheus Targets Show DOWN
```bash
# 1. Check service is running
docker ps | grep prometheus
docker ps | grep postgres

# 2. Check logs
docker logs erp-prometheus
docker logs erp-postgres

# 3. Verify port is accessible
curl http://localhost:9090/_status/raft
```

### Grafana Can't Access Prometheus
```bash
# 1. Check connection URL in Grafana
# Settings → Data Sources → Prometheus
# Try: http://host.docker.internal:9090

# 2. Test from Grafana container
docker exec erp-grafana curl http://prometheus:9090/-/healthy

# 3. Restart if needed
docker restart erp-grafana
```

---

## 📊 Interpreting Graphs

### Line Graph (Time Series)
- **X-axis**: Time
- **Y-axis**: Metric value
- **Rising line**: Increasing metric
- **Flat line**: No change or no data collection
- **Spikes**: Temporary events (traffic surge, error)

### Gauge
- **Green**: Healthy (within target)
- **Yellow**: Warning (approaching threshold)
- **Red**: Critical (over threshold)
- **Needle position**: Current value as percentage

### Pie Chart
- **Slice size**: Proportion of total
- **Value in legend**: Actual count
- **All slices**: Distribution breakdown

### Table
- **Rows**: Separate instances/labels
- **Columns**: Metric values and statistics
- **Last entry**: Most recent reading
- **Sum/Mean**: Aggregate across table

---

## ⏱️ Retention & Data

### Data Retention
- **Prometheus**: 15 days (default, configurable)
- **Grafana**: No limit (queries historical Prometheus data)
- **Dashboards**: Stored in Grafana database

### Update Frequency
- **Scrape interval**: 15 seconds (all metrics)
- **Chart refresh**: Auto (5-10 seconds typical)
- **Alert evaluation**: 15 seconds

### Data Accuracy
- **Histograms**: Approximate due to bucketing
- **Counters**: Exact (always increasing)
- **Gauges**: Point-in-time only

---

## 🔐 Security Notes

### Default Credentials
- **Grafana**: admin/admin (change immediately in production)
- **Prometheus**: No authentication (use reverse proxy)

### Production Hardening
1. Enable Grafana authentication
2. Restrict Prometheus access to internal network
3. Enable HTTPS/TLS for all connections
4. Set data retention per compliance needs
5. Enable audit logging in Grafana

---

## 📚 Documentation

- **Full Dashboards Guide**: [grafana-dashboards/README.md](./erp-infrastructure/grafana-dashboards/README.md)
- **Deployment Steps**: [MONITORING_DEPLOYMENT_CHECKLIST.md](./MONITORING_DEPLOYMENT_CHECKLIST.md)
- **NestJS Metrics Code**: [erp-api/src/monitoring/metrics.ts](./erp-api/src/monitoring/metrics.ts)
- **Prometheus Config**: [erp-infrastructure/prometheus.yml](./erp-infrastructure/prometheus.yml)
- **Alert Rules**: [erp-infrastructure/prometheus-alerts.yml](./erp-infrastructure/prometheus-alerts.yml)

---

## 🆘 Getting Help

### Common Issues Checklist
- [ ] Restarted service (Ctrl+C, npm run start:dev)?
- [ ] Checked docker ps for stopped containers?
- [ ] Verified metrics endpoint: curl http://localhost:3002/metrics?
- [ ] Checked Prometheus targets: http://localhost:9090/targets?
- [ ] Reviewed error logs: docker logs [service-name]?
- [ ] Tried browser hard refresh: Ctrl+Shift+Del?

### Useful Commands
```bash
# See all running containers
docker ps

# View service logs
docker logs erp-prometheus -f  # -f for follow

# Restart service
docker restart erp-prometheus

# Check port in use
lsof -i :3001  # Mac
netstat -ano | findstr :3001  # Windows

# Rebuild Prometheus config (after editing prometheus.yml)
docker-compose up -d --force-recreate erp-prometheus
```

---

**Last Updated**: 2024
**Next Review**: Monthly
**Owner**: DevOps/Platform Team
