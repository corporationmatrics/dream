# Phase 2 Development Standards
# Keep this file in project root and reference during coding
# Last Updated: February 15, 2026

---

## FRONTEND STANDARDS (erp-web)

### API Client Library
- **Use:** axios (ONLY axios, not fetch)
- **Location:** erp-web/src/lib/api.ts
- **Pattern:** Create ONE api instance, reuse everywhere

```typescript
// ✓ CORRECT
import api from '@/lib/api';
const response = await api.post('/auth/register', data);

// ✗ WRONG
const response = await fetch('http://localhost:3002/auth/register');
```

### API Base URL
- **Use:** process.env.NEXT_PUBLIC_API_URL
- **Value:** http://localhost:3002 (NO /api suffix)
- **File:** erp-web/.env.local

```typescript
// ✓ CORRECT
const registerUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/register`

// ✗ WRONG
const registerUrl = 'http://localhost:3002/api/auth/register'
```

### Error Handling
- **Pattern:** try/catch for ALL API calls
- **State:** Always have error state in component
- **UI Feedback:** Always show error message to user

```typescript
// ✓ CORRECT
try {
  const response = await api.post('/auth/register', formData);
  setUser(response.data);
} catch (error) {
  setError(error.response?.data?.message || 'Registration failed');
}

// ✗ WRONG
const response = await api.post('/auth/register', formData);
setUser(response.data);
```

### JWT Token Handling
- **Storage:** localStorage ONLY (not sessionStorage, not cookies)
- **Key Name:** authToken (exactly this name)
- **Set Token:** After login/register success
- **Read Token:** Before EVERY API call
- **Delete Token:** On logout or 401 response

```typescript
// ✓ CORRECT
localStorage.setItem('authToken', response.access_token);
const token = localStorage.getItem('authToken');
localStorage.removeItem('authToken');

// ✗ WRONG
sessionStorage.setItem('token', ...);
window.authToken = ...;
```

### Authorization Header Format
- **Format:** Bearer {token}
- **Location:** Every request via axios interceptor
- **Pattern:** Automatically added by api.ts (don't add manually)

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Component Names
- **Pattern:** PascalCase
- **Location:** erp-web/src/app or erp-web/src/components

```typescript
// ✓ CORRECT
LoginPage.tsx, RegisterForm.tsx, UserCard.tsx

// ✗ WRONG
loginPage.tsx, register-form.tsx, user_card.tsx
```

### Function Names
- **Pattern:** camelCase
- **Prefix:** handle* for event handlers, fetch* for API calls

```typescript
// ✓ CORRECT
const handleSubmit = () => {}
const fetchUserProfile = () => {}
const validateEmail = () => {}

// ✗ WRONG
const HandleSubmit = () => {}
const get_user_profile = () => {}
const email_is_valid = () => {}
```

### State Management
- **Use:** React.useState ONLY (no useReducer, Redux, Zustand)
- **Pattern:** Local state in component, lifting up if needed

```typescript
// ✓ CORRECT (Week 1)
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
}

// ✓ SAME (Week 2 - consistent)
const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
}

// ✗ WRONG (mixing patterns)
// Week 1: useState
// Week 2: useReducer (DIFFERENT - breaks consistency)
```

### File Organization
```
erp-web/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── UserCard.tsx
│   │   └── ...
│   ├── lib/
│   │   └── api.ts
│   └── styles/
```

---

## BACKEND STANDARDS (erp-api)

### API Response Format
- **Success:** { data: {...}, message: "Success" }
- **Error:** { message: "Error description", statusCode: 400 }
- **Status Codes:** 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 500 Server Error

### Request/Response Validation
- **Always validate:** Input from frontend
- **Always return errors:** With meaningful messages
- **Pattern:** Guards + service layer validation

### Database Queries
- **Filter by tenant_id:** EVERY query (security critical)
- **Pattern:** WHERE tenant_id = req.user.tenantId

```typescript
// ✓ CORRECT
const users = await this.userRepository.find({
  where: { tenantId: req.user.tenantId }
});

