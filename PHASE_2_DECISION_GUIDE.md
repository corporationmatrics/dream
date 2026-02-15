# 📊 PHASE 2 DECISION MATRIX & NEXT STEPS

---

## QUICK DECISION FRAMEWORK

### Question 1: Timeline Priority?

```
❌ FASTEST (2 weeks)        BALANCED (3 weeks)         🟡 THOROUGH (4 weeks)
──────────────────────────  ───────────────────────────  ───────────────────────
Features:                   Features:                   Features:
✓ Login/Register           ✓ Login/Register            ✓ All BALANCED features
✓ Roles visible in UI      ✓ Roles visible in UI       ✓ Unit tests
✓ Multi-tenant selector    ✓ Multi-tenant selector     ✓ E2E tests
✗ Admin panel              ✓ Admin panel               ✓ Performance tests
✗ Admin tests              ✓ Tests for critical paths  ✓ Load testing
✗ Accounting features      ✓ Basic accounting          ✓ Full documentation
                                                        ✓ Audit logging
                                                        ✓ Security review

Recommendation: Pick BALANCED for quality/velocity balance
```

### Question 2: How to Organize Development?

```
Option A: Full-Stack Features          Option B: Layer-by-Layer
───────────────────────────            ──────────────────────
Week 1:                                Week 1:
├─ Feature: Login/Register             ├─ Frontend: All auth pages
│ ├─ Frontend: Login page              ├─ Frontend: Dashboards
│ ├─ Backend: Register endpoint        └─ Frontend: All forms
│ └─ Test: E2E test
                                       Week 2:
Week 2:                                ├─ Backend: All endpoints
├─ Feature: User Management            ├─ Backend: Guards & middleware
│ ├─ Frontend: User list               └─ Backend: Tests
│ ├─ Backend: User API
│ └─ Test: CRUD tests                  Week 3:
                                       ├─ Integration: Connect all
Week 3:                                ├─ Database: Verify migrations
├─ Feature: Accounting                 └─ End-to-end: Full flow test
│ ├─ Frontend: Invoice forms
│ ├─ Backend: Invoice API
│ └─ Test: Full flow

Pros:                                  Pros:
- Each feature testable independently   - Parallel work possible
- Clear deliverables                   - Backend & frontend teams
- Can go live feature by feature       - Faster overall delivery
- Easier to demo progress

Recommendation: Option A - Full-Stack Features
(Better for small team, clearer deliverables)
```

### Question 3: Testing Strategy?

```
🟢 Comprehensive (Recommended)           🟡 Focused
─────────────────────────────            ──────────────
- Unit tests for services                - Integration tests only
- Integration tests for APIs             - Manual e2e tests
- E2E tests for workflows                - No unit tests
- Manual testing (QA)                    - No regression tests
- Automated regression tests

Examples:                                Examples:
├─ Unit: bcrypt works correctly          ├─ E2E: Register→Login→View invoice
├─ Unit: JWT validation                  └─ Manual: Check all pages
├─ Integration: POST /register works
├─ E2E: Register→Login→Create Invoice
└─ Regression: Old features still work

Recommendation: Comprehensive - Prevents bugs before they reach production
```

### Question 4: Database Readiness?

```
✅ READY for Phase 2:

1. Multi-tenant migration applied?
   ✓ users.tenant_id added
   ✓ All tables have tenant_id
   ✓ Indexes created
   
   Action: Run flyway migrations
   Command: npm run db:migrate

2. Accounting tables exist?
   ✓ invoices, purchase_orders, journal_entries exist
   ✓ 23 tables total in PostgreSQL
   ✓ Schema documented
   
   Action: Verify with: npm run db:check-tables

3. Constraints enforced?
   ✓ role_enum type defined
   ✓ NOT NULL constraints
   ✓ UUID types correct
   ✓ Foreign keys defined
   
   Action: Run: SELECT * FROM pg_tables WHERE schemaname='public'
```

---

## IMPLEMENTATION ROADMAP (START HERE)

### BEFORE YOU START (Checklist)

