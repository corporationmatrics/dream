# 🚀 ERP Platform - Complete Integration Roadmap

## Overview
Implementation plan for integrating critical tools and technologies across the ERP ecosystem, organized by phase and priority.

---

## PHASE 1: Immediate (Week 1-2) - Foundation & Identity

### 1. 🎨 shadcn/ui - UI Component System
**Priority:** 🔴 Critical | **Effort:** Low | **Timeline:** 2-3 hours

**Why:** Already using React hooks + Tailwind → shadcn/ui is perfect fit for consistency.

**Impact:**
- Professional, accessible component library
- Better developer experience
- Consistent design system across web & mobile
- Built-in TypeScript support

**Implementation Steps:**
1. Install shadcn/ui in erp-web
2. Configure component library
3. Replace basic components with shadcn alternatives
4. Set up component stories (Storybook)

**Files to Create/Modify:**
- `erp-web/src/components/ui/` (component library)
- `erp-web/.shadcnui.json` (config)
- `erp-web/package.json` (dependencies)

**Dependencies:**
```json
{
  "@radix-ui/react-slot": "^2.0.2",
  "@radix-ui/react-dropdown-menu": "^2.0.3",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "lucide-react": "^0.263.1"
}
```

---

### 2. 🔐 Keycloak - Identity & Access Management
**Priority:** 🔴 Critical | **Effort:** Medium | **Timeline:** 8-10 hours

**Why:** Essential for B2B + DPDP compliance; enterprise-grade identity management.

**Impact:**
- OpenID Connect / OAuth 2.0 integration
- Multi-tenancy support for B2B customers
- DPDP Act compliance (data protection)
- Role-based access control (RBAC)
- Email verification + 2FA
- Audit logging for compliance

**Architecture:**
```
User → erp-web (Next.js) → erp-api (NestJS) ↔ Keycloak
         ↓
   OAuth2/OIDC flow
         ↓
   JWT tokens validated by NestJS
```

**Implementation Steps:**

1. Deploy Keycloak in docker-compose
2. Configure realm + clients
3. Update NestJS with Keycloak strategy
4. Update Next.js with next-auth or similar
5. Migrate auth from current JWT to Keycloak

**Files to Create/Modify:**
- `erp-infrastructure/docker-compose.yml` (Keycloak service)
- `erp-infrastructure/keycloak-setup.sh` (initialization)
- `erp-api/src/auth/keycloak.strategy.ts` (new)
- `erp-api/src/auth/auth.module.ts` (updated)
- `erp-web/src/lib/auth.ts` (updated)
- `erp-web/src/middleware.ts` (new - auth middleware)
- `.env.local` (Keycloak credentials)

**NestJS Dependencies:**
```json
{
  "@nestjs/passport": "^10.0.2",
  "passport": "^0.6.0",
  "passport-openidconnect": "^1.5.1",
  "passport-keycloak-oauth2": "^2.2.0",
  "jsonwebtoken": "^9.1.2"
}
```

**Docker Setup:**
```yaml
keycloak:
  image: quay.io/keycloak/keycloak:latest
  ports:
    - "8080:8080"
  environment:
    KEYCLOAK_ADMIN: admin
    KEYCLOAK_ADMIN_PASSWORD: admin123
    KC_DB: postgres
    KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
```

---

### 3. 🗄️ MongoDB - IoT & Telemetry Data
**Priority:** 🟠 High | **Effort:** Medium | **Timeline:** 6-8 hours

**Why:** Needed for IoT/telemetry data (separate from core transactions).

**Impact:**
- High-performance time-series data storage
- IoT device telemetry (sensor readings)
- Real-time monitoring data
- Scalable for future IoT expansion
- Separate from PostgreSQL (transactional data)

**Use Cases:**
- Device location tracking
- Temperature/humidity sensors
- Load monitoring
- Performance metrics

**Implementation Steps:**

1. Add MongoDB to docker-compose
2. Set up Mongoose schema for IoT data
3. Create IoT data service in erp-api
4. Add MongoDB connection in NestJS
5. Create telemetry endpoints
6. Set up data retention policies

**Files to Create/Modify:**
- `erp-infrastructure/docker-compose.yml` (MongoDB service)
- `erp-api/src/iot/` (new IoT module)
  - `iot.controller.ts`
  - `iot.service.ts`
  - `iot.schema.ts` (Mongoose)
  - `iot.module.ts`
- `erp-api/src/app.module.ts` (add MongoDB)
- `.env.local` (MongoDB connection string)

**NestJS Dependencies:**
```json
{
  "@nestjs/mongoose": "^10.0.6",
  "mongoose": "^8.0.0"
}
```

**Docker MongoDB:**
```yaml
mongodb:
  image: mongo:7.0
  ports:
    - "27017:27017"
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: admin123
  volumes:
    - mongodb_data:/data/db
```

---

