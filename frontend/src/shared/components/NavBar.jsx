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
  hr: { label: 'HR Dashboard', color: 'text-violet-400', dashboardPath: '/hr/dashboard' },
  interviewer: { label: 'Interviewer', color: 'text-blue-400', dashboardPath: '/interviewer/dashboard' },
  candidate: { label: 'Candidate Portal', color: 'text-emerald-400', dashboardPath: '/candidate/dashboard' },
};

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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          to={roleInfo?.dashboardPath || '/auth/login'}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight text-foreground">
            TalentForgeAI <span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Right side */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* Role badge */}
            <span
              className={cn(
                'hidden rounded-full border border-current/20 bg-current/10 px-2.5 py-0.5 text-xs font-medium sm:inline-flex',
                roleInfo?.color,
              )}
            >
              {roleInfo?.label}
            </span>

            {/* User menu */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground leading-none">{user.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
              </div>

              <button
                id="navbar-logout-btn"
                onClick={handleLogout}
                aria-label="Logout"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
