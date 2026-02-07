# 📋 Quick Reference - All Integration Tools
## One-Page Cheat Sheet

---

## File Structure

```
Dream/
├── INTEGRATION_ROADMAP.md                ← START HERE (strategy)
├── COMPLETE_TOOL_INTEGRATION_PLAN.md     ← Overview & summary
├── IMPLEMENTATION_CHECKLIST.md           ← Daily tasks
│
├── PHASE 1 GUIDES (Week 1-2):
│   ├── SHADCN_UI_SETUP.md               ← UI components
│   ├── KEYCLOAK_SETUP.md                ← Identity/Auth
│   ├── MONGODB_INTEGRATION.md           ← IoT telemetry
│   └── OCR_INTEGRATION.md               ← Document parsing
│
├── PHASE 2 GUIDES (Month 1-2):
│   └── PHASE2_IMPLEMENTATION.md         ← B2B & optimization
│
├── SCRIPTS:
│   ├── setup-phase1.sh                  ← Linux/Mac setup
│   ├── setup-phase1.ps1                 ← Windows setup
│
├── DOCKER:
│   └── docker-compose-all-phases.yml    ← All services config
│
└── EXISTING FILES:
    ├── erp-api/                         ← NestJS API
    ├── erp-web/                         ← Next.js frontend
    ├── erp-ml/                          ← FastAPI + Python
    └── erp-infrastructure/              ← Docker configs
```

---

## Tool Integration Matrix

### Phase 1: Foundation (Days 1-5)

| Tool | Category | Base Tech | Output | Files |
|------|----------|-----------|--------|-------|
| **shadcn/ui** | UI Components | React | Components in `src/components/ui/` | SHADCN_UI_SETUP.md |
| **Keycloak** | Identity | OpenID Connect | JWT tokens + users | KEYCLOAK_SETUP.md |
| **MongoDB** | Data Store | NoSQL | Collections: devices, telemetry | MONGODB_INTEGRATION.md |
| **PaddleOCR-VL** | Document AI | Python/FastAPI | Parsed documents + text | OCR_INTEGRATION.md |

### Phase 2: Advanced (Days 6-11)

| Tool | Category | Base Tech | Output | Files |
|------|----------|-----------|--------|-------|
| **JSON EDI** | B2B Exchange | NestJS | EDI documents (850, 810, 856) | PHASE2_IMPLEMENTATION.md |
| **FastAPI** | Microservices | Python/ML | Price recommendations + voice | PHASE2_IMPLEMENTATION.md |
| **OR-Tools** | Optimization | Google Library | Optimized delivery routes | PHASE2_IMPLEMENTATION.md |
| **LSTM** | Time-Series | TensorFlow | Demand forecasts | PHASE2_IMPLEMENTATION.md |

---

## Installation Commands Cheat Sheet

### Phase 1 Setup

```bash
# Windows
cd "D:\UPENDRA\e-HA Matrix\Dream"
.\setup-phase1.ps1

# macOS/Linux
bash setup-phase1.sh
```

### Docker Startup

```bash
# All services (recommended)
docker-compose -f docker-compose-all-phases.yml up -d

# Or specific phase
docker-compose -f docker-compose-all-phases.yml up -d \
  postgres redis keycloak mongodb fastapi prometheus grafana

# View status
docker-compose ps

# Check logs
docker-compose logs -f <service-name>

# Stop all
docker-compose down
```

### Package Installations

```bash
# erp-web (shadcn/ui + deps)
cd erp-web
npm install
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card dialog table

# erp-api (Keycloak + MongoDB)
cd erp-api
npm install --save \
  @nestjs/mongoose mongoose \
  passport-openidconnect jsonwebtoken @types/node

# erp-ml (OC + FastAPI)
cd erp-ml
poetry install
poetry add paddleocr paddlepaddle opencv-python pdf2image
```

---

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Keycloak Admin | http://localhost:8080 | admin / admin123 |
| Grafana | http://localhost:3001 | admin / admin123 |
| Mongo Express | http://localhost:8081 | (none needed) |
| PgAdmin | http://localhost:5050 | admin@erp.local / admin123 |
| RabbitMQ | http://localhost:15672 | guest / guest |
| Prometheus | http://localhost:9090 | (read-only) |
| Seq Logs | http://localhost:8086 | (none needed) |
| API Health | http://localhost:3002/health | - |
| Web | http://localhost:3000 | - |
| FastAPI | http://localhost:8001/docs | (Swagger) |

