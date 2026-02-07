# Quick Reference - Architecture & Deployment Guide
**Version:** 1.0 | **Date:** February 4, 2026

---

## 📋 Files in This Repository

| File | Purpose | Audience |
|------|---------|----------|
| **readme.md** | Original comprehensive tech stack analysis | Technical leads, architects |
| **FINAL_README.md** | Final approved stack with all decisions | Everyone - START HERE |
| **ROADMAP.md** | 24-month detailed implementation plan | PMs, tech leads, engineers |
| **COMPATIBILITY_ANALYSIS.md** | Stack compatibility deep-dive | Architects, senior engineers |
| **DEPLOYMENT_GUIDE.md** | DevOps deployment instructions | DevOps engineers |
| **QUICK_REFERENCE.md** | This file - quick lookup | Everyone |

---

## 🎯 Phase Overview

```
Phase 1: MVP (0-6 months)
├── Core ERP functionality
├── Web + Mobile apps
├── Authentication + Authorization
└── 1K-10K users

Phase 2: Scale (6-12 months)
├── Mobile app advanced features
├── Analytics & BI
├── Kafka event streaming
└── 10K-50K users

Phase 3: Optimize (12-18 months)
├── ML models (fraud, forecasting)
├── GPS tracking + IoT
├── Database scaling
└── 50K-100K users

Phase 4: Enterprise (18-24 months)
├── Blockchain integration
├── Advanced integrations
├── Multi-region deployment
└── 100K-500K users
```

---

## 🏗️ Approved Technology Stack

### Backend Services
```
API Layer:              NestJS (Node.js) ✅
Core Services:         Spring Boot (selective) ✅
ML/Analytics:           FastAPI (Python) ⏳
API Gateway:            Apache APISIX ✅
Message Queue (MVP):    BullMQ (Redis) ✅
Message Queue (Scale):  Kafka ⏳ Month 11
```

### Databases & Storage
```
Primary:                PostgreSQL 15+ ✅
Cache/Real-time:        KeyDB ✅
Search:                 Meilisearch ✅
Object Storage:         MinIO ✅
Time-series (Phase 2):  TimescaleDB ✅
Data Warehouse (Ph 2):  ClickHouse ✅
```

### Frontend & Mobile
```
Web Framework:          Next.js 14 + React 18 ✅
UI Components:          shadcn/ui ✅
State Management:       Zustand ✅
Mobile:                 React Native + Expo ✅
Styling:                TailwindCSS ✅
```

### Authentication & Security
```
IAM:                    Keycloak ✅
Secrets:                GitLab Secrets + Vault ✅
API Security:           OWASP ZAP ✅
```

### DevOps & Infrastructure
```
Container Orchestration: Kubernetes (K3s for MVP) ✅
Container Runtime:      Docker ✅
CI/CD:                  GitLab CI/CD ✅
Infrastructure:         Terraform / OpenTofu ✅
Monitoring:             Prometheus + Grafana ✅
Logs:                   Loki ✅
Tracing (Phase 2):      Jaeger ✅
```

### Specialized Tools
```
OCR:                    PaddleOCR ✅
Reverse Auctions:       Custom NestJS + KeyDB ✅
GPS Tracking (Ph 2):    Traccar ✅
Routing (Ph 2):         OSRM / GraphHopper ✅
Fraud Detection (Ph 3): PyOD ✅
Demand Forecasting:     Prophet / NeuralProphet ✅
Analytics (Ph 2):       Apache Superset ✅
Workflow (Ph 3):        n8n ✅
Blockchain (Ph 4):      Hyperledger Fabric ✅
IoT (Ph 4):             ThingsBoard ✅
```

---

## 🚀 Getting Started (Month 0)

### Week 1-2: Infrastructure Setup
```bash
# 1. Initialize Git repos
git clone <nestjs-api>
git clone <spring-boot-service>
git clone <nextjs-web>
git clone <expo-mobile>

# 2. Set up Docker
docker-compose up -d postgresql keyrdb minio

# 3. Start K3s cluster
curl -sfL https://get.k3s.io | sh -

# 4. Install GitLab Runner
gitlab-runner install
gitlab-runner run
```

