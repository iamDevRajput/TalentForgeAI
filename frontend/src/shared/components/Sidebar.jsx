/**
 * Sidebar.jsx — Collapsible sidebar for HR and Interviewer dashboards
 *
 * Phase 1: Shows navigation shell with placeholder links.
 * Phase 2+: Each module adds its own nav item to the relevant role's sidebar config.
 *
 * Collapsed state persists to localStorage.
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/authStore';

const HR_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/hr/dashboard', phase: 1 },
  { label: 'Jobs', icon: Briefcase, path: '/hr/jobs', phase: 2 },
  { label: 'Candidates', icon: Users, path: '/hr/candidates', phase: 3 },
  { label: 'Pipeline', icon: ClipboardList, path: '/hr/pipeline', phase: 5 },
  { label: 'Interviews', icon: Calendar, path: '/hr/interviews', phase: 7 },
  { label: 'Analytics', icon: BarChart3, path: '/hr/analytics', phase: 11 },
];

const INTERVIEWER_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/interviewer/dashboard', phase: 1 },
  { label: 'My Interviews', icon: Calendar, path: '/interviewer/interviews', phase: 8 },
  { label: 'Feedback', icon: MessageSquare, path: '/interviewer/feedback', phase: 9 },
];

const NAV_BY_ROLE = { hr: HR_NAV, interviewer: INTERVIEWER_NAV };

function NavItem({ item, collapsed }) {
  const { pathname } = useLocation();
  const isActive = pathname === item.path;

  return (
    <Link
      to={item.path}
      aria-label={item.label}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
        isActive
          ? 'bg-primary/15 text-primary shadow-sm'
          : 'text-sidebar-muted hover:bg-secondary/60 hover:text-foreground',
        collapsed && 'justify-center px-2',
      )}
    >
      <item.icon
        className={cn('size-4 shrink-0 transition-colors', isActive ? 'text-primary' : '')}
      />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {!collapsed && item.phase > 1 && (
        <span className="ml-auto rounded text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground font-mono">
          Ph{item.phase}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true',
  );

  const navItems = NAV_BY_ROLE[user?.role] || [];

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 ease-in-out',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      {/* Nav items */}
      <nav className="flex-1 space-y-1 p-2 pt-4">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2">
        <button
          id="sidebar-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground',
            'transition-colors hover:bg-secondary/60 hover:text-foreground',
            collapsed && 'justify-center px-2',
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <>
              <ChevronLeft className="size-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
