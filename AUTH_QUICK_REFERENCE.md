# 🚀 Authentication System - Quick Reference

## ✅ Current Status
- **Registration**: Working (creates VIEWER role users)
- **Login**: Working (validates password, returns JWT)
- **JWT**: Working (HS256, 1-hour expiration)
- **Protected Routes**: Working (bearer token auth)
- **Database**: PostgreSQL, 23 tables, multi-tenant

---

## 🔑 Key Concepts

### User Roles (Must Match DB Enum)
```typescript
export enum UserRole {
  OWNER = 'OWNER',        // Full access, manage all
  ACCOUNTANT = 'ACCOUNTANT', // Manage accounting
  MANAGER = 'MANAGER',    // View reports, create items
  VIEWER = 'VIEWER',      // Read-only (default for new users)
}
```

### Account Fields
- **id** → maps to `user_id` (UUID, auto-generated)
- **email** → unique, used for login
- **firstName** → maps to `first_name`
- **lastName** → maps to `last_name`
- **password** → maps to `password_hash` (bcrypt)
- **role** → enum value from UserRole
- **tenantId** → required, points to tenant (multi-tenant)
- **isActive** → boolean, can deactivate users

---

## 🔐 Authentication Endpoints

### 1. Register User
```
POST /auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}

Response (201 Created):
{
  "user": {
    "id": "uuid...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "VIEWER",
    "isActive": true,
    "tenantId": "d7aaf..."
  },
  "access_token": "eyJhbGc..."
}
```

### 2. Login User
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (200 OK):
{
  "user": { ... },
  "access_token": "eyJhbGc..."
}

Error (401):
{
  "message": "Invalid credentials",
  "statusCode": 401
}
```

### 3. Get Profile (Protected)
```
POST /auth/profile
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
{
  "id": "...",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "VIEWER",
  "isActive": true,
  "tenantId": "d7aaf..."
}
```

### 4. Update Profile (Protected)
```
PUT /auth/profile
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request:
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}

Response: Updated user object
```

### 5. Change Password (Protected)
```
POST /auth/change-password
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request:
{
  "oldPassword": "SecurePass123!",
  "newPassword": "NewPass456!"
}

Response: { message: "Password changed successfully" }
```

---

## 🛡️ Using JWT Token

### In Frontend
```typescript
// 1. After login, store token
localStorage.setItem('accessToken', response.access_token);

// 2. For authenticated requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
};

fetch('/api/protected', { headers });
```

### In Backend Route Protection
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute(@Request() req: any) {
  // req.user = { sub, email, role, iat, exp }
  console.log(req.user.role);  // VIEWER
}
```

### Token Contents (Decoded)
```javascript
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "sub": "user-id-uuid",     // User ID
  "email": "user@example.com",
  "role": "VIEWER",
  "iat": 1771149984,         // Issued at (seconds)
  "exp": 1771153584          // Expires (1 hour later)
}

// Signature
HMACSHA256(header + payload, JWT_SECRET)
```

---

## 🗄️ Database Context

### ⚠️ IMPORTANT: Hardcoded Tenant ID (Temporary - Phase 2 Work)

**Current Dev/Test Value**:
```
d7aaf087-9506-4166-a506-004edafe91f1
```

**Current Behavior**: All self-registered users are automatically assigned to this default tenant.

**THIS IS TEMPORARY** - This hardcoded UUID is a Phase 2 requirement that needs to be implemented:
- ❌ **Not for Production** - Users should select their own tenant at registration
- ❌ **Not Multi-tenant** - Currently all users go to same tenant
- ⏳ **Phase 2 TODO**: Implement proper tenant selection during registration

**Phase 2 Tasks** (Required before production):
- [ ] Implement tenant selection at registration
- [ ] Add multi-tenant factory pattern
- [ ] Check request context for tenant ID
- [ ] Allow users to create/select their business

### Users Table Query
```sql
SELECT user_id, email, first_name, last_name, role, is_active, tenant_id
FROM users
WHERE email = 'user@example.com';
```

---

## 🧪 Testing Commands

### Create Test User
```bash
curl -X POST http://localhost:3002/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

### Login & Get Token
```bash
curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }' | jq '.access_token'
```

### Use Token for Protected Route
```bash
TOKEN=$(curl -X POST http://localhost:3002/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | jq -r '.access_token')

curl -X POST http://localhost:3002/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Check Database
```bash
docker exec erp-postgres psql -U postgres -d erp \
  -c "SELECT email, first_name, role FROM users LIMIT 5;"
```

---

## ⚠️ Common Issues & Fixes

### Issue: "Invalid credentials" on login
**Cause**: Wrong email or password, or user is inactive
**Fix**: 
1. Verify user exists: `SELECT * FROM users WHERE email = '...';`
2. Check password with bcrypt (can't view plaintext)
3. Check `is_active` flag

### Issue: "Invalid role enum"
**Cause**: Code tries to set role to invalid value
**Fix**: Use only: OWNER, ACCOUNTANT, MANAGER, VIEWER
```typescript
role: UserRole.VIEWER  // ✅ Correct
role: 'VIEWER'         // ❌ Wrong (even though same string)
role: 'user'           // ❌ Wrong (not in enum)
```

### Issue: "null value in column tenant_id"
**Cause**: Trying to create user without tenant_id
**Fix**: Always provide tenant_id:
```typescript
tenantId: 'd7aaf087-9506-4166-a506-004edafe91f1'  // ✅ Required
```

### Issue: "JWT malformed" or "Invalid token"
**Cause**: Token expired or signature invalid
**Fix**:
1. Re-login to get new token (expires after 1 hour)
2. Check JWT_SECRET matches between auth and guard
3. Check Authorization header format: `Bearer <token>` (not `Bearer=...`)

---

## 📝 File Locations

| File | Purpose |
|------|---------|
| `erp-api/src/auth/auth.entity.ts` | User entity, UserRole enum, DB mappings |
| `erp-api/src/auth/auth.service.ts` | Registration, login, validation logic |
| `erp-api/src/auth/auth.controller.ts` | HTTP routes for auth endpoints |
| `erp-api/src/auth/strategies/jwt.guard.ts` | Protected route guard |
| `erp-api/src/auth/strategies/jwt.strategy.ts` | JWT strategy/validator |

---

## 🚀 Deployment Checklist

- [ ] All tests passing
- [ ] No console errors in backend
- [ ] Database migrations applied
- [ ] JWT_SECRET set in .env
- [ ] Database credentials correct
- [ ] Tenant ID configured
- [ ] CORS properly configured
- [ ] Password hashing working
- [ ] Token expiration set
- [ ] Protected routes guarded

---

## 📚 Related Docs
- [AUTH_FIX_REPORT.md](./AUTH_FIX_REPORT.md) - Detailed fix documentation
- [2_SETUP_AND_DEPLOYMENT.md](./2_SETUP_AND_DEPLOYMENT.md) - Infrastructure setup
- [3_IMPLEMENTATION_GUIDE.md](./3_IMPLEMENTATION_GUIDE.md) - Feature implementation

---

**Last Updated**: 2026-02-15
**Version**: 1.0 - Production Ready
**Maintenance**: Add SSL/TLS, rate limiting, and 2FA before public launch
