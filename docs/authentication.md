# Authentication Patterns

## Overview
Multi-provider OAuth authentication with email/password fallback using a third-party service.

## Recommended Auth Library
**Clerk** or **Auth0** - both provide:
- Multiple OAuth providers out-of-the-box
- Email/password authentication
- React hooks and components
- Token management
- Session handling

**For this project, recommend Clerk**:
- Better React integration
- Generous free tier
- Simpler setup for multiple providers

## Setup Pattern with Clerk

### 1. Installation
```bash
pnpm --filter web add @clerk/clerk-react
```

### 2. Environment Variables
```env
# .env.local in packages/web
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 3. App Configuration

**src/main.tsx**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
```

### 4. Auth Context (Wrapper)

**src/context/AuthContext.tsx**
```typescript
import { createContext, useContext, ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import type { User } from '@learning-platform/shared/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();

  // Transform Clerk user to our User type
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
    name: clerkUser.fullName ?? '',
    avatarUrl: clerkUser.imageUrl,
    authProvider: determineProvider(clerkUser),
    createdAt: new Date(clerkUser.createdAt),
    lastLoginAt: new Date()
  } : null;

  const signOut = async () => {
    await clerkSignOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: !isLoaded,
        isAuthenticated: !!user,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function determineProvider(clerkUser: any): User['authProvider'] {
  // Logic to determine provider from Clerk user
  const externalAccounts = clerkUser.externalAccounts;
  if (externalAccounts.some((acc: any) => acc.provider === 'github')) {
    return 'github';
  }
  if (externalAccounts.some((acc: any) => acc.provider === 'google')) {
    return 'google';
  }
  return 'email';
}
```

### 5. Protected Route Component

**src/components/auth/ProtectedRoute.tsx**
```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Replace with proper loading component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

### 6. Login Page

**src/pages/Login.tsx**
```typescript
import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <h1>Welcome to Learning Platform</h1>
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup"
        afterSignInUrl="/dashboard"
      />
    </div>
  );
}
```

### 7. Router Setup with Protection

**src/lib/router.tsx**
```typescript
import { createBrowserRouter } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { TopicSelection } from '@/pages/TopicSelection';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
    )
  },
  {
    path: '/topics',
    element: (
      <ProtectedRoute>
        <Layout>
          <TopicSelection />
        </Layout>
      </ProtectedRoute>
    )
  }
]);
```

## OAuth Providers to Enable

In Clerk dashboard, enable:
1. **GitHub** - Developer audience
2. **Google** - Broad reach
3. **Microsoft** - Enterprise users (optional)
4. **Email/Password** - Fallback

## Security Best Practices

1. **Never store sensitive data client-side**
```typescript
   // ❌ Bad
   localStorage.setItem('authToken', token);
   
   // ✅ Good - Clerk handles this internally
   // Tokens are stored in httpOnly cookies
```

2. **Always validate on server**
```typescript
   // When calling your API, Clerk provides the token
   const { getToken } = useAuth();
   const token = await getToken();
   
   fetch('/api/endpoint', {
     headers: {
       Authorization: `Bearer ${token}`
     }
   });
```

3. **Implement rate limiting** (especially for AI endpoints)

4. **Use environment variables for all keys**
```typescript
   // ✅ Good
   const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
   
   // ❌ Bad
   const key = "pk_test_hardcoded_key";
```

## Token Refresh Pattern
Clerk handles token refresh automatically. For custom API calls:
```typescript
// Custom hook for authenticated API calls
export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  return async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      // Token expired, Clerk will handle refresh
      const newToken = await getToken({ skipCache: true });
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
          'Content-Type': 'application/json'
        }
      });
    }

    return response;
  };
}
```

## Alternative: Auth0
If you prefer Auth0 instead of Clerk:
```bash
pnpm --filter web add @auth0/auth0-react
```

Similar pattern but with Auth0Provider and useAuth0 hook.
