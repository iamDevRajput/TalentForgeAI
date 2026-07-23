import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { ShieldOff, ArrowLeft, Sparkles } from 'lucide-react';

const ROLE_DEFAULTS = {
  hr: '/hr/dashboard',
  interviewer: '/interviewer/dashboard',
  candidate: '/candidate/dashboard',
};

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const goHome = () => {
    const path = user ? ROLE_DEFAULTS[user.role] || '/' : '/auth/login';
    navigate(path, { replace: true });
  };

  return (
    <div className="gradient-bg relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4">
      {/* Grid overlay */}
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

        {/* 403 number */}
        <div className="relative">
          <p className="text-[120px] font-black leading-none tracking-tight text-foreground/5 select-none">
            403
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-destructive/10 ring-1 ring-destructive/30 shadow-[0_0_32px_hsl(var(--destructive)/0.15)]">
              <ShieldOff className="size-10 text-destructive" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Access Restricted
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xs">
            You don't have permission to view this page. This area is reserved for a different role.
          </p>
          {user && (
            <p className="text-[13px] text-muted-foreground/60">
              Signed in as <span className="font-semibold text-foreground/70">{user.name}</span>
              {' '}(<span className="capitalize">{user.role}</span>)
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={goHome}
            className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-primary/90 px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:scale-[1.02] hover:shadow-[0_4px_12px_hsl(var(--primary)/0.3)] active:scale-95"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="group flex flex-1 items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/60 px-5 py-3 text-[14px] font-semibold text-muted-foreground backdrop-blur-sm transition-all hover:bg-card hover:text-foreground hover:border-border"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
