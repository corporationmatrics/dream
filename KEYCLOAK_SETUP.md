# Keycloak Integration Guide
# Complete setup instructions for Keycloak authentication

## Overview
This guide walks through:
1. Deploying Keycloak in Docker
2. Creating realm and clients
3. Integrating with NestJS API
4. Integrating with Next.js web
5. Migrating from existing auth

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Keycloak (OpenID Provider)              │
│  - User management                                              │
│  - Authentication (OAuth 2.0 / OpenID Connect)                │
│  - Multi-tenancy (B2B realms)                                  │
│  - 2FA / Email verification                                    │
│  - Audit logging                                               │
└─────────────────────────────────────────────────────────────────┘
           ↑                               ↑
      OAuth2 flow                    OAuth2 flow
      + JWT tokens                   + JWT tokens
           ↓                               ↓
┌─────────────────────┐        ┌──────────────────────┐
│   erp-api (NestJS)  │        │ erp-web (Next.js)    │
│                     │        │                      │
│ - Validate JWTs     │        │ - next-auth          │
│ - RBAC via scopes   │        │ - Session handling   │
│ - API endpoints     │        │ - Protected pages    │
└─────────────────────┘        └──────────────────────┘
```

---

## Step 1: Deploy Keycloak

### Docker Compose Setup

Keycloak is already configured in `docker-compose-all-phases.yml`. No additional configuration needed.

```yaml
version: '3.8'

services:
  # Postgres for Keycloak (separate from main DB)
  keycloak-db:
    image: postgres:15-alpine
    container_name: keycloak-db
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak_db_password
    volumes:
      - keycloak_db_data:/var/lib/postgresql/data
    networks:
      - erp-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U keycloak"]
      interval: 10s
      timeout: 5s
      retries: 5

  keycloak:
    image: quay.io/keycloak/keycloak:latest
    container_name: keycloak
    depends_on:
      keycloak-db:
        condition: service_healthy
    ports:
      - "8080:8080"
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak_db_password
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin123
      KC_LOG_LEVEL: INFO
      KC_METRICS_ENABLED: 'true'
      KC_HEALTH_ENABLED: 'true'
    networks:
      - erp-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health/ready"]
      interval: 15s
      timeout: 5s
      retries: 5
    command: "start-dev"  # Use "start" for production

volumes:
  keycloak_db_data:

networks:
  erp-network:
    driver: bridge
```

### Start Keycloak

```powershell
cd erp-infrastructure
docker-compose up -d keycloak
docker-compose logs -f keycloak

# Wait for "User created with ID:" message
```

### Access Keycloak Admin Console
- URL: http://localhost:8080
- Username: admin
- Password: admin123

---

## Step 2: Configure Keycloak Realm

### 2.1 Create Realm

1. Login to Keycloak Admin Console
2. Hover over "Keycloak" at top-left
3. Click "Create Realm"
4. Realm name: `erp-platform`
5. Click "Create"

### 2.2 Create erp-api Client

1. Go to "Clients" → "Create client"
2. Client ID: `erp-api`
3. Client authentication: ON
4. Authorization: ON
5. Click "Next"

**Capability config:**
- Standard flow enabled: ✓
- Direct access grants enabled: ✓
- Service accounts roles: ✓

6. Click "Save"

### 2.3 Configure erp-api Client

Go to Settings tab:
- Valid redirect URIs: `http://localhost:3002/*`
- Valid post logout redirect URIs: `http://localhost:3002/*`
- Web origins: `http://localhost:3002`

Go to Credentials tab:
- Copy `Client Secret` → save in .env.local

### 2.4 Create erp-web Client

1. Go to "Clients" → "Create client"
2. Client ID: `erp-web`
3. Client authentication: OFF (public client)
4. Authorization: OFF
5. Click "Next"

**Capability config:**
- Standard flow enabled: ✓
- Implicit flow enabled: ✓

6. Click "Save"

### 2.5 Configure erp-web Client

Go to Settings tab:
- Valid redirect URIs: `http://localhost:3000/*`
- Valid post logout redirect URIs: `http://localhost:3000/*`
- Web origins: `http://localhost:3000`
- Login theme: (optional) keycloak

### 2.6 Create Roles

Go to "Realm Roles":

Create these roles:
- `admin` - Full access
- `manager` - Business operations
- `staff` - Employee operations
- `customer` - Customer access
- `supplier` - Supplier/partner access