---

## API Endpoints Overview

### Authentication (Keycloak)
```
POST /auth/login              # Login user
POST /auth/register           # Register new user
POST /auth/refresh            # Refresh JWT
POST /auth/logout             # Logout
GET  /auth/profile            # Get user profile
```

### IoT (MongoDB)
```
POST /iot/devices             # Register device
GET  /iot/devices             # List all devices
GET  /iot/devices/:id         # Get device
POST /iot/telemetry           # Record reading
GET  /iot/telemetry/:id       # Get latest readings
GET  /iot/telemetry/:id/range # Time range query
```

### Documents (OCR)
```
POST /documents/extract       # Extract text from image
POST /documents/parse         # Parse structured data
POST /documents/batch         # Batch process
GET  /documents/ocr-health    # OCR service status
```

### EDI (Phase 2)
```
POST /edi/receive             # Receive EDI message
POST /edi/send                # Send EDI message
GET  /edi/status              # Query by status
GET  /edi/partner/:id         # Partner documents
POST /edi/retry-failed        # Retry failed
```

### Pricing (Phase 2)
```
POST /pricing/recommend       # Get price recommendation
POST /pricing/train           # Train pricing model
```

### Routing (Phase 2)
```
POST /delivery/optimize-route # Optimize delivery routes
GET  /delivery/routes/:id     # Get route details
```

### Forecasting (Phase 2)
```
GET  /forecasting/demand/:id  # Get demand forecast
POST /forecasting/train-models # Train models
```

---

## Key Files to Modify

### Frontend (erp-web)
```
src/
├── app/
│   ├── layout.tsx           ← Add theme provider
│   ├── login/page.tsx       ← New: Keycloak login
│   ├── api/auth/[...nextauth]/route.ts  ← New: nextauth
│   └── dashboard/page.tsx   ← Protected page
├── components/
│   ├── ui/                  ← shadcn components (auto-generated)
│   └── custom/              ← Your components here
├── lib/
│   ├── utils.ts            ← cn() helper (shadcn)
│   └── auth.ts             ← New: nextauth config
└── middleware.ts           ← Optional: auth middleware
```

### API (erp-api)
```
src/
├── app.module.ts           ← Add MongooseModule, AuthModule
├── auth/
│   ├── strategies/keycloak.strategy.ts  ← New
│   ├── guards/jwt.guard.ts             ← New
│   └── auth.module.ts                  ← Updated
├── iot/
│   ├── schemas/            ← New: device, telemetry
│   ├── services/           ← New: IoT services
│   ├── controllers/        ← New: IoT endpoints
│   └── iot.module.ts       ← New
└── documents/
    ├── services/           ← New: OCR service
    ├── controllers/        ← New: OCR endpoints
    └── documents.module.ts ← New
```

### Machine Learning (erp-ml)
```
src/
├── api.py                  ← FastAPI app
├── ocr/
│   ├── paddle_ocr_handler.py  ← New
│   ├── document_parser.py     ← New
│   └── cache_service.py       ← New
├── pricing/
│   └── pricing_engine.py      ← New (Phase 2)
└── routing/
    └── routing_service.py     ← New (Phase 2)
```

---

## Environment Variables (.env.local)

```bash
# ===== KEYCLOAK =====
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=erp-platform
KEYCLOAK_CLIENT_ID=erp-api
KEYCLOAK_CLIENT_SECRET=<generate-from-admin>

# ===== MONGODB =====
MONGODB_URI=mongodb://erp_app:erp_app_password@localhost:27017/erp
MONGODB_DB=erp

# ===== OCR SERVICE =====
OCR_SERVICE_URL=http://localhost:8001
OCR_MODEL=paddleocr-vl

# ===== DATABASES =====
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erp
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# ===== SERVICES =====
API_PORT=3002
WEB_PORT=3000
FASTAPI_PORT=8001

# ===== MONITORING =====
ENVIRONMENT=development
LOG_LEVEL=debug
SENTRY_DSN=<optional>
```

---

## Testing Checklist

### Phase 1 Tests
- [ ] shadcn button renders correctly
- [ ] Login with Keycloak user
- [ ] Register new device via /iot/devices
- [ ] Send telemetry via /iot/telemetry
- [ ] Extract text from test image
- [ ] Parse invoice document

