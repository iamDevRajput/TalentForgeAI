/**
 * NavBar.jsx — Top navigation bar
 *
 * Role-aware: shows different labels and links based on user.role.
 * RBAC is enforced server-side — this is UI-only feedback, not a security control.
 */

import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/features/auth/authStore';
import { authApi } from '@/features/auth/authApi';
import { cn } from '@/lib/utils';

const ROLE_LABELS = {
  hr: { label: 'HR', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30', dashboardPath: '/hr/dashboard' },
  interviewer: { label: 'Interviewer', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', dashboardPath: '/interviewer/dashboard' },
  candidate: { label: 'Candidate', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dashboardPath: '/candidate/dashboard' },
};

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function NavBar() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();
  const roleInfo = user ? ROLE_LABELS[user.role] : null;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort logout — clear local state regardless
    } finally {
      clearUser();
      navigate('/auth/login', { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          to={roleInfo?.dashboardPath || '/auth/login'}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-[0_0_16px_hsl(var(--primary)/0.3)] ring-1 ring-white/10">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-foreground">
            TalentForge<span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Right side */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* Role badge */}
            <span
              className={cn(
                'hidden rounded-full border px-2.5 py-0.5 text-xs font-semibold sm:inline-flex',
                roleInfo?.bg,
                roleInfo?.color,
              )}
            >
              {roleInfo?.label}
            </span>

            {/* User info + avatar */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:block text-right">
                <p className="text-[13px] font-semibold text-foreground leading-none">{user.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{user.email}</p>
              </div>

              {/* Avatar initials */}
              <div className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                roleInfo?.bg, roleInfo?.color
              )}>
                {getInitials(user.name)}
              </div>

              <button
                id="navbar-logout-btn"
                onClick={handleLogout}
                aria-label="Logout"
                className="flex items-center gap-1.5 rounded-lg border border-border/40 px-3 py-1.5 text-[13px] text-muted-foreground transition-all hover:bg-secondary hover:text-foreground hover:border-border"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