```
Pre-Flight Checklist:
───────────────────

System Health:
  [ ] All services running (7/7)
      npm run docker:up
      
  [ ] Docker status: all green
      docker ps
      
  [ ] Backend responds: GET /health
      curl localhost:3002/health
      
  [ ] Database connected
      npm run db:test-connection
      
  [ ] No errors in logs
      docker logs erp_api

Frontend Ready:
  [ ] Next.js 14 installed
      npm -v (verify 8.0+)
      
  [ ] Node 18+ installed
      node --version
      
  [ ] Dependencies installed
      cd erp-web && npm install
      
  [ ] TypeScript compiles
      npm run build

Backend Ready:
  [ ] NestJS 10 installed
      npm -v
      
  [ ] No compilation errors
      npm run build
      
  [ ] Database migrations current
      npm run db:info
      
  [ ] Test database clean
      npm run db:reset

Database Ready:
  [ ] PostgreSQL 16 running
      psql -U postgres -d erp_main
      
  [ ] All 23 tables exist
      SELECT COUNT(*) FROM information_schema.tables
      
  [ ] Multi-tenant columns present
      SELECT * FROM users LIMIT 1
      
  [ ] Constraints defined
      SELECT * FROM pg_constraint

Once ALL checked: ✅ Ready to start Phase 2
```

### WEEK 1: FRONTEND FOUNDATION

#### DAY 1-2: Login & Register Pages

**Frontend Tasks:**
```
File: erp-web/src/(auth)/
├─ login/page.tsx (NEW)
│  ├─ Email input
│  ├─ Password input
│  ├─ Submit button
│  ├─ Error display (401, network)
│  ├─ Link to "/register"
│  └─ Success → redirect to /dashboard
│
├─ register/page.tsx (NEW)
│  ├─ Email input (validate email format)
│  ├─ Password input (min 8 chars)
│  ├─ Confirm password
│  ├─ First name input
│  ├─ Last name input
│  ├─ Business name input (NEW - Phase 2)
│  ├─ Business type dropdown (NEW - Phase 2)
│  ├─ Terms checkbox
│  ├─ Submit button
│  ├─ Error display (400, 409 conflict)
│  └─ Success → redirect to /login
│
└─ layout.tsx
   ├─ Public (no auth required)
   └─ Styling

Components needed:
├─ FormInput component
│  ├─ Label
│  ├─ Input with validation
│  └─ Error message
│
├─ SubmitButton component
│  ├─ Label
│  └─ Loading state
│
└─ ErrorBanner component
   ├─ Message
   └─ Dismissable

State Management:
├─ Form state (use React.useState)
├─ Loading state (true during submission)
├─ Error state (null or error message)
└─ Success state (for redirect)

API Integration:
├─ POST /auth/register
│  ├─ Request: {email, password, firstName, lastName, businessName}
│  └─ Response: {token, user}
│
├─ POST /auth/login
│  ├─ Request: {email, password}
│  └─ Response: {token, user}
│
└─ Store token:
   localStorage.setItem('authToken', response.token)

Tests (Manual Initially):
  1. Fill register form → submit
  2. Check database: new user created
  3. Try login with credentials → should work
  4. Check localStorage has token
  5. Try register duplicate email → 409 error
  6. Try login wrong password → 401 error
```

**Backend Task:**
```
Verify endpoints exist:
  POST /auth/register  → 201 Created
  POST /auth/login     → 200 OK

Add if missing:
  app.controller.ts:
    @Post('register')
    @Post('login')

Check database insertion:
  SELECT * FROM users WHERE email = ?
```

#### DAY 3-4: Backend Integration

**Frontend Tasks:**
```
Create API client:
File: erp-web/src/lib/api.ts

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export default api;
```

Connect login/register pages:
├─ import { authAPI } from '@/lib/api'
├─ Try/catch around API calls
├─ Handle errors (409, 401, 500)
└─ Redirect on success

Create hook: useAuth.ts
├─ store token
├─ clear token
├─ get current user
├─ logout
└─ isAuthenticated

Create middleware: auth middleware to redirect unauthenticated users
```

**Tests:**
```
POST /auth/register
├─ Valid input → 201, token returned
├─ Duplicate email → 409
└─ Invalid input → 400