### 4. 🔍 Enhanced OCR - PaddleOCR-VL
**Priority:** 🟠 High | **Effort:** Medium | **Timeline:** 8-10 hours

**Why:** Replace current stub with production-grade document parsing.

**Impact:**
- Vision-Language model for document understanding
- Higher accuracy than EasyOCR
- Multi-language support
- Layout analysis + table recognition
- Invoice/bill parsing capability

**Current State:** erp-ml has stub with EasyOCR
**Target:** PaddleOCR-VL integrated with FastAPI

**Implementation Steps:**

1. Add PaddleOCR-VL to erp-ml dependencies
2. Create FastAPI endpoint for document parsing
3. Integrate with erp-api via HTTP
4. Add file upload handling
5. Create document extraction module
6. Add caching for performance

**Files to Create/Modify:**
- `erp-ml/src/ocr_service.py` (replace with PaddleOCR-VL)
- `erp-ml/src/paddle_ocr_handler.py` (new)
- `erp-ml/src/document_parser.py` (new)
- `erp-ml/pyproject.toml` (add dependencies)
- `erp-api/src/documents/` (new module)
  - `documents.controller.ts`
  - `documents.service.ts`
  - `documents.module.ts`
- `erp-api/src/app.module.ts` (add documents)

**Python Dependencies:**
```toml
paddleocr = "^2.7.0.0"
paddlepaddle = "^2.5.0"
opencv-python = "^4.8.0"
pillow = "^10.0.0"
pydantic = "^2.4.0"
fastapi = "^0.104.0"
```

**Integration Points:**
```
erp-web/erp-mobile
    ↓ (file upload)
erp-api (documents endpoint)
    ↓ (HTTP POST)
erp-ml/FastAPI (OCR processing)
    ↓ (returns parsed data)
erp-api (stores results)
```

---

## PHASE 2: Month 1-2 - B2B & Performance

### 5. 📄 JSON EDI Protocol - B2B Document Exchange
**Priority:** 🟠 High | **Effort:** Medium | **Timeline:** 10-12 hours

**Why:** Critical for "Zero-Manual" B2B document exchange.

**Impact:**
- Automated B2B document exchange (POs, invoices, ASNs)
- Standard-based (UN/EDIFACT → JSON mapping)
- Reduces manual data entry
- Audit trail for compliance

**EDI Message Types to Support:**
- 850: Purchase Order
- 855: Purchase Order Acknowledgment
- 856: Advance Shipping Notice
- 810: Invoice
- 820: Payment Order

**Files to Create/Modify:**
- `erp-api/src/edi/` (new module)
  - `edi.controller.ts`
  - `edi.service.ts`
  - `edi.parser.ts`
  - `edi.schemas.ts` (Zod/class-validator)
  - `edi.module.ts`
- `erp-database/migrations/` (EDI transaction table)
- `erp-api/src/app.module.ts` (add EDI)

**NestJS Dependencies:**
```json
{
  "zod": "^3.22.0",
  "uuid": "^9.0.0"
}
```

**EDI Document Structure:**
```typescript
interface EDIDocument {
  messageType: '850' | '855' | '856' | '810' | '820';
  partnerGLN: string;
  documentNumber: string;
  documentDate: Date;
  items: EDILineItem[];
  totalAmount: number;
  taxAmount: number;
  signature: string; // digital signature
}
```

---

### 6. 🐍 FastAPI (Python) - AI Pricing & Voice-to-Text
**Priority:** 🟠 High | **Effort:** Medium | **Timeline:** 12-15 hours

**Why:** AI pricing logic + Voice-to-Text for retailers.

**Impact:**
- Dynamic pricing based on demand/inventory
- Voice order entry for retail staff
- Real-time pricing recommendations
- Faster order creation

**Capabilities:**
- **Pricing Engine:** ML model for optimal pricing
- **Voice Recognition:** Transcribe voice orders to text
- **Intent Recognition:** Extract items + quantities from voice
- **Fallback:** Text-to-Speech for confirmations

**Architecture:**
```
erp-api (NestJS)
    ↓ (HTTP calls)
erp-ml (FastAPI)
    ├─ /pricing/recommend (pricing engine)
    ├─ /voice/transcribe (speech-to-text)
    └─ /voice/intent (extract order details)
```

**Files to Create/Modify:**
- `erp-ml/src/pricing_engine.py` (new)
- `erp-ml/src/voice_service.py` (new)
- `erp-ml/src/api.py` (FastAPI app - reorganize)
- `erp-ml/src/models/` (pricing models)
- `erp-api/src/pricing/` (new module)
- `erp-api/src/orders/` (integrate voice)

**Python Dependencies:**
```toml
openai = "^1.0.0"  # or similar LLM
librosa = "^0.10.0"  # audio processing
soundfile = "^0.12.0"
scipy = "^1.11.0"
scikit-learn = "^1.3.0"
pandas = "^2.1.0"
```

---

