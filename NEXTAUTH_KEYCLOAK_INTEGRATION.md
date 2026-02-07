# NextAuth + Keycloak Integration Guide for erp-web

## Overview

This guide shows how to integrate NextAuth with Keycloak for authentication in the erp-web Next.js application.

## Prerequisites

- ✅ Keycloak 23.0.7 running on http://localhost:8080
- ✅ erp-platform realm created in Keycloak
- ✅ erp-web OAuth2 client configured in Keycloak
- ⏳ Next.js project (erp-web) set up

## Installation

### Step 1: Install NextAuth

```bash
cd erp-web
npm install next-auth
```

### Step 2: Environment Variables

Create or update `.env.local`:

```env
# NextAuth Settings
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-secret-here

# Keycloak OAuth Provider
NEXTAUTH_PROVIDER=keycloak
KEYCLOAK_ID=erp-web
KEYCLOAK_SECRET=<client-secret-from-keycloak>
KEYCLOAK_ISSUER=http://localhost:8080/realms/erp-platform
```

Generate a secure NEXTAUTH_SECRET:

**PowerShell:**
```powershell
[Convert]::ToBase64String(([guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()).Substring(0, 32) | ConvertTo-SecureString -AsPlainText -Force | ConvertFrom-SecureString)
```

**Or use openssl if available:**
```bash
openssl rand -base64 32
```

### Step 3: Create Auth Route

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

const handler = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID || "",
      clientSecret: process.env.KEYCLOAK_SECRET || "",
      issuer: process.env.KEYCLOAK_ISSUER || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("User signed in:", user?.email);
    },
    async signOut() {
      console.log("User signed out");
    },
  },
});

export { handler as GET, handler as POST };
```

### Step 4: Extend Session Types

Create `types/next-auth.d.ts`:

```typescript
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: {
      email?: string;
      name?: string;
      image?: string;
    };
  }

  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}
```

### Step 5: Add SessionProvider to Layout

Update `src/app/layout.tsx`:

```typescript
"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

## Components

### AuthButton Component

Create `src/components/AuthButton.tsx`:

```typescript
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />;
  }

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="rounded-full">
            {session.user.name || session.user.email}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={() => signIn("keycloak")} variant="default">
      Sign In
    </Button>
  );
}
```

### Protected Page Example

Create `src/app/protected/page.tsx`:

```typescript
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function ProtectedPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    redirect("/");
  }

  return (
    <div className="p-8">
      <h1>Protected Page</h1>
      <p>Welcome, {session?.user?.name}</p>
      <p>Email: {session?.user?.email}</p>
    </div>
  );
}
```

### Login Page

Create `src/app/login/page.tsx`:

```typescript
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">ERP Dashboard</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <Button
          onClick={() => signIn("keycloak", { callbackUrl: "/dashboard" })}
          className="w-full h-12"
          size="lg"
        >
          Sign in with Keycloak
        </Button>

        <p className="text-center text-sm text-gray-600">
          Demo credentials: testuser / testuser123
        </p>
      </div>
    </div>
  );
}
```

## Testing

### Step 1: Start Development Server

```bash
cd erp-web
npm run dev
```

### Step 2: Navigate to Sign In

Go to http://localhost:3000/login

### Step 3: Click "Sign in with Keycloak"

You'll be redirected to Keycloak's login page.

### Step 4: Login

Use the test credentials:
- **Username**: `testuser`
- **Password**: `testuser123`

### Step 5: Redirect Back

You'll be redirected back to http://localhost:3000 with an active session.

## Advanced Features

### Refresh Token Rotation

Update callbacks in `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
callbacks: {
  async jwt({ token, account }) {
    if (account) {
      token.accessToken = account.access_token;
      token.refreshToken = account.refresh_token;
      token.expiresAt = (account.expires_at || 0) * 1000;
    }

    // Refresh token if expired
    if (token.expiresAt && Date.now() > token.expiresAt - 60000) {
      try {
        const response = await fetch(
          `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.KEYCLOAK_ID || "",
              client_secret: process.env.KEYCLOAK_SECRET || "",
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          }
        );

        const refreshedTokens = await response.json();
        return {
          ...token,
          accessToken: refreshedTokens.access_token,
          refreshToken: refreshedTokens.refresh_token,
          expiresAt: refreshedTokens.expires_in * 1000 + Date.now(),
        };
      } catch (error) {
        console.error("Token refresh failed:", error);
        return { ...token, error: "RefreshTokenError" };
      }
    }

    return token;
  },
}
```

### Role-Based Access Control (RBAC)

Add roles to Keycloak client and check in NextAuth:

```typescript
async session({ session, token }) {
  if (token.roles) {
    session.user.roles = token.roles;
  }
  return session;
}
```

Protect routes based on roles:

```typescript
export async function middleware(request: NextRequest) {
  const session = await getServerSession();
  
  if (!session?.user.roles?.includes("admin")) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

## API Integration

### Calling Backend API with Access Token

Create a service hook:

```typescript
// src/hooks/useApiCall.ts
import { useSession } from "next-auth/react";
import { useCallback } from "react";

export function useApiCall() {
  const { data: session } = useSession();

  return useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = {
        ...options.headers,
        Authorization: `Bearer ${session?.accessToken}`,
      };

      return fetch(url, {
        ...options,
        headers,
      });
    },
    [session?.accessToken]
  );
}
```

Usage:

```typescript
"use client";

import { useApiCall } from "@/hooks/useApiCall";
import { useEffect, useState } from "react";

export function ProductsPage() {
  const apiCall = useApiCall();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    apiCall("/api/products")
      .then((res) => res.json())
      .then(setProducts);
  }, [apiCall]);

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid redirect_uri" | Ensure redirect URI in Keycloak matches exactly: `http://localhost:3000/api/auth/callback/keycloak` |
| "Client secret mismatch" | Verify KEYCLOAK_SECRET in .env.local matches Keycloak admin console |
| CORS errors | Check Keycloak client "Web Origins" includes `http://localhost:3000` |
| Session not persisting | Ensure SessionProvider wraps the entire app in layout |
| Token not in session | Check JWT callback is properly returning accessToken |

## Security Checklist

- [ ] Use HTTPS in production (KC_HTTP_ENABLED=false, set KC_HOSTNAME properly)
- [ ] Store NEXTAUTH_SECRET in .env.local (never commit to git)
- [ ] Add .env.local to .gitignore
- [ ] Use strong client secret from Keycloak
- [ ] Enable PKCE in production (Keycloak setting)
- [ ] Implement token refresh logic
- [ ] Log security events
- [ ] Use secure cookies (secure: true in production)
- [ ] Implement CSRF protection (NextAuth handles this)

## References

- [NextAuth Documentation](https://next-auth.js.org)
- [NextAuth Keycloak Provider](https://next-auth.js.org/providers/keycloak)
- [Keycloak OAuth 2.0 / OpenID Connect](https://www.keycloak.org/docs/latest/securing_apps/)
- [Next.js Middleware](https://nextjs.org/docs/advanced-features/middleware)

## Support & Questions

For issues:
1. Check Keycloak logs: `docker logs erp-keycloak`
2. Check NextAuth logs in browser console
3. Verify environment variables: `echo $KEYCLOAK_ID` (should not be empty)
4. Test OIDC config: http://localhost:8080/realms/erp-platform/.well-known/openid-configuration