POST /auth/login
├─ Valid credentials → 200, token
├─ Invalid password → 401
└─ Invalid email → 401

Token storage:
├─ localStorage has token after login
├─ Token sent in Authorization header
└─ Token cleared on logout
```

#### DAY 5: Testing & Refinement

**Test Scenarios:**
```
✅ Test 1: Complete Registration Flow
  1. Go to /register
  2. Fill form with valid data
  3. Submit
  4. Check database: user created with correct fields
  5. Check password is hashed (bcrypt)
  6. Check tenant created (Phase 2)
  
✅ Test 2: Login with Registered User
  1. Register new account
  2. Go to /login
  3. Enter registered email & password
  4. Check token in localStorage
  5. Check JWT decoded has correct claims
  6. Navigate to dashboard
  
✅ Test 3: Protected Route Access
  1. Without token: redirect to /login
  2. With valid token: access dashboard
  3. With invalid token: redirect to /login
  4. Expired token: redirect to /login (handle refresh)
  
✅ Test 4: Error Handling
  1. Register duplicate email → show "Email already exists"
  2. Login wrong password → show "Invalid credentials"
  3. Network error → show "Connection failed"
  4. Form validation → show "Email invalid", "Password too short"

✅ Test 5: Security
  1. Token not visible in URL
  2. Token stored in localStorage (httpOnly would be better)
  3. Password never sent in plain text in logs
  4. HTTPS recommended (set up later)
```

**Polish Items:**
```
UI/UX:
- [ ] Loading spinner while submitting
- [ ] Disabled submit button during loading
- [ ] Show/hide password toggle
- [ ] Clear error message on input change
- [ ] Auto-focus first field
- [ ] Enter key submits form

Responsive:
- [ ] Mobile: form takes full width
- [ ] Tablet: form centered with padding
- [ ] Desktop: form 400px width
- [ ] All text readable on mobile

Accessibility:
- [ ] Color contrast meets WCAG
- [ ] Form labels properly associated
- [ ] Error messages linked to inputs
- [ ] Tab order logical
- [ ] Focus indicators visible
```

---

### WEEK 2: AUTHORIZATION & MULTI-TENANCY

#### DAY 1-2: Admin User Management

**Frontend:**
```
File: erp-web/src/app/(dashboard)/admin/users/...

Page Components:
├─ page.tsx
│  ├─ Header "User Management"
│  ├─ [Button: "+ Add User"]
│  ├─ [Search bar]
│  └─ <UserTable>
│
├─ UserTable.tsx
│  ├─ Columns: Email | Name | Role | Status | Actions
│  ├─ Rows: map users
│  ├─ Actions column:
│  │  ├─ [Edit] → opens modal
│  │  └─ [Delete] → shows confirmation
│  ├─ Pagination (10 per page initially)
│  └─ Loading state
│
├─ EditUserModal.tsx
│  ├─ User email (read-only)
│  ├─ Role dropdown
│  │  ├─ OWNER
│  │  ├─ ACCOUNTANT
│  │  ├─ MANAGER
│  │  └─ VIEWER
│  ├─ Status toggle (Active/Inactive)
│  ├─ [Cancel] [Save]
│  └─ Error display
│
└─ DeleteUserModal.tsx
   ├─ Confirmation message
   ├─ [Cancel] [Delete]
   └─ Loading state

State:
├─ Users array (from API)
├─ Selected user (for edit)
├─ Loading state
├─ Error state
├─ Pagination (page, limit)
└─ Search query

API Calls:
├─ GET /users → list all users for tenant
├─ GET /users/:id → get single user
├─ PATCH /users/:id → update role/status
├─ DELETE /users/:id → delete user
└─ POST /users → create new user (if admin)
```

**Backend:**
```
Controllers & Guards:
├─ UserController @UseGuards(AuthGuard, RoleGuard('OWNER'))
│  ├─ GET /users → list (only OWNER)
│  ├─ GET /users/:id
│  ├─ PATCH /users/:id → update role
│  ├─ DELETE /users/:id → soft delete
│  └─ POST /users → create new (OWNER only)
│
└─ Middleware: TenantMiddleware
   ├─ Extract tenant from JWT
   ├─ Filter all queries: WHERE tenant_id = $1
   └─ Attach to request context

