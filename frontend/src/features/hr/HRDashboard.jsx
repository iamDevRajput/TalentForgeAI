/**
 * HRDashboard.jsx — HR role dashboard shell
 *
 * Phase 1: Shows a proper empty state with upcoming phase roadmap.
 * Phase 2: Job management cards replace this shell.
 *
 * Layout: NavBar (top) + Sidebar (left) + main content area
 */

import NavBar from '@/shared/components/NavBar';
import Sidebar from '@/shared/components/Sidebar';
import { useAuthStore } from '@/features/auth/authStore';
import {
  Briefcase,
  Users,
  Calendar,
  BarChart3,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const UPCOMING_PHASES = [
  {
    phase: 2,
    title: 'Job Management',
    description: 'Create and manage job postings with status lifecycle.',
    icon: Briefcase,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  {
    phase: 3,
    title: 'Candidate Portal & Resumes',
    description: 'Resume upload, Cloudinary storage, candidate profiles.',
    icon: Users,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    phase: 5,
    title: 'Pipeline Management',
    description: 'Kanban-style candidate stage tracking with audit logs.',
    icon: Calendar,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    phase: 11,
    title: 'Analytics Dashboard',
    description: 'Funnel metrics, time-to-hire, source effectiveness.',
    icon: BarChart3,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
];

export default function HRDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-5xl space-y-8 page-enter">
            {/* Welcome header */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">HR Dashboard</p>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className="text-sm text-muted-foreground">
                Phase 1 complete — authentication and RBAC are live.
              </p>
            </div>

            {/* Status card */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                  <Sparkles className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">System Operational</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    JWT authentication, RBAC middleware, and MongoDB are connected.
                    The HR, Interviewer, and Candidate role boundaries are enforced at
                    both route and query level.
                  </p>
                </div>
                <span className="ai-badge ml-auto shrink-0">
                  <Sparkles className="size-3" /> Live
                </span>
              </div>
            </div>

            {/* Upcoming phases */}
            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Coming in next phases
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {UPCOMING_PHASES.map((item) => (
                  <div
                    key={item.phase}
                    className={`glass-card rounded-xl border p-5 transition-all hover:shadow-md ${item.border}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                        <item.icon className={`size-4 ${item.color}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                            Phase {item.phase}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground/40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