### Week 3-4: Core Services
```bash
# 1. PostgreSQL setup
psql -U postgres -d postgres < schema.sql

# 2. Keycloak deployment
kubectl apply -f keycloak-deployment.yaml

# 3. APISIX installation
helm install apisix apisix/apisix

# 4. Monitoring stack
kubectl apply -f prometheus-grafana/
```

---

## 📊 Database Schema (Core)

```sql
-- Users & Authentication
users (id, email, org_id, created_at)
organizations (id, name, tier)
roles (id, name)
permissions (id, role_id, resource, action)

-- Products & Inventory
products (id, sku, name, org_id)
inventory (id, product_id, warehouse_id, quantity)
warehouses (id, name, location)

-- Orders & Procurement
orders (id, customer_id, total, status)
order_items (id, order_id, product_id, qty)
purchase_orders (id, supplier_id, status)

-- Accounting & Finance
invoices (id, order_id, amount, status)
ledger_entries (id, invoice_id, account_id, debit/credit)
gl_accounts (id, account_code, name)

-- Audit & Compliance
audit_log (id, user_id, action, timestamp)
```

---

## 🔌 API Endpoints (Core)

### User & Auth
```
POST   /api/auth/login           → Keycloak OAuth2
POST   /api/auth/logout          → Invalidate token
GET    /api/users/{id}           → Get user profile
PUT    /api/users/{id}           → Update profile
```

### Products
```
GET    /api/products             → List products (cached)
GET    /api/products/{id}        → Get details
POST   /api/products             → Create (admin)
PUT    /api/products/{id}        → Update (admin)
```

### Orders
```
POST   /api/orders               → Create order
GET    /api/orders/{id}          → Get order
GET    /api/orders               → List my orders
PUT    /api/orders/{id}/status   → Update status
```

### Search
```
GET    /api/search?q=keyword     → Full-text search (Meilisearch)
```

---

## 🐳 Docker Commands (Quick Reference)

```bash
# Build services
docker build -t api:latest ./backend
docker build -t web:latest ./frontend

# Run locally
docker-compose up -d

# Deploy to K8s
kubectl apply -f deployment.yaml

# View logs
kubectl logs deployment/nestjs-api
kubectl logs -f pod/nestjs-api-xyz

# Scale replicas
kubectl scale deployment nestjs-api --replicas=3

# Update image
kubectl set image deployment/nestjs-api api=api:v1.1
```

---

## 📈 Monitoring Dashboards

### Grafana Default Dashboards
```
1. System Health
   - CPU usage per node
   - Memory consumption
   - Disk I/O
   - Network bandwidth

2. Application Metrics
   - HTTP requests/sec
   - API response time (p50, p95, p99)
   - Error rate (5xx, 4xx)
   - Request distribution by endpoint

3. Database Performance
   - Query execution time
   - Connection count
   - Slow query log
   - Index usage

4. Business Metrics
   - Orders processed/hour
   - Revenue/day
   - Customer growth
   - Supplier performance
```

---

## 🔐 Security Checklist

- [ ] All secrets in vault (not in code)
- [ ] HTTPS/TLS everywhere
- [ ] JWT validation on all APIs
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] SQL injection prevention (ORM)
- [ ] XSS protection (React escapes)
- [ ] CSRF tokens on forms
- [ ] Regular security audits (quarterly)
- [ ] Dependency scanning (Snyk)

---

## 📱 Mobile App Distribution

### iOS (TestFlight → App Store)
```
1. Build with Expo
   expo build:ios --release-channel production

2. Sign with Apple certificate
   (Managed by Expo)

3. Upload to TestFlight
   (Automatic from build)

4. Submit to App Store
   (Manual review, ~48 hours)
```

### Android (Google Play)
```
1. Build with Expo
   expo build:android --release-channel production

2. Sign with Play Store key
   (Managed by Expo)

3. Upload to Play Store
   (Automatic publishing)
```

---

## 🚨 Incident Response

