import { createBrowserRouter } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { TopicSelection } from '../pages/TopicSelection';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <Login />
  },
  // Add these Clerk routes for OAuth callbacks
  {
    path: '/sign-in/*',
    element: (
      <SignIn 
        routing="path" 
        path="/sign-in"
        afterSignInUrl="/dashboard"
      />
    )
  },
  {
    path: '/sign-up/*',
    element: (
      <SignUp 
        routing="path" 
        path="/sign-up"
        afterSignUpUrl="/dashboard"
      />
    )
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/topics',
    element: (
      <ProtectedRoute>
        <TopicSelection />
      </ProtectedRoute>
    )
  }
]);
