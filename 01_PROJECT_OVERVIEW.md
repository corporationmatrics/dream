# 📊 Dream ERP Platform - Project Overview

**Project Status:** ✅ MVP Complete + CI/CD Infrastructure Ready  
**Current Phase:** 1.5 (B2B JSON-EDI Integration - Starting Month 5)  
**Last Updated:** February 7, 2026

---

## 🎯 Project Mission

Build a **world-class open-source ERP & Supply Chain Platform** for Indian enterprises using cutting-edge, 100% open-source technologies.

**Core Value Propositions:**
1. **Eliminate vendor lock-in** - No licensing fees, full control, IP remains yours
2. **Enterprise-grade reliability** - ACID transactions, audit trails, compliance-ready
3. **Extensible architecture** - Modular design for custom integrations
4. **Cost efficiency** - ₹2-3 Crore annual savings at scale vs. commercial ERP
5. **India-first** - GSTIN, GST, Indian accounting standards built-in

---

## 📈 Project Timeline & Milestones

```
2026 PROJECT ROADMAP
════════════════════════════════════════════════════════════════

MONTH  PHASE          STATUS        DELIVERABLES
─────────────────────────────────────────────────────────────────
1-4    Phase 1 (MVP)  ✅ COMPLETE   ├─ Core ERP Platform (NestJS)
       Months 1-4                    ├─ Accounting Service (Spring)
                                     ├─ PostgreSQL Schema
                                     ├─ Frontend (Next.js)
                                     └─ Local development environment

5-6    Phase 1.5      ✅ PARTIAL    ├─ CI/CD Infrastructure ✅
       B2B/EDI        (In Progress) ├─ GitHub Actions (5 workflows)
       Months 5-6                    ├─ K3s Deployment (staging/prod)
                                     ├─ Monitoring & Alerting
                                     ├─ JSON-EDI Protocol 🔄 (starting)
                                     ├─ B2B Partner APIs 🔄
                                     └─ Webhook Delivery 🔄

7-9    Phase 2        📅 PLANNED    ├─ Advanced Inventory
       Enterprise     (Q3 2026)     ├─ Multi-warehouse Support
       Features                      ├─ Kafka Integration
                                     ├─ ML-based Forecasting
                                     └─ Real-time Dashboards

10-12  Phase 3        📅 PLANNED    ├─ Supplier Management Portal
       Logistics      (Q4 2026)     ├─ Supply Chain Analytics
                                     ├─ IoT Integration
                                     └─ Advanced Reporting
```

**Current Week Status (Feb 3-7, 2026):**
- ✅ MVP Backend & Frontend complete
- ✅ All unit tests created (117+ tests)
- ✅ GitHub Actions CI/CD (5 workflows) deployed
- ✅ Kubernetes manifests created
- ✅ Monitoring dashboard setup
- 🔄 B2B JSON-EDI design finalized, implementation starting

---

## 🏗️ Technology Stack (Final Approved)

### Backend Services Architecture

```
┌─────────────────────────────────────────────────────────┐
│           API Gateway (API APISIX)                      │
│  ├─ Rate limiting (100 req/sec default)                │
│  ├─ Authentication proxy                               │
│  └─ Request logging & monitoring                       │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼────────┐  ┌───▼──────────┐
│ NestJS API    │  │ Spring Boot  │
│ (Node.js 18)  │  │ (Java 21)    │
├─ Auth Module │  ├─ Accounting  │
├─ Products    │  ├─ GL Posting  │
├─ Orders      │  ├─ Reports     │
├─ Inventory   │  └─ Compliance  │
├─ B2B Intake  │
└─ Webhooks    │
  3000,3001    │  8080
               │
       ┌───────┴─────────────┐
       │                     │
┌──────▼──────┐     ┌────────▼─────┐
│ PostgreSQL  │     │  Valkey 8.0  │
│ (Primary DB)│     │  (Cache)     │
├─ Orders    │     ├─ Sessions    │
├─ Products  │     ├─ Rate limits │
├─ GL/AR     │     └─ Temp data   │
└─ Audit     │
  5432       │     6379
             │
       ┌─────┴──────────────┐
       │                    │
┌──────▼───────┐   ┌────────▼──────┐
│ MinIO (S3)   │   │ Meilisearch   │
├─ Invoices   │   ├─ Product      │
├─ Documents  │   │  Catalog      │
└─ OCR PDFs   │   └─ Full-text    │
  9000        │      7700
```

### Technology Stack Table

