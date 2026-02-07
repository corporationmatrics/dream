# Quick Start: Keycloak OAuth2 + NextAuth Setup

## 🚀 5-Minute Quick Reference

### Current Status
✅ Keycloak 23.0.7 running on http://localhost:8080
✅ PostgreSQL initialized  
✅ erp-web running on http://localhost:3000

### Immediate Action: Create Admin User

Visit: http://localhost:8080

You should see either:
- **Option A**: Admin console login (create admin user there)
- **Option B**: Initial setup screen (create admin during setup)

**Credentials to create:**
- Username: `admin`
- Password: `admin123`

### After Admin User Created

**Step 1: Create Realm (2 minutes)**
```
Sidebar: Master → Create Realm
Name: erp-platform
Create
```

**Step 2: Create OAuth2 Client (3 minutes)**
```
Sidebar: Clients → Create client
Client ID: erp-web
Next → Next
Valid redirect URIs:
  http://localhost:3000/api/auth/callback/keycloak
  http://localhost:3000
Web Origins: http://localhost:3000
Save
Credentials tab → Copy Client Secret
```

**Step 3: Create Test User (2 minutes)**
```
Sidebar: Users → Create user
Username: testuser
Email: testuser@example.com
Email verified: ON
Enabled: ON
Create
Credentials tab → Set password: testuser123
Temporary: OFF
Set password
```

### Setup NextAuth in erp-web (15 minutes)

```bash
# 1. Install NextAuth
cd erp-web
npm install next-auth

# 2. Create .env.local
copy-item ..\.env.example .env.local
# Edit .env.local:
# KEYCLOAK_SECRET=<paste-from-step-2>
# NEXTAUTH_SECRET=<any-random-string>

# 3. Start dev server
npm run dev
```

### Test Login Flow (5 minutes)

1. Open http://localhost:3000
2. Click "Sign In" button
3. Login with: `testuser` / `testuser123`
4. Should redirect back with session active

---

## Full Guides (Detailed)

| Document | Purpose |
|----------|---------|
| [KEYCLOAK_OAUTH_SETUP.md](./KEYCLOAK_OAUTH_SETUP.md) | Step-by-step Keycloak configuration |
| [KEYCLOAK_SETUP_MANUAL.md](./KEYCLOAK_SETUP_MANUAL.md) | Web console walkthrough with screenshots guidance |
| [NEXTAUTH_KEYCLOAK_INTEGRATION.md](./NEXTAUTH_KEYCLOAK_INTEGRATION.md) | Complete NextAuth implementation with examples |
| [PHASE_1B_KEYCLOAK_SUMMARY.md](./PHASE_1B_KEYCLOAK_SUMMARY.md) | Full technical summary |
| `setup-keycloak-automated.ps1` | PowerShell automation (run after admin created) |

---

## Keycloak Dashboard URLs

| Resource | URL |
|----------|-----|
| Home/Setup | http://localhost:8080 |
| Admin Console | http://localhost:8080/admin/master/console |
| Realm Selector | Click "Master" dropdown in admin console |

---

## NextAuth File Structure to Create

```
erp-web/
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/route.ts          [CREATE]
│   │   └── layout.tsx                                [UPDATE]
│   ├── components/
│   │   └── AuthButton.tsx                            [CREATE]
│   └── hooks/
│       └── useApiCall.ts                             [CREATE]
├── types/
│   └── next-auth.d.ts                                [CREATE]
└── .env.local                                        [CREATE]
```

---

## Env Variables Needed

Create `.env.local` in erp-web:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-something-random>
KEYCLOAK_ID=erp-web
KEYCLOAK_SECRET=<copy-from-keycloak>
KEYCLOAK_ISSUER=http://localhost:8080/realms/erp-platform
```

---

## Test Credentials

Once setup is complete:
- **Username**: `testuser`
- **Password**: `testuser123`
- **Keycloak Admin**: `admin` / `admin123`

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't see admin setup at localhost:8080 | Wait 30s for Keycloak boot, refresh page |
| "Invalid redirect_uri" | Check redirect exactly matches: `http://localhost:3000/api/auth/callback/keycloak` |
| Session not working | Verify NEXTAUTH_SECRET in .env.local is set |
| JWT not in session | Implement JWT callback (see NEXTAUTH guide) |

---

## Next Commands to Run

```bash
# In erp-web directory:
npm install next-auth
npm run dev

# Then visit:
http://localhost:3000
```

---

## Success = 
✅ Can login with testuser/testuser123
✅ Session shows logged-in state  
✅ Redirects back from Keycloak work

Estimated time: **30-45 minutes total**

---

Need help? See [KEYCLOAK_SETUP_MANUAL.md](./KEYCLOAK_SETUP_MANUAL.md) for detailed walkthrough.
