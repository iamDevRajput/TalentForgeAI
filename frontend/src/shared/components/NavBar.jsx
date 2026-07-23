/**
 * NavBar.jsx — Top navigation bar
 *
 * Role-aware: shows different labels and links based on user.role.
 * RBAC is enforced server-side — this is UI-only feedback, not a security control.
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { BrandLogo } from '@/shared/components/Brand';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NavBar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'hr': return 'bg-primary text-primary-foreground';
      case 'interviewer': return 'bg-secondary text-secondary-foreground';
      case 'candidate': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <nav className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
        <BrandLogo />
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[12px] font-semibold text-foreground leading-none">{user.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{user.role}</span>
            </div>
            
            <div className={cn("flex size-7 items-center justify-center rounded-[4px] text-[10px] font-bold ring-1 ring-border/50", getRoleColor(user.role))}>
              {getInitials(user.name)}
            </div>
            
            <div className="h-4 w-px bg-border mx-2" />
            
            <button
              onClick={handleLogout}
              className="flex size-7 items-center justify-center rounded-[4px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