### Database Down
```
1. Check PostgreSQL pod status
   kubectl get pod <postgres-pod>

2. Check logs
   kubectl logs <postgres-pod>

3. Restart if needed
   kubectl delete pod <postgres-pod>
   (StatefulSet auto-recreates)

4. Verify replication
   psql -c "SELECT * FROM pg_stat_replication;"

5. Notify users (status page)
```

### API Service Crash
```
1. Check service status
   kubectl get deployment nestjs-api

2. Check pod logs
   kubectl logs <pod-name>

3. Rollback if needed
   kubectl rollout undo deployment/nestjs-api

4. Update deployment image
   kubectl set image deployment/nestjs-api api=api:v1.1
```

### High CPU Usage
```
1. Identify hot pods
   kubectl top pods

2. Check metrics in Grafana
   (Look at query patterns)

3. Scale horizontally
   kubectl scale deployment nestjs-api --replicas=5

4. Optimize queries/code
   (Post-incident improvement)
```

---

## 📚 Documentation Standards

Every service should have:
```
README.md
├── Overview (1-2 sentences)
├── Prerequisites (Node version, etc.)
├── Installation
│   ├── Local setup
│   ├── Docker setup
│   └── Kubernetes deployment
├── Configuration (env vars)
├── API Documentation
│   ├── Endpoints
│   ├── Request/response examples
│   └── Error codes
├── Development
│   ├── Project structure
│   ├── How to run tests
│   └── Debugging tips
├── Deployment
│   ├── Staging
│   ├── Production
│   └── Rollback procedures
└── Contributing (code style, PR process)
```

---

## 🎓 Learning Resources

### Backend (NestJS)
- https://docs.nestjs.com
- https://app.pluralsight.com/courses/nestjs-fundamentals

### Frontend (Next.js)
- https://nextjs.org/learn
- https://www.udemy.com/course/nextjs-13-14-course

### DevOps (Kubernetes)
- https://kubernetes.io/docs/
- https://katacoda.com/courses/kubernetes

### Databases
- https://www.postgresql.org/docs/
- https://docs.meilisearch.com

---

## 🤝 Team Communication

### Slack Channels
```
#engineering         → Daily standups, technical discussions
#devops              → Infrastructure, deployments
#product             → Features, roadmap updates
#incidents           → Real-time incident updates
#releases            → Deployment announcements
```

### Meetings
```
Weekly:
- Engineering standup (Monday, 10 AM)
- DevOps sync (Wednesday, 2 PM)
- Tech debt discussion (Friday, 3 PM)

Bi-weekly:
- Sprint planning
- Sprint review

Monthly:
- Architecture review
- Security audit
- Performance analysis
```

---

## ✅ Pre-Launch Checklist

### 1 Month Before Launch
- [ ] All features implemented and tested
- [ ] Load testing passed (5K concurrent users)
- [ ] Security audit completed
- [ ] Backup/DR tested
- [ ] Monitoring dashboards created
- [ ] Runbooks documented
- [ ] Team trained

### 1 Week Before Launch
- [ ] Database backup taken
- [ ] Deployment procedure dry-run
- [ ] Incident response team briefed
- [ ] Communication plan finalized
- [ ] Rollback procedure tested

### Launch Day
- [ ] War room setup
- [ ] All systems green (monitoring)
- [ ] Team online 24 hours
- [ ] User support ready
- [ ] Communication channels open

---

## 📞 Support Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| **Tech Lead** | [email] | 9 AM - 6 PM IST |
| **On-call DevOps** | [phone] | 24/7 for critical issues |
| **Database Admin** | [email] | 9 AM - 6 PM IST |
| **Security Lead** | [email] | On-demand |

---

## 🎯 Next Steps (Action Items)

- [ ] Read FINAL_README.md (architecture decisions)
- [ ] Review ROADMAP.md (implementation plan)
- [ ] Set up development environment
- [ ] Fork/clone repositories
- [ ] Schedule kickoff meeting
- [ ] Assign team members to sprints
- [ ] Begin Phase 1, Week 1 tasks

---

**Questions?** Refer to documentation or contact Tech Lead.