### 7. 🚚 Google OR-Tools - Vehicle Routing
**Priority:** 🟡 Medium | **Effort:** Medium | **Timeline:** 10-12 hours

**Why:** Vehicle routing optimization (post-MVP context).

**Impact:**
- Optimal delivery route generation
- Multi-stop route planning
- Cost optimization (fuel, time)
- Better delivery ETAs

**Supported Constraints:**
- Time windows
- Vehicle capacity
- Service time at stops
- Multiple depot modes

**Files to Create/Modify:**
- `erp-ml/src/routing_service.py` (new)
- `erp-api/src/delivery/` (new module)
  - `routing.service.ts`
  - `routing.controller.ts`
- `erp-web/src/components/DeliveryMap.tsx` (visualization)

**Python Dependencies:**
```toml
ortools = "^9.8.0"
geopy = "^2.3.0"
folium = "^0.14.0"
```

---

### 8. 🧠 LSTM Models - Demand Forecasting
**Priority:** 🟡 Medium | **Effort:** High | **Timeline:** 15-20 hours

**Why:** Time-series forecasting for inventory management.

**Impact:**
- Predict demand for products
- Optimize inventory levels
- Reduce stockouts & overstock
- Better planning for supply chain

**Approach:**
- LSTM (Long Short-Term Memory) neural networks
- Time-series data from MongoDB
- Multi-step forecasting
- Confidence intervals

**Files to Create/Modify:**
- `erp-ml/src/forecasting/` (new directory)
  - `lstm_model.py`
  - `demand_forecaster.py`
  - `training_pipeline.py`
- `erp-ml/src/api.py` (add forecasting endpoint)
- `erp-api/src/forecasting/` (new module)
- `erp-web/src/components/ForecastChart.tsx` (visualization)

**Python Dependencies:**
```toml
tensorflow = "^2.14.0"
keras = "^2.14.0"
statsmodels = "^0.13.0"
plotly = "^5.17.0"
```

---

## Implementation Order (Convenience & Compatibility)

### Week 1
1. ✅ **shadcn/ui** (web frontend enhancement)
2. ✅ **MongoDB** (add to infrastructure)
3. **Keycloak** (foundation for auth)

### Week 2-3
4. ✅ **Enhanced OCR** (leverage existing erp-ml)
5. ✅ **EDI Protocol** (B2B foundation)

### Week 4-5
6. ✅ **FastAPI** (Python microservice)
7. ✅ **OR-Tools** (optimization)

### Week 6-8
8. ✅ **LSTM Models** (advanced ML)

---

## Technical Debt & Maintenance

### Pre-Integration Checklist
- [ ] Update all dependencies
- [ ] Run linting & type checks
- [ ] Verify Docker Compose setup
- [ ] Test current system stability
- [ ] Create feature branches for each integration
- [ ] Set up integration test suite

### Post-Integration Checklist
- [ ] Load testing
- [ ] Security audit
- [ ] API documentation update
- [ ] Database migration testing
- [ ] Performance benchmarking
- [ ] Monitoring & alerting setup

---

## Deployment Strategy

### Development
- All services in docker-compose
- Hot-reload enabled
- Mock external services
- Seed data for testing

### Staging
- Production-like setup
- Real Keycloak instance
- Real DB credentials (encrypted)
- Load testing

### Production
- K8s deployment (existing)
- Keycloak HA setup
- MongoDB replica set
- CDN for static assets
- Monitoring & alerting

---

## Key Files Configuration

### .env.local (Development)
```bash
# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=erp-platform
KEYCLOAK_CLIENT_ID=erp-api
KEYCLOAK_CLIENT_SECRET=secret123

# MongoDB
MONGODB_URI=mongodb://admin:admin123@localhost:27017/erp
MONGODB_DB=erp

# OCR Service
OCR_SERVICE_URL=http://localhost:8001

# FastAPI
FASTAPI_URL=http://localhost:8001
```

### Docker Compose Updates Required
```yaml
version: '3.8'
services:
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    # ... config ...
  
  mongodb:
    image: mongo:7.0
    # ... config ...
  
  fastapi:
    build: ./erp-ml
    ports:
      - "8001:8000"
    # ... config ...
  
  # existing services (postgres, redis, etc.)
```

---

## Success Metrics

### Phase 1 Completion
- [ ] shadcn/ui components replace bootstrap/custom components
- [ ] Keycloak successfully authenticates users
- [ ] MongoDB collects IoT telemetry
- [ ] OCR processes documents with >95% accuracy

### Phase 2 Completion
- [ ] EDI documents auto-exchanged
- [ ] Pricing engine recommends prices
- [ ] Voice ordering works for top 10 phrases
- [ ] Routes optimized (20% cost reduction)
- [ ] Demand forecast RMSE < 15%

---

## Support & Documentation

Each integration comes with:
- Implementation guide (specific to this project)
- API documentation
- Testing strategies
- Troubleshooting guide
- Performance tuning tips

Next Steps: Review Phase 1 implementation files →

