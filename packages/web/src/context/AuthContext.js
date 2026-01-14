import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const { user: clerkUser, isLoaded } = useUser();
    const { signOut: clerkSignOut } = useClerkAuth();
    // Transform Clerk user to our User type
    const user = clerkUser ? {
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
    return (_jsx(AuthContext.Provider, { value: {
            user,
            isLoading: !isLoaded,
            isAuthenticated: !!user,
            signOut
        }, children: children }));
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
function determineProvider(clerkUser) {
    // Logic to determine provider from Clerk user
    const externalAccounts = clerkUser.externalAccounts;
    if (externalAccounts.some((acc) => acc.provider === 'github')) {
        return 'github';
    }
    if (externalAccounts.some((acc) => acc.provider === 'google')) {
        return 'google';
    }
    return 'email';
}
