/**
 * InterviewerDashboard.jsx — Interviewer role dashboard shell
 *
 * RBAC note: Interviewers see ONLY their assigned candidates and interviews.
 * No pipeline visibility. This is enforced server-side — the UI reflects that.
 *
 * Phase 1: Shell with "what's coming" state.
 * Phase 8: AI question generation + interview list replace this shell.
 */

import NavBar from '@/shared/components/NavBar';
import Sidebar from '@/shared/components/Sidebar';
import { useAuthStore } from '@/features/auth/authStore';
import { Calendar, MessageSquare, ShieldCheck } from 'lucide-react';

export default function InterviewerDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <NavBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-3xl space-y-8 page-enter">
            {/* Welcome */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Interviewer Dashboard</p>
              <h1 className="text-2xl font-bold text-foreground">
                Hello, {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className="text-sm text-muted-foreground">
                Your focused workspace for conducting interviews and submitting feedback.
              </p>
            </div>

            {/* RBAC notice */}
            <div className="glass-card flex items-start gap-4 rounded-2xl p-6">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
                <ShieldCheck className="size-5 text-blue-400" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Access scope: Assigned interviews only</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You can only see candidates and interviews that have been assigned to you by
                  the HR team. This is enforced at the server level — not just the UI.
                </p>
              </div>
            </div>

            {/* Phase previews */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="glass-card rounded-xl border border-blue-500/20 p-5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
                  <Calendar className="size-4 text-blue-400" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">My Interviews</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  View your scheduled interviews, see AI-suggested questions, and join calls.
                </p>
                <span className="mt-3 inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  Phase 8
                </span>
              </div>

              <div className="glass-card rounded-xl border border-purple-500/20 p-5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10">
                  <MessageSquare className="size-4 text-purple-400" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">Submit Feedback</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Structured feedback forms — ratings + notes — for each candidate you've interviewed.
                </p>
                <span className="mt-3 inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  Phase 9
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
