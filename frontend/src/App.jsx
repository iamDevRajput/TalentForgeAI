/**
 * App.jsx — Role-aware routing root
 *
 * Route structure:
 *   /                      → Redirects to role-specific dashboard or /auth/login
 *   /auth/login            → LoginPage (public)
 *   /auth/register         → RegisterPage (public, candidate only)
 *   /hr/*                  → Protected, role=hr
 *   /interviewer/*         → Protected, role=interviewer
 *   /candidate/*           → Protected, role=candidate
 *
 * Each ProtectedRoute:
 *   1. Shows spinner while auth rehydrates from localStorage
 *   2. Redirects to /auth/login if not authenticated
 *   3. Redirects to correct role dashboard if authenticated but wrong role
 *
 * Phase 2+ adds child routes inside each role prefix.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import ProtectedRoute from '@/shared/rbac/ProtectedRoute';
import ErrorBoundary from '@/shared/components/ErrorBoundary';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

// Auth pages
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';

// Role dashboards (Phase 1 shells)
import HRDashboard from '@/features/hr/HRDashboard';
import JobPipeline from '@/features/hr/JobPipeline';
import InterviewerDashboard from '@/features/interviewer/InterviewerDashboard';
import CandidateDashboard from '@/features/candidate/CandidateDashboard';

const ROLE_DEFAULTS = {
  hr: '/hr/dashboard',
  interviewer: '/interviewer/dashboard',
  candidate: '/candidate/dashboard',
};

/**
 * Root redirect: if authenticated, go to role dashboard; else to login.
 */
function RootRedirect() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth/login" replace />;
  return <Navigate to={ROLE_DEFAULTS[user.role] || '/auth/login'} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public auth routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        {/* HR routes — Phase 1: dashboard only */}
        <Route
          path="/hr/dashboard"
          element={
            <ProtectedRoute allowedRoles={['hr']}>
              <HRDashboard />
            </ProtectedRoute>
          }
        />
        {/* Phase 2+: /hr/jobs, /hr/candidates, /hr/pipeline, etc. */}
        <Route
          path="/hr/jobs/:jobId/pipeline"
          element={
            <ProtectedRoute allowedRoles={['hr']}>
              <JobPipeline />
            </ProtectedRoute>
          }
        />

        {/* Interviewer routes */}
        <Route
          path="/interviewer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['interviewer']}>
              <InterviewerDashboard />
            </ProtectedRoute>
          }
        />
        {/* Phase 8+: /interviewer/interviews, /interviewer/feedback */}

        {/* Candidate routes */}
        <Route
          path="/candidate/dashboard"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        {/* Phase 3+: /candidate/resume, /candidate/applications */}

        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background text-center">
              <p className="text-6xl font-bold text-muted-foreground/20">404</p>
              <h2 className="text-xl font-semibold text-foreground">Page not found</h2>
              <p className="text-sm text-muted-foreground">
                The page you're looking for doesn't exist or you don't have access.
              </p>
              <a
                href="/"
                className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Go home
              </a>
            </div>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}
