import { jsx as _jsx } from "react/jsx-runtime";
import { createBrowserRouter } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
export const router = createBrowserRouter([
    {
        path: '/',
        element: (_jsx(ProtectedRoute, { children: _jsx(Home, {}) }))
    },
    {
        path: '/login',
        element: _jsx(Login, {})
    },
    // Add these Clerk routes for OAuth callbacks
    {
        path: '/sign-in/*',
        element: (_jsx(SignIn, { routing: "path", path: "/sign-in", afterSignInUrl: "/" }))
    },
    {
        path: '/sign-up/*',
        element: (_jsx(SignUp, { routing: "path", path: "/sign-up", afterSignUpUrl: "/" }))
    }
]);
