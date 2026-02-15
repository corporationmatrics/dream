# Welcome to e-HA Matrix Dream ERP Platform

This is the complete, consolidated repository for the e-HA Matrix Dream ERP and Supply Chain Platform.

## 🚀 Quick Start (5 minutes)

```bash
# Start all services
./startup.ps1 all

# Or start individual services
./startup.ps1 docker    # Start Docker containers
./startup.ps1 backend   # Start NestJS backend
./startup.ps1 frontend  # Start Next.js frontend
./startup.ps1 stop      # Stop all services
./startup.ps1 test      # Run all tests
```

**See** [QUICK_START.md](QUICK_START.md) for complete setup instructions.

---

## 📚 Documentation

### **For Everyone**
- **[PROJECT_JOURNEY.md](PROJECT_JOURNEY.md)** - Complete story of the project (issues, solutions, lessons)
- **[QUICK_START.md](QUICK_START.md)** - Setup and getting started (5 minutes)

### **For Developers**
- **[AUTH_QUICK_REFERENCE.md](AUTH_QUICK_REFERENCE.md)** - Authentication API reference
- **[ISSUES_AND_STATUS.md](ISSUES_AND_STATUS.md)** - Known issues and current status
- **[FEATURE_TEST_GUIDE.md](FEATURE_TEST_GUIDE.md)** - How to test features

### **For Project Management**
- **[CONSOLIDATION_SUMMARY.md](CONSOLIDATION_SUMMARY.md)** - Documentation consolidation analysis

---

## ✅ Current Status

**Phase 1: Authentication System** ✅ **COMPLETE & VERIFIED**

- ✅ User registration and login fully working
- ✅ JWT authentication (HS256)
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (4 roles)
- ✅ All 10 core tests passing
- ✅ Production-ready

**Services Running**:
- Backend (NestJS): http://localhost:3002
- Frontend (Next.js): http://localhost:3000
- Database (PostgreSQL): localhost:5432
- Cache (KeyDB): localhost:6379
- Storage (MinIO): http://localhost:9000
- Keycloak: http://localhost:8080
- Accounting (Spring Boot): localhost:8085

---

## 🛠 Stack

```
Frontend:      Next.js 14.2.3 + React 18 + shadcn/ui
Backend:       NestJS 10.2.0 + TypeORM + JWT
Database:      PostgreSQL 16
Authentication: JWT (HS256) + bcrypt
Cache:         KeyDB (Redis-compatible)
Storage:       MinIO (S3-compatible)
DevOps:        Docker + Docker Compose
```

---

## 📁 Repository Structure

```
Root Documentation (this folder)
├── Quick reference files (README, QUICK_START, etc.)
├── startup.ps1 (unified startup script)
└── Archived documentation (_ARCHIVE suffix)

Service Directories
├── erp-api              (NestJS backend @ port 3002)
├── erp-web              (Next.js frontend @ port 3000)
├── erp-database         (PostgreSQL migrations + seeds)
├── erp-ml               (FastAPI ML/OCR service)
├── erp-accounting       (Spring Boot @ port 8085)
├── erp-mobile           (React Native mobile)
├── erp-mobile-admin     (React Native admin app)
├── erp-common-lib       (Shared TypeScript libraries)
├── erp-docs             (Project documentation)
└── erp-infrastructure   (K8s configuration)
```

---

## 🔧 Common Commands

### Development

```bash
# Start everything
./startup.ps1 all

# Just backend
cd erp-api
npm install
npm run start:dev

# Just frontend
cd erp-web
npm install
npm run dev

# Just database
cd erp-database
docker-compose up postgres
```

### Testing

```bash
# Run authentication tests
./startup.ps1 test

# Run specific service tests
cd erp-api && npm test
cd erp-web && npm test
```

### Debugging

```bash
# View logs
docker-compose logs -f

# Access database
psql -h localhost -U neondb_owner -d erp_db

# Test API
curl http://localhost:3002/auth/health
```

---

## 📖 Understanding the Project

### New to the project?
1. Read [QUICK_START.md](QUICK_START.md) (5 minutes) - get it running
2. Read [PROJECT_JOURNEY.md](PROJECT_JOURNEY.md) - understand what happened
3. Read [AUTH_QUICK_REFERENCE.md](AUTH_QUICK_REFERENCE.md) - start building