Database:
├─ Ensure users.is_active column exists
├─ Add soft_delete columns (optional for Phase 2)
└─ Indexes on tenant_id + role for fast filtering

Tests:
├─ OWNER can list users → 200
├─ ACCOUNTANT tries list users → 403
├─ List only shows own tenant's users
├─ Update role requires OWNER
├─ Delete requires OWNER confirmation
```

#### DAY 3: Role-Based UI Rendering

**Frontend Components:**
```
Create Role Context:
File: erp-web/src/context/RoleContext.tsx

```typescript
import { createContext, useContext } from 'react';

interface RoleContextType {
  role: 'OWNER' | 'ACCOUNTANT' | 'MANAGER' | 'VIEWER';
  can: (action: string) => boolean;
}

const RoleContext = createContext<RoleContextType>(null);

export function RoleProvider({ children, role }) {
  const can = (action: string): boolean => {
    const permissions = {
      'OWNER': ['create', 'read', 'update', 'delete', 'admin'],
      'ACCOUNTANT': ['create', 'read', 'update', 'reports'],
      'MANAGER': ['read', 'reports'],
      'VIEWER': ['read'],
    };
    return permissions[role]?.includes(action);
  };

  return (
    <RoleContext.Provider value={{ role, can }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);
```

Create guards:
├─ <IfRole role="OWNER">Component</IfRole>
├─ <IfCan action="delete">Button</IfCan>
└─ <Protected roles={['OWNER', 'ACCOUNTANT']}>Page</Protected>

Navigation Menu:
File: erp-web/src/components/Sidebar.tsx
```typescript
function Sidebar() {
  const { role } = useRole();

  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      
      {(role === 'OWNER' || role === 'ACCOUNTANT') && (
        <>
          <Link href="/invoices">Invoices</Link>
          <Link href="/purchase-orders">Purchase Orders</Link>
        </>
      )}
      
      {(role === 'OWNER' || role === 'MANAGER') && (
        <Link href="/reports">Reports</Link>
      )}
      
      {role === 'OWNER' && (
        <Link href="/admin/users">User Management</Link>
      )}
    </nav>
  );
}
```

Feature Flags by Role:
├─ Show/hide menu items
├─ Disable buttons
├─ Show placeholder for unauthorized sections
└─ Log what user tried to access

Tests:
├─ OWNER sees all menu items
├─ ACCOUNTANT sees accounting items
├─ MANAGER sees reports only
├─ VIEWER sees dashboard only
└─ Clicking disabled button shows toast "Access denied"
```

#### DAY 4-5: Multi-Tenant Dynamic Selection

**Frontend - Update Register Page:**
```
Add to registration form:
├─ Business name input
├─ Business type dropdown:
│  ├─ Individual
│  ├─ Sole Proprietor
│  ├─ Partnership
│  ├─ Corporation
│  └─ Non-profit
├─ Country selector
└─ Currency selector

Send to backend:
{
  email: 'john@example.com',
  password: 'secure123',
  firstName: 'John',
  lastName: 'Doe',
  businessName: 'ACME Corp',        // NEW
  businessType: 'Corporation',       // NEW
  country: 'US',                     // NEW
  currency: 'USD'                    // NEW
}

Backend creates:
├─ User record with fields
├─ Tenant record with:
│  ├─ name (businessName)
│  ├─ type (businessType)
│  ├─ country
│  ├─ currency
│  └─ created_by → user_id
└─ Link user to tenant
```

**Backend - Tenant Creation:**
```
Migration (flyway):
File: erp-database/migrations/020_add_tenant_fields.sql

CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  country VARCHAR(2),
  currency VARCHAR(3) DEFAULT 'USD',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP
);

ALTER TABLE users ADD COLUMN tenant_id UUID NOT NULL
  REFERENCES tenants(id);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