### 2.7 Create Test Users

Go to "Users" → "Add user":

**User 1: Admin**
- Username: `admin@erp.local`
- Email: `admin@erp.local`
- Email verified: ✓
- First name: Admin
- Last name: User
- Enabled: ✓

Go to "Credentials":
- Set password: `Admin@123`
- Temporary: OFF

Go to "Role mapping":
- Assign roles: `admin`

**User 2: Manager**
- Username: `manager@erp.local`
- Email: `manager@erp.local`
- Password: `Manager@123`
- Roles: `manager`

**User 3: Supplier**
- Username: `supplier@erp.local`
- Email: `supplier@erp.local`
- Password: `Supplier@123`
- Roles: `supplier`

---

## Step 3: NestJS Integration

### 3.1 Install Dependencies

```bash
cd erp-api
npm install --save \
  @nestjs/passport \
  passport \
  passport-openidconnect \
  jsonwebtoken \
  @types/jsonwebtoken
```

### 3.2 Create Keycloak Strategy

File: `src/auth/strategies/keycloak.strategy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-openidconnect';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      issuer: configService.get('KEYCLOAK_ISSUER'),
      authorizationURL: configService.get('KEYCLOAK_AUTH_URL'),
      tokenURL: configService.get('KEYCLOAK_TOKEN_URL'),
      userInfoURL: configService.get('KEYCLOAK_USERINFO_URL'),
      clientID: configService.get('KEYCLOAK_CLIENT_ID'),
      clientSecret: configService.get('KEYCLOAK_CLIENT_SECRET'),
      callbackURL: configService.get('KEYCLOAK_CALLBACK_URL'),
      scope: ['openid', 'profile', 'email'],
    });
  }

  validate(profile: any) {
    return {
      id: profile.sub,
      email: profile.email,
      name: profile.name,
      roles: profile.realm_access?.roles || [],
      preferred_username: profile.preferred_username,
    };
  }
}
```

### 3.3 Create JWT Guard

File: `src/auth/guards/jwt.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  async canActivate(context: any): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      return false;
    }

    try {
      // Get JWKS from Keycloak for token verification
      const keycloakUrl = process.env.KEYCLOAK_URL;
      const realm = process.env.KEYCLOAK_REALM;
      
      const jwksUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;
      const response = await axios.get(jwksUrl);
      const jwks = response.data;

      // Verify JWT
      const decoded = jwt.verify(token, this.getPublicKey(jwks, token), {
        algorithms: ['RS256'],
      });

      request.user = decoded;
      return true;
    } catch (error) {
      return false;
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private getPublicKey(jwks: any, token: string) {
    const decoded = jwt.decode(token, { complete: true });
    const kid = decoded?.header?.kid;
    const key = jwks.keys.find((key: any) => key.kid === kid);
    return key;
  }
}
```

### 3.4 Update Auth Module

File: `src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { KeycloakStrategy } from './strategies/keycloak.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [PassportModule, ConfigModule],
  providers: [KeycloakStrategy, AuthService],
  controllers: [AuthController],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
```

### 3.5 Environment Variables

Add to `.env.local`:

```bash
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=erp-platform
KEYCLOAK_CLIENT_ID=erp-api
KEYCLOAK_CLIENT_SECRET=<copy from Keycloak>
KEYCLOAK_ISSUER=http://localhost:8080/realms/erp-platform
KEYCLOAK_AUTH_URL=http://localhost:8080/realms/erp-platform/protocol/openid-connect/auth
KEYCLOAK_TOKEN_URL=http://localhost:8080/realms/erp-platform/protocol/openid-connect/token
KEYCLOAK_USERINFO_URL=http://localhost:8080/realms/erp-platform/protocol/openid-connect/userinfo
KEYCLOAK_CALLBACK_URL=http://localhost:3002/auth/callback
```

---

## Step 4: Next.js Integration

### 4.1 Install next-auth

```bash
cd erp-web
npm install --save next-auth
```

### 4.2 Create Auth Configuration

