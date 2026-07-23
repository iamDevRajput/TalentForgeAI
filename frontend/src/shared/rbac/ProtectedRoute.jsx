/**
 * ProtectedRoute.jsx — Role-aware route guard
 *
 * Behaviour:
 *   - While auth is loading (rehydrating from localStorage): show spinner
 *   - Not authenticated: redirect to /auth/login
 *   - Authenticated but wrong role: show branded 403 Unauthorized page
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
import UnauthorizedPage from '@/shared/components/UnauthorizedPage';

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

  // Authenticated but wrong role — show branded 403 page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <UnauthorizedPage />;
  }

  return children;
}