```

Update Service:
├─ authService.register(): create tenant first
├─ Link tenant_id to user
├─ All queries now filtered by tenant_id
└─ Multi-tenant isolation enforced

Test Scenario:
1. Register user A with "ACME Corp"
2. Register user B with "XYZ Retail"
3. User A logs in → should see only ACME data
4. User B logs in → should see only XYZ data
5. User A cannot see User B's invoices
6. User B cannot manage User A's users
```

---

### WEEK 3: ACCOUNTING & INTEGRATION

#### DAY 1-2: Invoicing Features

**Frontend - Invoice Management:**
```
Pages:
├─ /invoices (list)
├─ /invoices/new (create)
├─ /invoices/:id (view)
└─ /invoices/:id/edit (edit)

List Page:
├─ Table columns: Invoice# | Date | Customer | Amount | Status
├─ Status badges: Draft, Sent, Paid, Overdue
├─ Action buttons: View, Edit, Send, Mark as Paid, Delete
├─ Search by invoice number
├─ Filter by status
└─ Pagination

Create Form:
├─ Customer selector (dropdown)
├─ Invoice date (calendar)
├─ Due date (calendar)
├─ Line items:
│  ├─ Product selector
│  ├─ Quantity input
│  ├─ Unit price
│  └─ Remove button [X]
├─ Add line item button [+]
├─ Notes field
├─ Tax rate selector (auto-calculate)
├─ Total calculation (live update)
└─ [Save as Draft] [Send]

View/Edit Page:
├─ Display all invoice details
├─ Can edit (if OWNER/ACCOUNTANT and status=Draft)
├─ Show audit trail (created by, last edited)
└─ Print/PDF button

API Integration:
├─ GET /invoices?status=draft&page=1
├─ POST /invoices
├─ GET /invoices/:id
├─ PATCH /invoices/:id
├─ DELETE /invoices/:id
└─ POST /invoices/:id/send
```

**Backend - Invoice API:**
```
Database Tables:
├─ invoices
│  ├─ id, invoice_number, tenant_id
│  ├─ customer_id (FK)
│  ├─ invoice_date, due_date
│  ├─ status (ENUM: draft, sent, paid, overdue)
│  ├─ total_amount, tax_amount
│  ├─ created_by, created_at, updated_at
│  └─ deleted_at (soft delete)
│
├─ invoice_items
│  ├─ id, invoice_id (FK), product_id (FK)
│  ├─ description, quantity, unit_price
│  ├─ line_total (qty × price)
│  └─ tenant_id
│
└─ customers
   ├─ id, tenant_id, name, email
   └─ address, phone

Controllers:
├─ @UseGuards(AuthGuard, RoleGuard(['OWNER', 'ACCOUNTANT']))
├─ POST /invoices → create
├─ GET /invoices → list (paginated)
├─ GET /invoices/:id → view
├─ PATCH /invoices/:id → update
├─ DELETE /invoices/:id → soft delete
├─ POST /invoices/:id/send → send email
└─ POST /invoices/:id/mark-paid → update status

Middleware:
├─ Tenant filtering (all queries)
├─ User context attachment
└─ Soft delete handling

Tests:
├─ OWNER creates invoice → 201
├─ ACCOUNTANT creates invoice → 201
├─ MANAGER tries create → 403
├─ VIEWER tries create → 403
├─ Invoice only shows for specific tenant
└─ Pagination works (first 10, then next 10)
```

#### DAY 3-4: Integration with Spring Boot

**Connect to Accounting Service (port 8085):**
```
Backend Configuration:
├─ Create service: AccountingGateway
├─ HTTP client (axios or node-fetch)
├─ Call Spring Boot endpoints
├─ Handle failures gracefully

Example:
```typescript
@Injectable()
export class AccountingGatewayService {
  async postJournalEntry(data: JournalEntry) {
    try {
      return await this.http.post(
        'http://localhost:8085/api/journal-entries',
        data
      );
    } catch (error) {
      // Fallback: store locally, sync later
      this.queue.add(data);
      return { queued: true };
    }
  }
}
```

Flow:
1. Frontend creates invoice
2. NestJS backend stores in PostgreSQL
3. NestJS calls Spring Boot accounting service
4. Spring Boot creates GL entries
5. If Spring fails, queue entry for retry
6. Return success to frontend

Tests:
├─ Create invoice → verify in PostgreSQL
├─ Create invoice → verify GL entries in Spring Boot
├─ Spring Boot down → should queue for retry
├─ Manual sync button to retry queued entries
└─ Verify amounts match (invoice total = GL debit + credit)
```

