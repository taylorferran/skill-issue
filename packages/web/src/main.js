import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_YW1hemVkLW1hcm1vc2V0LTcwLmNsZXJrLmFjY291bnRzLmRldiQ';
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(ClerkProvider, { publishableKey: clerkPubKey, children: _jsx(App, {}) }) }));
