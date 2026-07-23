import { BrandLogo } from "@/shared/components/Brand";
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
import { Sparkles } from 'lucide-react';
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
      <div className="flex flex-col h-dvh items-center justify-center bg-background">
        <BrandLogo markSize="size-12" textSize="text-2xl" className="animate-pulse" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth/login" replace />;
  return <Navigate to={ROLE_DEFAULTS[user.role] || '/auth/login'} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="relative min-h-dvh w-full bg-background font-sans text-foreground">
        {/* Global Signature: Forge Grid Background */}
        <div className="fixed inset-0 pointer-events-none forge-grid opacity-[0.15] mix-blend-overlay z-0" />
        
        <div className="relative z-10 h-full w-full">
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
            <div className="gradient-bg relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4">
              <div className="absolute inset-0 bg-grid-pattern opacity-50 mix-blend-overlay pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-md">
                {/* Brand */}
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-[0_0_24px_hsl(var(--primary)/0.35)] ring-1 ring-white/10">
                    <Sparkles className="size-5 text-white" />
                  </div>
                  <span className="text-[15px] font-bold text-foreground tracking-tight">
                    TalentForge<span className="gradient-text">AI</span>
                  </span>
                </div>
                {/* 404 number */}
                <div>
                  <p className="text-[120px] font-black leading-none tracking-tight text-foreground/5 select-none">404</p>
                  <h1 className="-mt-6 text-2xl font-bold tracking-tight text-foreground">Page Not Found</h1>
                  <p className="mt-3 text-[15px] text-muted-foreground max-w-xs mx-auto">
                    The page you're looking for doesn't exist or has been moved.
                  </p>
                </div>
                <a
                  href="/"
                  className="group flex items-center gap-2 rounded-xl bg-gradient-to-b from-primary to-primary/90 px-6 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:scale-[1.02] hover:shadow-[0_4px_12px_hsl(var(--primary)/0.3)] active:scale-95"
                >
                  Go Home
                </a>
              </div>
            </div>
          }
        />
        </Routes>
        </div>
      </div>
    </ErrorBoundary>
  );
}
