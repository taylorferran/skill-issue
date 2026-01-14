import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui';
import './Login.styles.css';
export function Login() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    if (isAuthenticated) {
        navigate('/');
        return null;
    }
    const handleLogin = () => {
        navigate('/sign-in');
    };
    return (_jsx("div", { className: "loginContainer", children: _jsxs("div", { className: "loginContent", children: [_jsxs("div", { className: "loginHeader", children: [_jsx("h1", { children: "Welcome to Skill Issues" }), _jsx("p", { children: "Your AI-powered learning platform" })] }), _jsx("div", { className: "loginButtonContainer", children: _jsx(Button, { variant: "primary", size: "large", onClick: handleLogin, className: "loginButton", children: "Sign In to Continue" }) }), _jsxs("div", { className: "loginFeatures", children: [_jsxs("div", { className: "feature", children: [_jsx("span", { className: "featureIcon", children: "\uD83D\uDE80" }), _jsx("span", { children: "AI-powered learning experiences" })] }), _jsxs("div", { className: "feature", children: [_jsx("span", { className: "featureIcon", children: "\uD83D\uDCDA" }), _jsx("span", { children: "Multiple programming languages" })] }), _jsxs("div", { className: "feature", children: [_jsx("span", { className: "featureIcon", children: "\uD83C\uDFAF" }), _jsx("span", { children: "Personalized learning paths" })] })] })] }) }));
}