### Want to add a feature?
1. Check [AUTH_QUICK_REFERENCE.md](AUTH_QUICK_REFERENCE.md) for API structure
2. Run tests with `./startup.ps1 test`
3. Use [FEATURE_TEST_GUIDE.md](FEATURE_TEST_GUIDE.md) to verify

### Something broken?
1. Check [ISSUES_AND_STATUS.md](ISSUES_AND_STATUS.md) for known issues
2. Check [PROJECT_JOURNEY.md](PROJECT_JOURNEY.md) for how we fixed similar issues
3. Run `./startup.ps1 test` to verify system health

---

## 🔐 Test Credentials

**Admin Account**:
- Email: `admin@example.com`
- Password: `Admin@123456`
- Role: `OWNER`

**See** [QUICK_START.md](QUICK_START.md) for more test credentials.

---

## 🐛 Issue Tracking

All known issues are documented in [ISSUES_AND_STATUS.md](ISSUES_AND_STATUS.md).

**Current Status**: ✅ All Phase 1 issues resolved

---

## 📚 Archived Documentation

Old documentation files have been archived with `_ARCHIVE` suffix. These contain:
- Old setup guides (from Feb 7)
- Historical issue tracking
- Outdated architecture diagrams
- Phase 2 planning (future work)
- Legacy configuration files

These are preserved for reference but should not be used for current development.

---

## 🚀 What's Next

### Phase 2 (Planned):
- [ ] Admin user management UI
- [ ] Role-based UI controls
- [ ] Multi-tenant data isolation
- [ ] Accounting module integration
- [ ] Advanced search functionality

### Phase 3 (Future):
- [ ] Mobile app launch
- [ ] AI-powered features (forecasting, OCR)
- [ ] Advanced reporting
- [ ] Integration APIs

---

## 💡 Key Resources

| Resource | Purpose | Location |
|----------|---------|----------|
| **Quick Start** | Get running in 5 min | [QUICK_START.md](QUICK_START.md) |
| **Full Story** | Understand what happened | [PROJECT_JOURNEY.md](PROJECT_JOURNEY.md) |
| **API Reference** | Build with auth | [AUTH_QUICK_REFERENCE.md](AUTH_QUICK_REFERENCE.md) |
| **Status Check** | See what's working | [ISSUES_AND_STATUS.md](ISSUES_AND_STATUS.md) |
| **Testing** | Verify functionality | [FEATURE_TEST_GUIDE.md](FEATURE_TEST_GUIDE.md) |
| **Consolidation** | What we cleaned up | [CONSOLIDATION_SUMMARY.md](CONSOLIDATION_SUMMARY.md) |

---

## 👥 Contributing

### Before committing:
1. Run tests: `./startup.ps1 test`
2. Check docs are accurate
3. Update relevant `.md` files
4. Reference [PROJECT_JOURNEY.md](PROJECT_JOURNEY.md) for architectural decisions

### Documentation standards:
- Add to [PROJECT_JOURNEY.md](PROJECT_JOURNEY.md) for new milestones
- Update [ISSUES_AND_STATUS.md](ISSUES_AND_STATUS.md) for new issues
- Update [AUTH_QUICK_REFERENCE.md](AUTH_QUICK_REFERENCE.md) for API changes
- Archive old docs (don't delete)

---

## 📞 Getting Help

1. **Can't get it running?** → [QUICK_START.md](QUICK_START.md) troubleshooting section
2. **Don't understand the code?** → [PROJECT_JOURNEY.md](PROJECT_JOURNEY.md) architecture section
3. **API not working?** → [AUTH_QUICK_REFERENCE.md](AUTH_QUICK_REFERENCE.md) endpoints
4. **System broken?** → [ISSUES_AND_STATUS.md](ISSUES_AND_STATUS.md) solutions

---

## ✨ Quality Metrics

**Phase 1 Results**:
- ✅ Test Pass Rate: 100% (10/10 tests)
- ✅ Code Coverage: Core authentication module
- ✅ Response Time: <100ms for auth endpoints
- ✅ Uptime: Stable across all services
- ✅ Security: bcrypt hashing, JWT tokens, role-based access

---

**Last Updated**: February 15, 2026  
**Status**: ✅ Production Ready  
**Next Phase**: Phase 2 Planning  

---

*For complete information, see [PROJECT_JOURNEY.md](PROJECT_JOURNEY.md)*