| Layer | Technology | Version | Why This Choice |
|-------|-----------|---------|-----------------|
| **API Server** | NestJS | 10+ | Enterprise patterns, TypeScript, low memory |
| **Finance Backend** | Spring Boot | 3.x (Java 21) | ACID, mature ecosystem, selective use |
| **Frontend** | Next.js | 14+ | React 18, SSR, ISR, API routes |
| **UI Framework** | Tailwind + shadcn/ui | Latest | Modern, accessible, copy-paste components |
| **Primary DB** | PostgreSQL | 15+ | ACID, JSON support, full-text search, extensions |
| **Object Cache** | Valkey 8.0 | Latest | 1.2M+ QPS, Linux Foundation-backed, replaces KeyDB |
| **Document Store** | PostgreSQL JSONB | Native | Eliminates complexity, single DB master |
| **Search Engine** | Meilisearch | Latest | 10x simpler than Elasticsearch, faster for retail |
| **Object Storage** | MinIO | Latest | S3-compatible, self-hosted, documents/images |
| **Message Queue** | Kafka | 3+ | Phase 2+, event streaming, transactions |
| **Orchestration** | Kubernetes (K3s) | 1.28+ | Industry standard, lightweight with K3s |
| **Container Registry** | Docker (ghcr.io) | Latest | GitHub Container Registry for private images |

### Database Schema (PostgreSQL)

**Core Tables (15):**
```
Authentication & Users
├── users (id, email, password_hash, role, status)
├── user_sessions (token, expiry, device)
└── audit_log (user_id, action, timestamp, changes)

Products & Inventory
├── products (id, name, sku, price, tax_code, status)
├── product_categories (id, name, parent_id)
├── warehouse (id, name, location, address)
├── inventory (warehouse_id, product_id, qty, reserved)
└── inventory_transactions (type, qty, reason, timestamp)

Orders & Fulfillment
├── orders (id, customer_id, status, total, created_at)
├── order_items (order_id, product_id, qty, price)
└── shipments (order_id, warehouse_id, status, tracking)

Accounting & GL
├── gl_accounts (code, name, type, balance)
├── journal_entries (id, date, description, status)
├── invoice (id, po_id, amount, date, status)
└── ledger_entries (id, gl_account, debit/credit, amount)

B2B Integration (Added - Month 5+)
├── b2b_partners (id, name, gst_in, webhook_url, status)
├── b2b_purchase_orders (id, po_number, partner_id, status)
├── b2b_invoices (id, po_id, invoice_number, status)
├── b2b_webhook_queue (id, event, status, retry_count)
└── b2b_audit_log (id, po_id, action, timestamp, changes)
```

### Deployment & Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Container Orchestration** | K3s (Kubernetes) | Lightweight, production-grade |
| **CI/CD Platform** | GitHub Actions | Integrated with GitHub, free for public repos |
| **Docker Registry** | GitHub Container Registry (ghcr.io) | Private image storage |
| **Load Balancer** | K3s built-in | For staging/prod |
| **Monitoring** | Prometheus + Grafana | Metrics collection & visualization |
| **Alerting** | AlertManager | Slack, PagerDuty integration |
| **Secrets Management** | Kubernetes Secrets | Base64 encoded (Phase 2: Sealed Secrets) |
| **Log Aggregation** | kubectl logs + ELK/Loki (Phase 2) | Centralized logging |

---

## 🎯 Core Features Implemented

### ✅ Phase 1 Complete (MVP)

**Authentication & Security**
- User registration with email verification
- Secure JWT-based authentication
- Role-based access control (admin, manager, user)
- Password hashing (bcrypt)
- Session management

**Product Management**
- Product catalog (create, read, update, delete)
- SKU management with pricing
- Product categories and hierarchy
- Tax code configuration
- GST integration (Indian)

**Inventory Management**
- Multi-warehouse support
- Inventory tracking by warehouse
- Stock movements (in/out/transfer)
- Low-stock alerts
- Batch tracking capability

**Order Management**
- Customer orders with line items
- Order status tracking (new, processing, shipped, delivered)
- Integration with inventory (stock reservation)
- Shipment tracking

**Accounting & Financial**
- Chart of Accounts (GL)
- Journal entry creation
- Automated GL posting
- Invoice generation
- AR aging reports
- GST calculations (IGST, SGST, CGST)

**Frontend (Next.js)**
- Responsive dashboard
- Product management pages
- Order management pages
- Basic reporting
- User authentication UI

---

## 🚀 Phase 1.5: CI/CD Infrastructure (JUST COMPLETED)

**13 New Files Created (~4,700 lines):**

