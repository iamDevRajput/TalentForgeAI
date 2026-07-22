/**
 * CandidateDashboard.jsx — Candidate role dashboard shell
 *
 * Candidates see a LINEAR status tracker (not kanban — they shouldn't see
 * internal pipeline-management complexity per the PRD UX spec).
 *
 * Phase 1: Welcome shell with account status.
 * Phase 3: Resume upload + parse confidence feedback replaces this shell.
 * Phase 5: Application status tracker becomes active here.
 */

import NavBar from '@/shared/components/NavBar';
import { useAuthStore } from '@/features/auth/authStore';
import { FileText, Send, CheckCircle2, Sparkles, Upload } from 'lucide-react';

const TIMELINE_STEPS = [
  { id: 1, label: 'Create Account', status: 'complete', icon: CheckCircle2 },
  { id: 2, label: 'Upload Resume', status: 'upcoming', phase: 3, icon: Upload },
  { id: 3, label: 'Apply to Jobs', status: 'upcoming', phase: 3, icon: Send },
  { id: 4, label: 'Track Applications', status: 'upcoming', phase: 5, icon: FileText },
];

export default function CandidateDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-dvh bg-background">
      <NavBar />

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="space-y-8 page-enter">
          {/* Welcome */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              Welcome, {user?.name?.split(' ')[0]} 🎉
            </h1>
            <p className="text-sm text-muted-foreground">
              Your candidate portal is ready. Here's what's coming.
            </p>
          </div>

          {/* Account confirmed card */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-500/15">
                <CheckCircle2 className="size-5 text-green-400" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Account confirmed</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Journey timeline */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your hiring journey
            </h2>
            <ol className="relative space-y-6 border-l border-border/50 pl-6">
              {TIMELINE_STEPS.map((step) => (
                <li key={step.id} className="relative">
                  {/* Dot */}
                  <div
                    className={`absolute -left-[1.6rem] flex size-5 items-center justify-center rounded-full border-2 ${
                      step.status === 'complete'
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-border bg-background'
                    }`}
                  >
                    {step.status === 'complete' && (
                      <div className="size-2 rounded-full bg-green-500" />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <step.icon
                      className={`size-4 ${step.status === 'complete' ? 'text-green-400' : 'text-muted-foreground'}`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        step.status === 'complete' ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                    {step.phase && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        Phase {step.phase}
                      </span>
                    )}
                    {step.status === 'complete' && (
                      <span className="ml-auto text-xs text-green-400 font-medium">Done ✓</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* AI feature preview */}
          <div className="glass-card rounded-2xl border border-violet-500/20 p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
                <Sparkles className="size-4 text-violet-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">AI-Powered Resume Matching</h3>
                  <span className="ai-badge">
                    <Sparkles className="size-3" /> AI
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  When you upload your resume, our AI will score your match against each job
                  description and tell you exactly why — not just a bare number.
                  Available in Phase 4.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
