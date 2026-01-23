import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return _jsx("div", { children: "Loading..." });
    }
    if (!isAuthenticated) {
        // Redirect to /sign-in (where Clerk handles OAuth)
        return _jsx(Navigate, { to: "/sign-in", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