### GitHub Actions Workflows (5)
1. **test.yml** - Automated testing on every commit
   - Unit tests + coverage upload
   - Integration tests
   - Database migration validation
   - Security scanning

2. **build.yml** - Docker image building
   - Multi-platform builds (amd64, arm64)
   - Image scanning (Trivy)
   - Registry push to ghcr.io

3. **deploy.yml** - K3s deployment
   - Staging deployment (automatic on develop)
   - Production deployment (on main branch)
   - Database migrations
   - Health checks & validation

4. **load-test.yml** - Performance testing
   - K6 load testing
   - Daily schedule + on-demand
   - 100 VUs by default
   - Performance metrics collection

5. **compliance.yml** - Security & compliance
   - Dependency scanning (Snyk, npm audit)
   - Container scanning (Trivy, Grype)
   - Code quality (SonarQube, ESLint, CodeQL)
   - PII/encryption auditing
   - License compliance checking

### Kubernetes Deployments (5)
- API service manifests (3 replicas)
- Accounting service manifests (2 replicas)
- PostgreSQL Helm configuration
- Valkey Helm configuration
- Prometheus alert rules

### Documentation (3)
- DEPLOYMENT_CHECKLIST.md - Pre/during/post procedures
- RUNBOOK.md - Operations & troubleshooting
- INFRASTRUCTURE.md - Architecture & setup

---

## 🔄 Phase 1.5: B2B JSON-EDI (Starting Now)

### JSON-EDI Protocol Features

**Message Types:**
1. **Purchase Order (PO)** - B2B partner sends PO in JSON
2. **PO Acknowledgment** - System confirms receipt
3. **Invoice** - System generates & sends invoice
4. **Delivery Note** - Shipping information
5. **Credit/Debit Notes** - Adjustments
6. **Payment Advice** - Payment information

**Flow Example:**
```
B2B Partner System
    ↓ (POST /api/b2b/purchase-orders)
Dream ERP validates PO
    ↓
Creates internal order
    ↓
Sends webhook acknowledgment
    ↓
On fulfillment → Generates invoice
    ↓
Posts to GL (Spring Boot)
    ↓
Webhook sends invoice to partner
    ↓
Partner auto-receives & posts to their GL
```

**Key Features:**
- Real-time webhook callbacks
- Immutable audit trail
- Digital signatures (SHA-256)
- Exponential backoff retry (5m → 30m → 2h → 6h → 24h)
- Dead letter queue for failed deliveries
- Partner rate limiting (100 POs/min)
- Duplicate PO detection

---

## 💰 Cost Analysis (Annual at 100K Users)

### Traditional Commercial ERP
```
Licenses:           ₹1.5 Crore
Implementation:     ₹50 Lakh
Support & Maintenance: ₹30 Lakh
────────────────────
TOTAL:              ₹2.3 Crore/year
```

### Dream ERP (Open Source)
```
Infrastructure:     ₹20 Lakh (AWS EC2, RDS, managed services)
Development Team:   ₹1.5 Crore (7 engineers)
Operations:         ₹20 Lakh (monitoring, backups, support)
────────────────────
TOTAL:              ₹1.9 Crore/year ← 18% savings!
────────────────────
At Scale (1M users): ₹3-5 Crore ← 60-70% savings!
```

### Additional Benefits
- Zero licensing fees
- No vendor lock-in
- Full IP ownership
- Unlimited deployment options
- 24/7 development control

---

## 👥 Team Structure

### Recommended Team (7 People)

| Role | Count | Responsibilities |
|------|-------|------------------|
| Tech Lead | 1 | Architecture, design decisions, code review |
| NestJS Developer | 2 | APIs, authentication, B2B integration |
| Spring Boot Developer | 1 | Accounting, GL, reports |
| Frontend Developer | 1 | Next.js, UI components, dashboards |
| DevOps Engineer | 1 | K3s, CI/CD, monitoring, deployments |
| QA Engineer | 1 | Testing, automation, performance |
| **Total** | **7** | Estimated annual cost: ₹1.5 Crore |

### Skill Requirements
- **NestJS:** Advanced Node.js, async patterns, microservices
- **Spring Boot:** Java, JDBC/JPA, transaction management
- **Frontend:** React, Next.js, Tailwind CSS, API integration
- **DevOps:** Kubernetes, Docker, CI/CD, Linux
- **Database:** PostgreSQL, SQL optimization, indexing
- **QA:** Jest, API testing (Postman/Insomnia), K6 load testing

---

## 📋 Feature Roadmap (Next 12 Months)