#### DAY 5: End-to-End Testing

**Complete User Journey:**
```
✅ Test Scenario: New Business Onboarding

1. User Registration
   - Visit /register
   - Fill: email, password, name, business
   - Submit → redirect /dashboard
   - Verify: user in PG, tenant created

2. User Confirmation
   - Logout
   - Login with credentials
   - Verify: JWT has tenant_id
   - Verify: correct business name shown

3. Add Team Members (OWNER only)
   - Go to /admin/users
   - [+ Add User] button
   - Invite john@example.com as ACCOUNTANT
   - Verify: john in database with correct role & tenant

4. Create First Invoice (ACCOUNTANT)
   - Login as john (ACCOUNTANT)
   - Go to /invoices
   - [+ New Invoice]
   - Select customer, add items, set amount
   - Save → invoice stored
   - Verify: in database with correct tenant_id

5. Verify Data Isolation
   - Create 2nd tenant (register new user B)
   - Tenant A sees only Tenant A invoices
   - Tenant B sees only Tenant B invoices
   - Cross-tenant queries return 403/empty

6. Check Accounting Integration
   - New invoice creation
   - Verify GL entries in Spring Boot
   - Check amounts: invoice = GL

7. Performance Check
   - List 100 invoices: <2s
   - Create invoice: <1s
   - Login: <500ms
```

---

## DECISION CHECKLIST

Before starting each week, complete:

```
Week 1 Readiness:
  [ ] Team aligned on scope
  [ ] Design mockups reviewed
  [ ] API specs finalized
  [ ] Database schema confirmed
  [ ] Backend endpoints stubbed
  [ ] Testing approach agreed

Week 2 Readiness:
  [ ] Week 1 code reviewed
  [ ] No critical bugs found
  [ ] User management endpoints working
  [ ] Role ENUM properly defined
  [ ] Guard logic implemented
  [ ] Tests passing for Week 1

Week 3 Readiness:
  [ ] Week 2 code reviewed
  [ ] Multi-tenant isolation verified
  [ ] Spring Boot service responding
  [ ] Accounting tables ready
  [ ] Invoice schema finalized
  [ ] Integration points defined
```

---

## CRITICAL SUCCESS FACTORS

| Factor | What We're Watching | Action if Issue |
|--------|-------------------|-----------------|
| **Data Isolation** | Users see only own tenant data | Implement tenant middleware |
| **JWT Expiration** | Tokens expire, users redirected | Implement token refresh |
| **Role Enforcement** | Users can't bypass role checks | Verify guard decorators |
| **Password Security** | Passwords never logged/exposed | Audit logs + use bcrypt |
| **Performance** | Page loads <3s | Monitor query times |
| **Error Handling** | Clear user messages | Test all error paths |

---

## READY TO PROCEED?

**Complete the pre-flight checklist above**, then pick your starting day:

### Option A: Start Immediately
```bash
# Week 1 Day 1 Tasks
cd erp-web
npm run dev                    # Start frontend dev server
npm run build                  # Verify no errors

cd ../erp-api
npm run start:dev              # Start backend

# Then create auth pages following the detailed tasks above
```

### Option B: Plan First (Recommended)
```
1. Copy the detailed task lists to your project management tool
2. Assign tasks to team members
3. Schedule daily standups
4. Set up git branches
5. Define PR review process
6. Then start with Day 1
```

### Option C: Questions First
```
📧 What would you like to clarify about Phase 2?

- General approach?
- Specific technologies?
- Team structure?
- Timeline feasibility?
- Risk concerns?
- Budget/resources?

Ask now, before we start building!
```

---

**🚀 Which option appeals to you most?**