// ✗ WRONG (data leak!)
const users = await this.userRepository.find({});
```

### Naming Conventions
- **Tables:** snake_case (users, user_roles, tenant_data)
- **Columns:** snake_case (user_id, created_at, tenant_id)
- **Database Functions:** snake_case

```typescript
// ✓ CORRECT (Database)
created_at, last_login, user_id, tenant_id

// ✗ WRONG
createdAt, lastLogin, userId, tenantId
```

---

## SHARED STANDARDS (Frontend + Backend)

### Environment Variables
**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3002
```

**Backend (.env):**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/erp_main
JWT_SECRET=your_secret_key
PORT=3002
```

### Git Commit Messages
- **Format:** [scope] Brief description
- **Examples:**
  - `[auth] Add login page component`
  - `[api] Create user registration endpoint`
  - `[db] Add tenant_id column to orders table`

```bash
# ✓ CORRECT
git commit -m "[auth] Add login form validation"

# ✗ WRONG
git commit -m "stuff"
git commit -m "fixes"
```

### Date/Time Format
- **Use:** ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)
- **Timezone:** Always UTC
- **Database:** timestamp with time zone
- **Frontend:** Store as ISO string, format for display

### JSON Property Naming
- **Use:** camelCase (JavaScript convention)
- **Frontend:** email, firstName, tenantId, createdAt
- **API Response:** Match frontend (camelCase)

```json
{
  "email": "user@example.com",
  "firstName": "John",
  "tenantId": "abc-123",
  "createdAt": "2026-02-15T12:45:00Z"
}
```

---

## TESTING STANDARDS

### Manual Tests (Before Merging)
- [ ] Happy path works (success case)
- [ ] Error handling works (show user message)
- [ ] Token stored correctly in localStorage
- [ ] Token sent in Authorization header
- [ ] 401 redirects to login
- [ ] Only own tenant data visible (multi-tenant)

### Code Review Checklist (Self-Review)
- [ ] Follows naming conventions
- [ ] Uses axios (not fetch)
- [ ] Uses localStorage (not sessionStorage)
- [ ] Error handling present
- [ ] No console.log left (remove before commit)
- [ ] Consistent with Week 1 code

---

## WHAT TO DO BEFORE MERGING EACH WEEK

**Week 1 → Main:**
```powershell
# 1. Check your code follows standards above
# 2. Test auth pages work
# 3. Verify token in localStorage
# 4. Make sure axios used everywhere
# 5. Then merge:
git checkout main
git merge feature/auth-pages
git push origin main
```

**Week 2 → Main:**
```powershell
# 1. Check code follows SAME standards as Week 1
# 2. Test user management
# 3. Verify still uses main api client from Week 1
# 4. Verify still uses localStorage from Week 1
# 5. Then merge
```

**Week 3 → Main:**
Same pattern - follow Week 1 and Week 2 standards

---

## HOW TO USE THIS FILE

**During Development:**
1. Keep this file open in your editor
2. Before writing code, check relevant section
3. Follow the pattern EXACTLY
4. If you wonder "should I use fetch or axios?", CHECK HERE
5. If you wonder "where should this file go?", CHECK HERE

**When Switching Branches:**
1. Moving from Week 1 to Week 2?
2. Review this file for the same patterns
3. Copy the same api.ts pattern
4. Use same error handling
5. Use same state management

**Before Merging to Main:**
```powershell
# Self-review using this checklist
☐ All axios calls (no fetch)
☐ All try/catch error handling
☐ All localStorage (no sessionStorage)
☐ Naming conventions followed
☐ File structure matches pattern
☐ Same patterns as previous weeks
```

If ANY item fails → FIX before merging

---

## IF YOU ACCIDENTALLY BREAK CONSISTENCY

**Example:** Week 2 uses fetch instead of axios

**Solution:**
1. Don't merge yet
2. Switch files that use fetch to axios
3. Test again
4. THEN merge

**WARNING:** If you merge inconsistent code, Week 3 becomes harder. Keep it clean!