### Phase 2 (Months 7-9) - Enterprise Features
- [x] Advanced inventory management
- [x] Multi-warehouse with transfers
- [ ] Demand forecasting (ML)
- [ ] Supplier management portal
- [ ] Purchase order optimization
- [ ] Real-time dashboards
- [ ] Advanced financial reporting

### Phase 3 (Months 10-12) - Logistics & Analytics
- [ ] Logistics partner integration
- [ ] GPS tracking (IoT integration)
- [ ] Supply chain analytics
- [ ] Predictive analytics
- [ ] Mobile app (React Native)
- [ ] WhatsApp integration for orders

### Phase 4+ (Year 2) - AI & Automation
- [ ] Invoice/PO OCR (ML)
- [ ] Intelligent chatbot (LLM)
- [ ] Predictive maintenance
- [ ] Market intelligence
- [ ] CRM integration

---

## 🔐 Security & Compliance

### Built-in Security Features
- [x] HTTPS/TLS encryption
- [x] JWT authentication
- [x] SQL injection prevention (parameterized queries)
- [x] XSS protection (React, escaping)
- [x] CSRF protection (tokens)
- [x] Rate limiting (API level + WAF)
- [x] Immutable audit trail
- [x] Encrypted passwords (bcrypt)
- [x] RBAC (Role-Based Access Control)

### Compliance Ready
- [x] GSTIN mapping & validation
- [x] GST calculations (IGST/SGST/CGST)
- [x] Financial audit trail
- [x] Data retention policies
- [x] PII handling (encrypted fields)
- [x] Compliance audit logs

### CI/CD Security
- [x] Dependency vulnerability scanning (weekly)
- [x] Container image scanning (Trivy)
- [x] Code security scanning (CodeQL)
- [x] Secret detection (TruffleHog)
- [x] License compliance checking

---

## 📊 Key Metrics & KPIs

### Performance Targets (SLAs)
| Metric | Target | Monitor Tool |
|--------|--------|--------------|
| API Response Time (p95) | < 500ms | Prometheus |
| Database Query Time (p95) | < 100ms | PostgreSQL logs |
| Webhook Delivery Success | > 99.5% | Custom metrics |
| System Uptime | > 99.9% | Uptime Kuma |
| Container Build Time | < 5 min | GitHub Actions |

### Development Velocity
| Metric | Q1 2026 | Q2 2026 | Q3 2026 |
|--------|---------|---------|---------|
| Sprint Velocity (story points) | 40 | 50 | 60 |
| Deploy Frequency | Daily | Daily | 2-3x/day |
| Lead Time (days) | 1-2 | 1 | < 1 |
| Bug Resolution Time | 3-5 days | 2-3 days | 1 day |

---

## 🎯 Success Criteria

### MVP Validation (✅ Expected by Feb 28)
- [x] All core APIs working
- [ ] B2B EDI protocol finalized (in progress)
- [ ] Load tests showing < 500ms p95 latency
- [ ] 99%+ test coverage on core services
- [ ] Production deployment successful

### Scale Validation (by Aug 31)
- [ ] Handle 1000 concurrent users
- [ ] 10K+ orders/day processing
- [ ] 99.95% uptime maintained
- [ ] <1% error rate in production
- [ ] 50+ active B2B partners

### Revenue Generation (by Dec 31)
- [ ] Pilot customers deployed (2-3)
- [ ] ₹20L+ pipeline
- [ ] 5+ case studies
- [ ] Industry awards/recognition

---

## 📞 Support & Communication

### Team Communication Channels
- **Slack:** #dream-erp (main), #deployments, #incidents
- **GitHub:** Issues, PRs, Discussions
- **Meetings:** Daily standup (10am IST), Sprint planning (Fri)
- **Documentation:** This folder, GitHub Wiki

### Escalation Path
- **Technical Issues:** Tech Lead (@tech-lead)
- **Deployment Issues:** DevOps Engineer (@devops)
- **Performance Issues:** Tech Lead (@tech-lead)
- **Product Decisions:** Product Manager (@pm)

---

## ✅ Validation Checklist

Before moving to next phase:
- [x] MVP features complete
- [x] Unit tests passing (87 tests)
- [x] Integration tests passing (30 scenarios)
- [x] CI/CD pipelines deployed
- [x] Staging environment ready
- [ ] B2B partner testing (4 partners)
- [ ] Performance load tests (K6)
- [ ] Security audit (Snyk, Trivy)
- [ ] Documentation complete

---

**Last Updated:** February 7, 2026, 23:00 UTC  
**Next Review:** February 14, 2026  
**Maintained By:** Tech Lead & Product Manager