### Phase 2 Tests
- [ ] Send EDI 850 document
- [ ] Receive EDI 855 ACK
- [ ] Get pricing recommendation
- [ ] Test voice transcription
- [ ] Optimize delivery routes
- [ ] Run demand forecast

---

## Performance Targets

| Operation | Target | Tool |
|-----------|--------|------|
| Page load | < 1 sec | shadcn + Next.js |
| API response | < 200ms | NestJS |
| Auth request | < 500ms | Keycloak |
| Telemetry insert | < 50ms | MongoDB |
| OCR processing | < 5 sec | PaddleOCR |
| Price recommendation | < 200ms | FastAPI |
| Route optimization | < 10 sec | OR-Tools |
| Forecast generation | < 5 sec | LSTM |

---

## Security Checklist

- [ ] Rotate Keycloak admin password
- [ ] Enable HTTPS in production
- [ ] Use secrets manager for credentials
- [ ] Enable MongoDB authentication
- [ ] Set up API rate limiting
- [ ] Enable CORS carefully
- [ ] Validate all user inputs
- [ ] Enable audit logging
- [ ] Set up WAF rules
- [ ] Regular security scanning

---

## Monitoring & Alerts

```
Prometheus Targets:
├── http://localhost:3002/metrics      (erp-api)
├── http://localhost:8001/metrics      (FastAPI)
├── http://localhost:5432/metrics      (PostgreSQL exporter)
└── http://localhost:27017/metrics     (MongoDB exporter)

Grafana Dashboards:
├── System Overview
├── ERP Platform Metrics
├── Database Performance
├── OCR Service Metrics
└── Business KPIs
```

---

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Port already in use | `lsof -i :PORT` then `kill -9 PID` |
| Docker container won't start | `docker logs <name>` |
| Keycloak can't connect to DB | Check keycloak-db is healthy |
| MongoDB auth failed | Verify credentials in .env |
| FastAPI slow to start | OCR models loading, be patient |
| API returns 401 | Check JWT expiration and issuer |
| OCR low accuracy | Try preprocessing image, enable rotation |
| Memory issues | Increase Docker memory allocation |

---

## Command Reference

```bash
# Docker operations
docker-compose ps                  # View all services
docker-compose logs -f service     # View logs
docker-compose restart service     # Restart service
docker-compose down -v             # Stop and remove volumes
docker exec -it container bash     # Shell into container

# Database operations
mongosh "mongodb://admin:admin123@localhost:27017"
psql postgresql://postgres:postgres@localhost:5432/erp
redis-cli -h localhost -p 6379

# API testing
curl -X GET http://localhost:3002/health
curl -X POST http://localhost:3002/documents/extract -F "file=@test.jpg"
curl -X GET http://localhost:8001/docs  # FastAPI Swagger

# Code operations
npm install                        # Install dependencies
npm run dev                        # Start dev server
npm run build                      # Build production
npm run test                       # Run tests
npx tsc --noEmit                  # TypeScript check
```

---

## Priority Checklist

### Today ✅
- [ ] Read INTEGRATION_ROADMAP.md
- [ ] Run setup-phase1.ps1
- [ ] Start docker-compose-all-phases.yml

### This Week ✅
- [ ] Complete Phase 1 implementations
- [ ] Test all integrations
- [ ] Update documentation

### Next Week ✅
- [ ] Begin Phase 2
- [ ] Performance testing
- [ ] Security audit

---

## Success Metrics

**Phase 1 = Complete When:**
- Users can login via Keycloak
- Devices send telemetry to MongoDB
- Documents parsed with 95%+ accuracy
- All shadcn components working

**Phase 2 = Complete When:**
- EDI documents auto-processed
- Pricing recommendations working
- Routes optimized 20%+ cost
- Demand forecasts accurate

---

## Key Contacts & Resources

- **Keycloak Docs:** https://www.keycloak.org/docs
- **shadcn/ui:** https://ui.shadcn.com
- **MongoDB:** https://docs.mongodb.com
- **PaddleOCR:** https://github.com/PaddlePaddle/PaddleOCR
- **NestJS:** https://docs.nestjs.com
- **FastAPI:** https://fastapi.tiangolo.com

---

**Last Updated:** February 6, 2026
**Version:** 1.0 - Complete Integration Plan
**Status:** Ready for Implementation

