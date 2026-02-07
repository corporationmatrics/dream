# Grafana Dashboards Setup Guide

## Overview

This directory contains pre-configured Grafana dashboards for monitoring the ERP platform. They provide real-time visibility into business metrics, operations, and logistics performance.

## Dashboards Included

### 1. **Business Metrics** (`erp-business-metrics.json`)
Real-time business KPIs and performance indicators:
- **Request Rate by Status**: Distribution of API requests by HTTP status (2xx, 4xx, 5xx)
- **API Latency (P95)**: 95th percentile response time in milliseconds
- **Request Rate Over Time**: Hourly request volume trend
- **Credit Requests (1h)**: Credit approval/rejection status breakdown
- **Successful Payments by Method**: UPI, card, net banking distribution
- **Payment Success Rate**: Overall payment gateway success percentage with thresholds

**Use Case**: Monitor platform health, user activity, and payment funnel conversion.

---

### 2. **Operations & Infrastructure** (`erp-operations-metrics.json`)
System performance and resource utilization:
- **API Latency Percentiles**: P50, P95, P99 response times over time
- **Error Rate Over Time**: 4xx and 5xx error trends
- **5xx Error Rate (%)**: Critical server error percentage with alerting
- **Database Query Performance**: Database query P95 latency
- **Request Distribution (1h)**: Hourly breakdown by method and status
- **Database Connection Pool Usage**: PostgreSQL connection pool percentage

**Use Case**: Diagnose performance bottlenecks, track system health, and capacity planning.

---

### 3. **Logistics & Delivery** (`erp-logistics-metrics.json`)
Logistics network and fulfillment performance:
- **Delivery Time vs SLA Target**: Actual vs promised delivery times by zone
- **Completed Deliveries by Zone (1h)**: Geographic distribution of completions
- **SLA Compliance Rate (%)**: Percentage of deliveries meeting SLA with green/yellow/red zones
- **Vehicle Fleet Utilization**: Real-time utilization of delivery vehicles
- **Delivery Completions & Violations (1h)**: Completed deliveries vs SLA misses
- **Deliveries by Status**: Current status breakdown (pending, in-transit, delivered, failed)

**Use Case**: Monitor delivery performance, optimize fleet utilization, and track SLA compliance.

---

## Import Instructions

### Step 1: Access Grafana
```
URL: http://localhost:3001
Default Username: admin
Default Password: admin
```

### Step 2: Import Dashboards

**Option A: Via Grafana UI**
1. Click **"+"** icon → **"Import"**
2. Copy entire JSON content from any dashboard file
3. Paste into **Import via panel JSON**
4. Select **Prometheus** as data source
5. Click **Import**

**Option B: Via Docker Volume (Automatic)**
1. Mount dashboard directory in docker-compose.yml:
```yaml
grafana:
  volumes:
    - ./grafana-dashboards:/etc/grafana/provisioning/dashboards
    - ./grafana-dashboards.yml:/etc/grafana/provisioning/dashboards/dashboards.yml
```

2. Create `grafana-dashboards.yml`:
```yaml
apiVersion: 1
providers:
  - name: 'Default'
    orgId: 1
    folder: 'ERP'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
```

### Step 3: Configure Prometheus Data Source
1. Go to **Configuration** → **Data Sources**
2. Click **Add data source**
3. Select **Prometheus**
4. URL: `http://prometheus:9090` (or `http://host.docker.internal:9090`)
5. Click **Save & Test**

---

## Metric Sources

