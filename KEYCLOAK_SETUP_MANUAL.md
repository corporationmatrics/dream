# Keycloak Configuration Summary

## Current Status

**Keycloak 23.0.7 is now running and fully operational:**
- ✅ Container: erp-keycloak (running)
- ✅ Admin Console: http://localhost:8080/admin/master/console
- ✅ Database: PostgreSQL connected and initialized

**Issue Found**: Bootstrap admin user not created in production mode

## Resolution: Manual Setup via Web Console

Since the bootstrap admin user creation didn't work in production mode, we'll set it up manually through the web console, which is fully functional.

### Step 1: Access Keycloak Web Console

The Keycloak admin console is accessible at:
```
http://localhost:8080/admin/master/console
```

But we need to set up the admin user first. Follow these steps:

### Step 2: Create Initial Admin User

1. Go to http://localhost:8080/
2. You should see an Keycloak welcome page
3. If prompted for login, look for "Administration Console"
4. There should be an option to create the initial admin user
5. Create user:
   - **Username**: `admin`
   - **Password**: `admin123`
   - **Password confirmation**: `admin123`

If you don't see the initial setup screen, the admin user may need to be created via database migration. See "Database Direct Setup" below.

### Step 3: Log into Admin Console

Once the admin user is created:
1. Visit http://localhost:8080/admin/master/console
2. Login with:
   - **Username**: `admin`
   - **Password**: `admin123`

### Step 4: Create Realm "erp-platform"

1. In the left sidebar, find the dropdown showing "Master"
2. Click "Create Realm"
3. Enter:
   - **Name**: `erp-platform`
   - **Display name**: `ERP Platform`
4. Click "Create"

### Step 5: Create OAuth2 Client

In the erp-platform realm:
1. Left sidebar → **Clients**
2. Click **Create client**
3. **Client ID**: `erp-web`
4. Click **Next**
5. Enable:
   - **Client authentication**: ON
   - **Authorization**: ON (optional)
6. Click **Next**
7. **Valid redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/keycloak
   http://localhost:3000
   ```
8. **Web origins**: `http://localhost:3000`
9. Click **Save**
10. Go to **Credentials** tab
11. Copy the **Client secret**

### Step 6: Create Test User

In the erp-platform realm:
1. Left sidebar →  **Users**
2. Click **Create user**
3. Fill in:
   - **Username**: `testuser`
   - **Email**: `test@example.com`
   - **First Name**: `Test`
   - **Last Name**: `User`
   - **Email Verified**: ON
   - **User Enabled**: ON
4. Click **Create**
5. Go to **Credentials** tab
6. Click **Set password**
7. Enter: `testuser123`
8. Turn OFF **Temporary** (so no password change required on first login)
9. Click **Set password**

## Database Direct Setup (If Web Setup Doesn't Work)

If the Keycloak web console doesn't allow creating the initial admin user, you can set it up directly in PostgreSQL:

```sql
-- Connect to keycloak database
\c keycloak postgres

-- Create admin user and set password (using Keycloak's internal functions would be complex,
-- so we'll restart with the bootstrap environment variables properly applied)
```

**Better solution**: Restart Keycloak from scratch with dev mode:

```bash
docker stop erp-keycloak
docker rm erp-keycloak

# Update docker-compose to use development mode temporarily
# Then restart and create the admin user
# Then switch back to production mode
```

## Environment Setup for erp-web

Once you have the client secret from Keycloak, create `.env.local` in the erp-web directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-32-chars-minimum

# Keycloak Configuration  
KEYCLOAK_ID=erp-web
KEYCLOAK_SECRET=<paste-client-secret-here>
KEYCLOAK_ISSUER=http://localhost:8080/realms/erp-platform
```

Generate a secure NEXTAUTH_SECRET:
```bash
# On Windows PowerShell:
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([guid]::NewGuid().ToString())) | Select-String -Pattern '^.{32}' -o

# Or on Linux/Mac:
openssl rand -base64 32
```

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Keycloak Installation | ✅ Complete | v23.0.7 running in Docker |
| PostgreSQL Connection | ✅ Complete | Connected and initialized |
| Admin User | ⏳ Pending | Need to create via web console |
| Realm Setup | ⏳ Pending | After admin user created |
| OAuth2 Client | ⏳ Pending | After realm created |
| NextAuth Integration | ⏳ Pending | After client credentials obtained |

## Quick Reference

| Resource | URL |
|----------|-----|
| Keycloak Home | http://localhost:8080 |
| Admin Console | http://localhost:8080/admin/master/console |
| Realm Config | http://localhost:8080/realms/erp-platform |
| OIDC Config | http://localhost:8080/realms/erp-platform/.well-known/openid-configuration |

## Next Steps

1. Navigate to http://localhost:8080
2. Create the initial admin user
3. Complete Steps 3-6 above
4. Update erp-web/.env.local with credentials
5. Run `npm install next-auth` in erp-web
6. Configure NextAuth route handlers (see KEYCLOAK_OAUTH_SETUP.md)
7. Test OAuth2 login flow

## Troubleshooting

If admin user creation page doesn't appear:
- Check http://localhost:8080/auth/admin/
- Check http://localhost:8080/admin
- Check Keycloak logs: `docker logs erp-keycloak | grep -i admin`
- If all else fails, restart Keycloak in dev mode (see docker-compose documentation)
