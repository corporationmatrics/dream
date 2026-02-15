# ⚡ QUICK START GUIDE

**Get the system running in 5 minutes**

---

## 📋 Prerequisites

- Docker Desktop 4.18+ (or Docker Engine + Docker Compose)
- Node.js 18.x LTS
- npm or yarn
- 8GB RAM minimum
- 20GB free disk space

---

## 🚀 Start Everything (5 Minutes)

### **Step 1: Navigate to Project**
```powershell
cd "d:\UPENDRA\e-HA Matrix\Dream"
```

### **Step 2: Start All Services**
```powershell
# Start PostgreSQL, KeyDB, MinIO, Keycloak, and other foundation services
docker-compose up -d

# Wait 10-15 seconds for services to initialize
Start-Sleep -Seconds 15

# Verify all containers are running
docker ps
```

### **Step 3: Start Backend (NestJS)**
```powershell
cd erp-api
npm install  # Only needed first time
npm run start:dev
# Wait for "Server running on http://localhost:3002"
```

### **Step 4: Start Frontend (Next.js) - In Another Terminal**
```powershell
cd erp-web
npm install  # Only needed first time
npm run dev
# Frontend will be at http://localhost:3000
```

### **Step 5: Verify Everything Is Working**
```powershell
# Test backend health
curl http://localhost:3002/health

# Test registration
curl -X POST http://localhost:3002/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email":"test@example.com",
    "password":"Test123!",
    "name":"Test User"
  }'

# Should return 201 with JWT token
```

> **Note**: Users are currently auto-assigned to default tenant. This is Phase 2 work - production will require tenant selection at registration.

---

## 📍 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| Backend (NestJS) | 3002 | http://localhost:3002 |
| Database (PostgreSQL) | 5432 | localhost:5432 |
| Keycloak Auth | 8082 | http://localhost:8082 |
| KeyDB Cache | 6379 | localhost:6379 |
| MinIO Storage | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |

---

## 🧪 Test Credentials

**Test User** (Created during setup):
- Email: `testuser_968232010@example.com`
- Password: `Password123!`
- Role: `VIEWER`

**Create Your Own**:
```powershell
curl -X POST http://localhost:3002/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"yourname@example.com",
    "password":"YourPass123!",
    "name":"Your Name Here"
  }'
```

---

## 🔑 Authentication Endpoints

### **Register**
```
POST /auth/register
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe"
}

Response: { user, access_token }
```

### **Login**
```
POST /auth/login
{
  "email": "user@example.com",
  "password": "Password123!"
}

Response: { user, access_token }
```

### **Get Profile** (Protected - Requires JWT)
```
POST /auth/profile
Authorization: Bearer <JWT_TOKEN>

Response: User profile object
```

---

## 📖 Need More Details?

- **Complete Journey**: See `PROJECT_JOURNEY.md`
- **API Reference**: See `AUTH_QUICK_REFERENCE.md`
- **Code Changes**: See `CODE_CHANGES_SUMMARY.md`

---

## 🆘 Troubleshooting

### **Backend Won't Start**
```powershell
# Check if port 3002 is in use
netstat -ano | findstr :3002

# Kill the process if needed
taskkill /PID <PID> /F

# Then restart
npm run start:dev
```

### **Database Connection Error**
```powershell
# Verify PostgreSQL is running
docker ps | findstr postgres

# Check if database exists
docker exec erp-postgres psql -U postgres -l | findstr erp

# Restart PostgreSQL
docker-compose restart postgres
```

### **Frontend Can't Connect to Backend**
```powershell
# Check backend is running
curl http://localhost:3002/health  # Should return 200

# Check frontend can reach backend (in browser console)
fetch('http://localhost:3002/health')
```

### **Clear Everything and Start Fresh**
```powershell
# Stop all services
docker-compose down
docker system prune -a

# Remove node_modules
Remove-Item -Path erp-api/node_modules -Recurse -Force
Remove-Item -Path erp-web/node_modules -Recurse -Force

# Start from scratch
docker-compose up -d
cd erp-api && npm install && npm run start:dev
# In another terminal:
cd erp-web && npm install && npm run dev
```

---

## 📊 Check Status

```powershell
# All Docker services
docker ps

# Backend logs
# (Check terminal where you ran "npm run start:dev")

# Frontend logs
# (Check terminal where you ran "npm run dev")

# Database
docker exec erp-postgres psql -U postgres -d erp -c "SELECT * FROM users LIMIT 1;"
```

---

## ✅ Success Indicators

- ✅ Backend running on port 3002 with 0 errors
- ✅ Frontend running on port 3000 
- ✅ PostgreSQL has 23 tables
- ✅ Can register user and get JWT token
- ✅ Can login with user credentials
- ✅ Can access /auth/profile with Bearer token

---

## 🎓 Next Steps

1. **Register a user** at http://localhost:3000/auth/register
2. **Login** with your credentials
3. **Explore** the system
4. **Read** PROJECT_JOURNEY.md to understand the architecture
5. **Modify** code and test your changes

---

**Status**: ✅ Ready to Use  
**Last Updated**: February 15, 2026  
**Questions?** Check PROJECT_JOURNEY.md or AUTH_QUICK_REFERENCE.md