File: `src/lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Keycloak',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const tokenResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/token`,
            {
              grant_type: 'password',
              client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
              username: credentials?.email,
              password: credentials?.password,
            }
          );

          const user = {
            id: tokenResponse.data.sub,
            email: credentials?.email,
            accessToken: tokenResponse.data.access_token,
            refreshToken: tokenResponse.data.refresh_token,
          };

          return user;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        accessToken: token.accessToken,
      };
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
```

### 4.3 Create API Route for Auth

File: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 4.4 Create Login Page

File: `src/app/login/page.tsx`

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      router.push('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <button
          type="submit"
          className="w-full bg-blue-500 text-white font-bold py-2 rounded"
        >
          Login
        </button>

        <p className="mt-4 text-sm text-gray-600">
          Demo credentials:
          <br />
          Email: admin@erp.local
          <br />
          Password: Admin@123
        </p>
      </form>
    </div>
  );
}
```

### 4.5 Create Protected Page

File: `src/app/dashboard/page.tsx`

```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Welcome, {session.user?.email}!</p>
      
      <button
        onClick={() => signOut()}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
```

---

## Step 5: Migrate Existing Users

### 5.1 Export Current Users

From existing PostgreSQL:

```sql
SELECT email, password_hash, first_name, last_name, created_at
FROM users
WHERE deleted_at IS NULL;
```

### 5.2 Import to Keycloak

Use Keycloak Admin REST API (see `keycloak-import.js` script below)

File: `scripts/keycloak-import.js`

```javascript
const axios = require('axios');
const fs = require('fs');
const bcrypt = require('bcrypt');

const KEYCLOAK_URL = 'http://localhost:8080';
const REALM = 'erp-platform';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

async function setupKeycloak() {
  // Get admin token
  const tokenResponse = await axios.post(
    `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
    {
      grant_type: 'password',
      client_id: 'admin-cli',
      username: ADMIN_USER,
      password: ADMIN_PASS,
    },
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const token = tokenResponse.data.access_token;

  // Read users from CSV/JSON
  const users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));

  // Create users in Keycloak
  for (const user of users) {
    try {
      const response = await axios.post(
        `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
        {
          username: user.email,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          enabled: true,
          credentials: [
            {
              type: 'password',
              value: 'TempPassword123!', // User should reset
              temporary: true,
            },
          ],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(`✓ Created user: ${user.email}`);
    } catch (error) {
      console.error(`✗ Failed to create ${user.email}:`, error.response?.data);
    }
  }
}

setupKeycloak();
```

Run:
```bash
node scripts/keycloak-import.js
```

---

## Testing

### Test 1: Test User Login

```bash
curl -X POST http://localhost:8080/realms/erp-platform/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=erp-api" \
  -d "client_secret=<YOUR_SECRET>" \
  -d "username=admin@erp.local" \
  -d "password=Admin@123"
```

Should return JWT token.

### Test 2: Access Protected API

```bash
curl -X GET http://localhost:3002/api/profile \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

Should return user profile.

### Test 3: Web Login

1. Navigate to http://localhost:3000/login
2. Enter: admin@erp.local / Admin@123
3. Should redirect to /dashboard

---

## Production Considerations

### 1. TLS/HTTPS
```yaml
keycloak:
  environment:
    KC_PROXY: edge
    KC_HOSTNAME: keycloak.yourdomain.com
    KC_HOSTNAME_STRICT: 'true'
```

### 2. Database
Use PostgreSQL production setup (not included in docker-compose-dev).

### 3. Performance
- Cache JWKS locally
- Use Redis for session store
- Enable caching headers

### 4. Security
- Use strong passwords
- Enable 2FA
- Set up audit logging
- Use network policies in K8s

---

## Troubleshooting

### Issue: "Invalid redirect_uri"
**Solution:** Check Keycloak client settings, ensure redirect URIs are correct.

### Issue: "CORS errors"
**Solution:** Add Web Origins to Keycloak client settings.

### Issue: "Token verification failed"
**Solution:** Ensure KEYCLOAK_URL matches the one in JWT issuer claim.

### Debug Tips
```bash
# View Keycloak logs
docker logs keycloak

# Check token content
echo <TOKEN> | cut -d'.' -f2 | base64 -d | jq

# Keycloak metrics
curl http://localhost:8080/metrics
```

---

## Next Steps

1. ✅ Deploy Keycloak
2. ✅ Create realm & clients
3. ✅ Integrate NestJS
4. ✅ Integrate Next.js
5. Migrate existing users
6. Set up B2B realms (multi-tenancy)
7. Configure 2FA
8. Enable audit logging

