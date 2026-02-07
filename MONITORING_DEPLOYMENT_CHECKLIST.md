# Monitoring Stack Deployment Checklist

## ✅ Pre-Flight Checks

- [ ] Docker Desktop is installed and running
- [ ] NestJS API code is compiled (0 TypeScript errors)
- [ ] PostgreSQL database is initialized with tables
- [ ] All `.env` files configured with database credentials
- [ ] No conflicts on ports: 3002 (API), 9090 (Prometheus), 3001 (Grafana)

---

## 🚀 Step 1: Start Infrastructure Services

### Terminal 1: Start Docker Compose
```bash
cd erp-infrastructure
docker-compose down -v  # Clean slate if needed
docker-compose up -d
```

**Expected Output:**
```
Creating erp-postgres ... done
Creating erp-keydb ... done
Creating erp-minio ... done
Creating erp-meilisearch ... done
Creating erp-prometheus ... done
Creating erp-grafana ... done
Creating postgres-exporter ... done
Creating redis-exporter ... done
```

### Verify Services
```bash
docker ps -a
```

You should see 8 containers running:
- `erp-postgres` (5432)
- `erp-keydb` (6379)
- `erp-minio` (9000)
- `erp-meilisearch` (7700)
- `erp-prometheus` (9090)
- `erp-grafana` (3001)
- postgres-exporter (9187)
- redis-exporter (9121)

---

## 🚀 Step 2: Start NestJS API

### Terminal 2: Start API Server
```bash
cd erp-api
npm install  # If not done
npm run start:dev
```

**Expected Output:**
```
[Nest] ... Application successfully started on port 3002
```

### Verify API is Running
```bash
curl http://localhost:3002/metrics
```

You should see Prometheus-formatted metrics output:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200",route="/products"} 42
...
```

---

## 🚀 Step 3: Verify Prometheus Configuration

### Check Prometheus Targets
1. Open http://localhost:9090/targets
2. You should see 6 job configurations:
   - ✅ prometheus (state: UP)
   - ✅ erp-api (state: UP)
   - ✅ erp-web (state: UP or DOWN if not started)
   - ✅ postgres (state: UP)
   - ✅ redis (state: UP)
   - ✅ minio (state: UP)

### Check Alert Rules
1. Open http://localhost:9090/alerts
2. You should see 11 alert rules loaded:
   - ✅ HighAPILatency
   - ✅ HighErrorRate
   - ✅ DatabaseConnectionLimit
   - ✅ RedisMemoryUsage
   - ✅ LowPaymentSuccessRate
   - ✅ HighCreditDefaultRate
   - ✅ SLAViolations
   - ✅ HighVehicleUtilization
   - And 3 more...

State will be **PENDING** until thresholds are crossed.

---

## 🚀 Step 4: Setup Grafana

### Access Grafana
1. Open http://localhost:3001
2. Login with:
   - **Username**: `admin`
   - **Password**: `admin`
3. You'll be prompted to change password (optional)

### Step 4a: Configure Data Source
1. Go to **Configuration** (gear icon left sidebar)
2. Select **Data Sources**
3. Click **Add data source**
4. Choose **Prometheus**
5. Set URL: `http://host.docker.internal:9090`
   - (Or `http://prometheus:9090` if inside Docker)
6. Click **Save & Test**
   - Should show: ✅ "Data source is working"

### Step 4b: Import Dashboards

**Option A: Manual Import (Recommended for first-time)**
```bash
# From your project folder, copy each dashboard JSON
# Then use Grafana UI to import
```

1. Click **"+"** (Create icon) → **Import**
2. Upload or paste `erp-business-metrics.json`
3. Select **Prometheus** datasource
4. Click **Import**
5. Repeat for other 2 dashboards

**Option B: Provision via Files (Automated)**
1. Create folder: `erp-infrastructure/grafana-provisioning/`
2. Place dashboards there
3. Restart Grafana: `docker restart erp-grafana`

---

## 🚀 Step 5: Generate Sample Metrics

### Option A: Make API Calls to Generate Data
```bash
# Terminal 3: Generate traffic
for i in {1..100}; do
  curl http://localhost:3002/products
  curl http://localhost:3002/products/1
  sleep 0.5
done
```

### Option B: Run Full Test Suite
```bash
cd erp-api
npm run test  # Runs e2e tests that generate metrics
```

---

## ✅ Verification Checklist

### Prometheus Metrics Available
- [ ] http://localhost:9090/api/v1/query?query=http_requests_total
- [ ] http://localhost:9090/api/v1/query?query=http_request_duration_seconds_bucket
- [ ] http://localhost:9090/api/v1/query?query=pg_stat_activity_count

### Grafana Dashboards Imported
- [ ] Business Metrics dashboard visible
- [ ] Operations & Infrastructure dashboard visible
- [ ] Logistics & Delivery dashboard visible

