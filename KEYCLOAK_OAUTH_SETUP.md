# Keycloak OAuth2 Setup for ERP Web

## Summary
Keycloak 23.0.7 is now running and accessible. This guide will walk you through setting up OAuth2 authentication for the erp-web frontend.

**Keycloak Admin Console**: http://localhost:8080/admin/master/console/

## Step 1: Login to Admin Console

1. Open http://localhost:8080/admin/master/console/
2. Login with:
   - Username: `admin`
   - Password: `admin123`

## Step 2: Create Realm "erp-platform"

1. In the left sidebar, click the dropdown showing "Master"
2. Click "Create Realm"
3. Enter:
   - **Realm name**: `erp-platform`
   - **Display name**: `ERP Platform`
   - Click "Create"

## Step 3: Create OAuth2 Client "erp-web"

1. In the left sidebar, click **Clients**
2. Click **Create client**
3. Enter:
   - **Client type**: Select "OpenID Connect" (default)
   - **Client ID**: `erp-web`
   - Click **Next**
4. **Capability config** (next screen):
   - Toggle ON: **Client authentication** (use client secret)
   - Toggle ON: **Authorization** (optional)
   - Click **Next**
5. **Login settings**:
   - Valid redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/keycloak
     http://localhost:3000
     ```
   - Web origins:
     ```
     http://localhost:3000
     ```
   - Click **Save**

## Step 4: Get Client Credentials

1. Click on the **erp-web** client
2. Go to **Credentials** tab
3. Copy the **Client secret** (you'll need this for NextAuth)

## Step 5: Create Test User

1. In the left sidebar, click **Users**
2. Click **Create user**
3. Enter:
   - **Username**: `testuser`
   - **Email**: `test@example.com`
   - **First name**: `Test`
   - **Last name**: `User`
   - Toggle ON: **Email verified**
   - Toggle ON: **Enabled**
   - Click **Create**
4. Go to **Credentials** tab
5. Click **Set password**
6. Enter password: `testuser123` (or your preferred)
7. Toggle ON: **Temporary** OFF (so password doesn't need change on first login)
8. Click **Set password**

## Step 6: Configure NextAuth in erp-web

Create/update `.env.local` in erp-web root:

```env
# Keycloak OAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
KEYCLOAK_ID=erp-web
KEYCLOAK_SECRET=<copy from Step 4>
KEYCLOAK_ISSUER=http://localhost:8080/realms/erp-platform
KEYCLOAK_AUTHORIZATION_ENDPOINT=http://localhost:8080/realms/erp-platform/protocol/openid-connect/auth
KEYCLOAK_TOKEN_ENDPOINT=http://localhost:8080/realms/erp-platform/protocol/openid-connect/token
KEYCLOAK_USERINFO_ENDPOINT=http://localhost:8080/realms/erp-platform/protocol/openid-connect/userinfo
KEYCLOAK_LOGOUT_ENDPOINT=http://localhost:8080/realms/erp-platform/protocol/openid-connect/logout
```

## Step 7: Install NextAuth in erp-web

If not already installed:

```bash
cd erp-web
npm install next-auth
```

## Step 8: Configure NextAuth in erp-web

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

const handler = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
```

Extend NextAuth session type in `types/next-auth.d.ts`:

```typescript
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}
```

## Step 9: Update Layout for Authentication UI

Update `src/app/layout.tsx`:

```typescript
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

## Step 10: Add Login/Logout Buttons

Create `src/components/AuthButton.tsx`:

```typescript
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        <p>User: {session.user?.name}</p>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    );
  }

  return <button onClick={() => signIn("keycloak")}>Sign In with Keycloak</button>;
}
```

Use in navbar:

```typescript
import { AuthButton } from "@/components/AuthButton";

export function Navbar() {
  return (
    <nav>
      <div>ERP Dashboard</div>
      <AuthButton />
    </nav>
  );
}
```

## Testing Authentication

1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000
3. Click "Sign In with Keycloak"
4. You'll be redirected to Keycloak login
5. Login with:
   - Username: `testuser`
   - Password: `testuser123`
6. You'll be redirected back to the app

## Troubleshooting

### "Invalid redirect_uri" error
- Check that redirect URI in Step 3 matches exactly: `http://localhost:3000/api/auth/callback/keycloak`
- Ensure web origins includes `http://localhost:3000`

### "Client secret not matching" error
- Verify KEYCLOAK_SECRET in `.env.local` matches the client secret from Keycloak admin console

### CORS errors
- Check that web origins in Keycloak client includes your frontend URL

### Keycloak not accessible
- Verify Keycloak is running: `docker ps | grep keycloak`
- Check logs: `docker logs erp-keycloak`

## Next Steps

After authentication is working:
1. Implement user profile endpoint
2. Add role-based access control (RBAC)
3. Integrate JWT token with API calls
4. Setup refresh token rotation
5. Add logout functionality