### From NestJS API Interceptor
Automatically collected on every HTTP request:
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_total` - Total request count by status/method

### Custom Business Metrics
Manually instrumented in application code:
- `credit_requests_total` - Credit approval requests
- `successful_payments_total` - Successful payment count by method
- `failed_payments_total` - Failed payment count
- `orders_created_total` - Order volume
- `deliveries_completed_total` - Completed deliveries
- `delivery_sla_violations_total` - SLA misses
- `vehicle_utilization_percent` - Fleet utilization

### From Database Exporters
PostgreSQL metrics via pg_exporter:
- `pg_stat_activity_count` - Active connections
- `pg_settings_max_connections` - Max connection limit
- `database_query_duration_seconds` - Query performance

---

## Dashboard Features

### Thresholds & Visualization
Each dashboard uses color-coded thresholds:
- **Green**: Healthy (< target)
- **Yellow**: Warning (approaching threshold)
- **Red**: Critical (exceeds threshold)

### Time Range
Default: **Last 6 hours**
Customizable in top-right time picker

### Legend Options
- **Show/Hide**: Click legend items to toggle visibility
- **Calculations**: Mean, Max, Min, Sum displayed automatically
- **Drill-down**: Click legend items for detailed analysis

---

## Integration with Alerts

These dashboards work with `prometheus-alerts.yml` alert rules:

| Alert | Dashboard | Threshold |
|-------|-----------|-----------|
| HighAPILatency | Operations | P95 > 1s |
| HighErrorRate | Operations | 5xx rate > 5% |
| DatabaseConnectionLimit | Operations | Conn% > 80% |
| LowPaymentSuccessRate | Business | < 95% |
| SLAViolations | Logistics | > 10% in 1h |
| HighVehicleUtilization | Logistics | > 95% |

When alerts fire, they appear as annotations on dashboards.

---

## Customization Guide

### Add a New Panel
1. Click **Add panel** → **Empty panel**
2. In **Metrics** tab, write PromQL query:
   ```promql
   rate(http_requests_total[1m])
   ```
3. Configure visualization (graph, gauge, table, etc.)
4. Set panel title and description
5. Click **Save**

### Example: Add Cache Hit Rate
```promql
redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total)
```

### Change Time Range
1. Click time picker (top-right)
2. Select preset (5m, 15m, 1h, 6h, 24h, 7d)
3. Or enter custom range

### Export Dashboard
1. Click dashboard settings (gear icon)
2. Select **Save as** → **Export**
3. Copy JSON for sharing with team

---

## PromQL Query Reference

### HTTP Metrics
```promql
# Request rate
rate(http_requests_total[5m])

# Error percentage
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) * 1000
```

### Business Metrics
```promql
# Credit approval rate
rate(credit_requests_total{status="approved"}[1h]) / rate(credit_requests_total[1h]) * 100

# Payment success rate
rate(successful_payments_total[1h]) / (rate(successful_payments_total[1h]) + rate(failed_payments_total[1h])) * 100
```

### Delivery Metrics
```promql
# SLA compliance
100 - (rate(delivery_sla_violations_total[1h]) / rate(deliveries_completed_total[1h]) * 100)
```

---

## Troubleshooting

### No Data Appears
1. ✅ Verify Prometheus scraping `/metrics` endpoint:
   - http://localhost:9090/targets
2. ✅ Check API is running and metrics collecting:
   - http://localhost:3002/metrics
3. ✅ Verify data source URL is correct in Grafana settings

### Metrics Not Updating
1. Refresh page (Ctrl+Shift+R)
2. Check Prometheus datasource health:
   - Configuration → Data Sources → Prometheus → Test Connection
3. Verify metric names match those in Prometheus:
   - http://localhost:9090/graph

### Dashboard Import Failed
1. Ensure valid JSON formatting (use https://jsonlint.com/)
2. Check Prometheus datasource exists before import
3. Try importing via file upload instead of paste

---

## Monitoring Best Practices

### Daily Reviews
- Check **Business Metrics** dashboard before standup
- Monitor **Operations** latency and errors
- Review **Logistics** SLA compliance

### Weekly Analysis
- Trend analysis using **Relative Time Range** (7 days)
- Compare peak vs off-peak traffic patterns
- Identify recurring performance issues

### Alert Response
1. Dashboard alert fires
2. Check relevant dashboard panel
3. Review application logs
4. Implement fix if needed
5. Verify metric returns to normal

### Capacity Planning
- Monitor **Vehicle Utilization** trend
- Track **API Latency** as load increases
- Plan scale-up when P95 latency > 800ms

---

## API Metrics Documentation

See [metrics.ts](../erp-api/src/monitoring/metrics.ts) for complete metric definitions and labels.

Key metric categories:
- HTTP Request Tracking (50+ variants)
- Credit Ledger Operations
- Payment Processing
- Order Management
- Product Catalog
- Logistics & Delivery
- Database Performance
- System Health

---

## Team Access & Permissions

### Production Environment
- **Viewers**: Can view dashboards only
- **Editors**: Can modify dashboards
- **Admins**: Full platform access

To manage team access:
1. Settings (gear) → Users/Teams
2. Add team members with appropriate role
3. Grant folder permissions as needed

---

## Support

For dashboard-related questions:
- Check each dashboard's title and description
- Review metric source documentation
- Verify Prometheus data source connectivity
- Check application logs for metric emission errors

Last Updated: 2024
ERP Platform Monitoring