### All Data Sources Connected
- [ ] Prometheus shows green checkmark
- [ ] At least one metric with data in last 5 minutes

### Alerts Configured
- [ ] All 11 alerts loaded in Prometheus
- [ ] Grafana Alerting can reach notification channels (when configured)

---

## 📊 Initial Data Population

**Timeline to First Metrics:**
- Immediately: System metrics (Prometheus self-monitoring)
- 15 seconds: API metrics (first scrape interval)
- 30 seconds: Database metrics (pg_exporter)
- 1 minute: Business metrics appear on dashboards
- 5+ minutes: Trends become visible

**Dashboard Data Appearance:**
- Gauges (P95 Latency): Appear immediately if API running
- Time-series graphs: Need 3+ data points (45 seconds minimum)
- Pie charts: Need at least 1 scraped metric

---

## 🔧 Troubleshooting During Setup

### "Prometheus targets show DOWN"
```bash
# Check if services are healthy
docker logs erp-prometheus  # Look for scrape errors
docker logs erp-postgres    # Check if postgres is accessible
```

### "No metrics in Grafana"
```bash
# Verify API is actually exposing metrics
curl http://localhost:3002/metrics | head -20

# If empty, restart NestJS:
# Terminal 2: Ctrl+C, then npm run start:dev
```

### "Grafana can't connect to Prometheus"
1. Use `http://prometheus:9090` for Docker-to-Docker communication
2. Use `http://host.docker.internal:9090` for host machine access
3. Use `http://localhost:9090` for WSL2 access

### Port Already in Use
```bash
# Find process using port 3001
netstat -ano | findstr :3001  # Windows
lsof -i :3001                  # Mac/Linux

# Kill process if needed
taskkill /PID <PID> /F  # Windows
```

---

## 🎯 Success Indicators

### ✅ Green Checkmarks
1. **Prometheus targets**: All show `UP` state with low scrape latency
2. **Grafana datasource**: Shows "Data source is working"
3. **Dashboards load**: All panels display data (not "No data")
4. **Metrics exist**: Each dashboard has at least one metric with values

### 📈 Data Visible
1. **Request Rate**: Shows increasing values as you use API
2. **API Latency**: Gauges show millisecond values (not empty)
3. **Error Rate**: Shows 0% or small percentage
4. **Database Metrics**: Connection pool shows 1-10 connections

### 🔔 Alerts Ready
1. **Prometheus Alerts page**: Shows all 11 rules in INACTIVE state
2. Rules will change to PENDING/FIRING if thresholds exceeded
3. No errors in Prometheus logs

---

## 📱 Next Steps After Setup

### Day 1: Verification
- [ ] All dashboards load without errors
- [ ] Metrics updating in real-time (watch graphs)
- [ ] Alerts page shows rules correctly

### Day 2-3: Customization
- [ ] Add custom panels for business KPIs
- [ ] Configure Slack/Email notifications
- [ ] Set up on-call rotation for alerts

### Week 1: Integration
- [ ] Add application performance monitoring (APM)
- [ ] Configure dashboard permissions for team
- [ ] Create runbooks for alert responses

### Week 2+: Optimization
- [ ] Fine-tune alert thresholds based on traffic
- [ ] Add custom metrics for new features
- [ ] Extend data retention in Prometheus

---

## 📞 Support Resources

### Useful URLs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **API Metrics**: http://localhost:3002/metrics
- **API Health**: http://localhost:3002/metrics/health

### Documentation
- [Grafana Dashboards README](./grafana-dashboards/README.md)
- [Prometheus Configuration](./prometheus.yml)
- [Alert Rules](./prometheus-alerts.yml)
- [NestJS Metrics Module](../erp-api/src/monitoring/)

### Logs
```bash
# View service logs
docker logs erp-prometheus
docker logs erp-grafana
docker logs erp-postgres

# Watch API metrics in real-time
watch -n 1 'curl http://localhost:3002/metrics | grep http_requests_total'
```

---

## 📋 Post-Deployment Checklist

- [ ] All containers running without restart loops
- [ ] Prometheus scraping all 6 targets successfully
- [ ] Grafana can connect to Prometheus
- [ ] All 3 dashboards imported and showing data
- [ ] Alert rules loaded (11/11 visible in Prometheus)
- [ ] No errors in browser console (F12 → Console)
- [ ] API metrics endpoint responding in < 100ms
- [ ] Sample metrics visible when making API calls
- [ ] Time-series graphs update every 15 seconds
- [ ] Team access configured (if multi-user environment)

---

**Estimated Total Setup Time: 15-30 minutes**

- Infrastructure startup: 5 min
- API startup: 2 min
- Prometheus verification: 3 min
- Grafana setup: 5 min
- Dashboard import: 5 min
- Verification: 5 min

**You're ready to monitor! 🎉**

Status: [READY FOR DEPLOYMENT]
Last Updated: 2024
