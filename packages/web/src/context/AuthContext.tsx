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
    createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt) : new Date(),
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