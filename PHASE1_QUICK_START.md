# Phase 1 Quick Start - Using Existing Infrastructure

## ✅ Current Status

Your infrastructure is **RUNNING** with:

| Service | Port | Status |
|---------|------|--------|
| PostgreSQL | 5432 | ✅ Running |
| Redis (KeyDB) | 6379 | ✅ Running |
| MinIO (S3 storage) | 9000/9001 | ✅ Running |
| Meilisearch (Search) | 7700 | ✅ Running |
| Prometheus (Metrics) | 9091 | ✅ Running |
| Grafana (Dashboards) | 3001 | ✅ Running |

---

## 🎯 Phase 1 Implementation Plan (Week 1-2)

We'll implement the 4 Phase 1 tools using your existing infrastructure:

### **1. shadcn/ui** (Day 1 - 3-4 hours)
**What:** Beautiful React component library  
**Why:** Consistent, professional UI components  
**Effort:** 3-4 hours  
**Status:** Ready to start

### **2. Keycloak** (Days 2-3 - 8-10 hours)
**What:** OpenID Connect identity management  
**Why:** Secure authentication for the entire platform  
**Effort:** 8-10 hours  
**Status:** Need to add to infrastructure (separate service)

### **3. MongoDB** (Day 4 - 6-8 hours)
**What:** NoSQL database for IoT/telemetry data  
**Why:** Efficient time-series data storage  
**Effort:** 6-8 hours  
**Status:** Need to add to infrastructure (separate service)

### **4. Enhanced OCR** (Days 5-6 - 8-10 hours)
**What:** Document parsing with PaddleOCR-VL  
**Why:** Automatic invoice/document extraction  
**Effort:** 8-10 hours  
**Status:** Runs on existing FastAPI (to be added)

---

## 🚀 Start NOW (Today - 30 minutes)

### Step 1: Prepare erp-web (shadcn/ui)
```powershell
cd "d:\UPENDRA\e-HA Matrix\Dream\erp-web"

# Check current dependencies
npm list react next tailwindcss

# View current package.json
code package.json
```

### Step 2: Initialize shadcn/ui
```powershell
npx shadcn-ui@latest init
```

**When prompted, answer:**
- ✅ TypeScript: Yes
- ✅ Use CSS variables: Yes
- ✅ Base color: Slate (or your preference)
- ✅ CSS file location: src/app/globals.css

### Step 3: Add First Components
```powershell
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
```

### Step 4: Verify It Works
```powershell
npm run dev
# Open http://localhost:3000 in browser
```

---

## 📋 Phase 1 Components to Add to Infrastructure

For **Days 2-6**, we need to add **Keycloak** and **MongoDB** to your setup:

### Option A: Minimal Addition (Recommended)
Add to the existing **docker-compose-all-phases.yml** (already included):

```yaml
# Add these services to your existing docker-compose.yml

keycloak-db:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: keycloak
    POSTGRES_USER: keycloak
    POSTGRES_PASSWORD: keycloak123
  ports:
    - "5433:5432"  # Different port from main PostgreSQL
  volumes:
    - keycloak_db_data:/var/lib/postgresql/data

keycloak:
  image: keycloak/keycloak:latest
  environment:
    KEYCLOAK_ADMIN: admin
    KEYCLOAK_ADMIN_PASSWORD: admin123
    DB_VENDOR: postgres
    DB_ADDR: keycloak-db
    DB_DATABASE: keycloak
    DB_USER: keycloak
    DB_PASSWORD: keycloak123
  ports:
    - "8080:8080"
  depends_on:
    - keycloak-db

mongodb:
  image: mongo:7.0
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: admin123
  ports:
    - "27017:27017"
  volumes:
    - mongodb_data:/data/db

mongo-express:
  image: mongo-express
  environment:
    ME_CONFIG_MONGODB_ADMINUSERNAME: admin
    ME_CONFIG_MONGODB_ADMINPASSWORD: admin123
    ME_CONFIG_MONGODB_URL: mongodb://admin:admin123@mongodb:27017/
  ports:
    - "8081:8081"
  depends_on:
    - mongodb

# Add volumes at bottom
volumes:
  keycloak_db_data:
  mongodb_data:
```

### Option B: Full Replacement
Use the **docker-compose-all-phases.yml** once network is fixed.

---

## 🛠️ What You Need to Do

### **TODAY (Next 30 minutes):**
```powershell
# 1. Go to erp-web
cd "d:\UPENDRA\e-HA Matrix\Dream\erp-web"

# 2. Run shadcn init
npx shadcn-ui@latest init

# 3. Add first component
npx shadcn-ui@latest add button

# 4. Verify it works
npm run dev
# Visit http://localhost:3000
```

### **TOMORROW (Before you start Keycloak):**
```powershell
# 1. Read: KEYCLOAK_SETUP.md (understanding)
# 2. Read: MONGODB_INTEGRATION.md (understanding)

# 3. Add Keycloak & MongoDB to docker-compose.yml
# 4. Restart containers
cd "d:\UPENDRA\e-HA Matrix\Dream\erp-infrastructure"
docker-compose up -d

# 5. Verify they're running
docker ps | findstr keycloak
docker ps | findstr mongo
```

---

## ✨ Key Files You'll Need

1. **SHADCN_UI_SETUP.md** - Component setup guide (read tomorrow)
2. **KEYCLOAK_SETUP.md** - Auth integration (read tomorrow)
3. **MONGODB_INTEGRATION.md** - Data storage (read tomorrow)
4. **OCR_INTEGRATION.md** - Document parsing (read day 5)

---

## 📊 Success Criteria for Phase 1

By end of Week 2, you should have:

- ✅ shadcn/ui components working in erp-web
- ✅ Keycloak admin console accessible (http://localhost:8080)
- ✅ MongoDB running with data collections
- ✅ OCR service extracting text from test documents
- ✅ All services integrated with NestJS API

---

## ⚡ Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| `npx shadcn-ui not found` | Run `npm install -g shadcn-ui` |
| Port 8080 already in use | Change to `8081` in docker-compose.yml: `"8081:8080"` |
| MongoDB connection fails | Check credentials match in connection string |
| npm run dev fails | Delete `node_modules`, run `npm install` again |

---

## 🎯 Next Step

**Run this RIGHT NOW:**

```powershell
cd "d:\UPENDRA\e-HA Matrix\Dream\erp-web"
npx shadcn-ui@latest init
```

Then tell me:
1. ✅ Did the init complete?
2. ✅ What color scheme did you choose?
3. ✅ Ready to add components?

I'll then guide you through adding components and styling your first page.

