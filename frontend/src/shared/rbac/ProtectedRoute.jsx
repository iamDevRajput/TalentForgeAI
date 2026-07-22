/**
 * ProtectedRoute.jsx — Role-aware route guard
 *
 * Behaviour:
 *   - While auth is loading (rehydrating from localStorage): show spinner
 *   - Not authenticated: redirect to /auth/login
 *   - Authenticated but wrong role: redirect to the correct role's dashboard
 *   - Authenticated + correct role: render children
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['hr']}>
 *     <HRDashboard />
 *   </ProtectedRoute>
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const ROLE_DEFAULT_PATHS = {
  hr: '/hr/dashboard',
  interviewer: '/interviewer/dashboard',
  candidate: '/candidate/dashboard',
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  // While rehydrating from localStorage, show a full-screen spinner.
  // This prevents a flash of the login page on refresh for authenticated users.
  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Not authenticated — redirect to login, preserving the intended path
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Authenticated but wrong role — redirect to correct dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultPath = ROLE_DEFAULT_PATHS[user.role] || '/auth/login';
    return <Navigate to={defaultPath} replace />;
  }

  return children;
}
