/**
 * Sidebar.jsx — Collapsible sidebar for HR and Interviewer dashboards
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
  { label: 'Dashboard', icon: LayoutDashboard, path: '/hr/dashboard' },
  { label: 'Jobs', icon: Briefcase, path: '/hr/jobs' },
  { label: 'Candidates', icon: Users, path: '/hr/candidates' },
  { label: 'Pipeline', icon: ClipboardList, path: '/hr/pipeline' },
  { label: 'Interviews', icon: Calendar, path: '/hr/interviews' },
  { label: 'Analytics', icon: BarChart3, path: '/hr/analytics' },
];

const INTERVIEWER_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/interviewer/dashboard' },
  { label: 'My Interviews', icon: Calendar, path: '/interviewer/interviews' },
  { label: 'Feedback', icon: MessageSquare, path: '/interviewer/feedback' },
];

const NAV_BY_ROLE = { hr: HR_NAV, interviewer: INTERVIEWER_NAV };

function NavItem({ item, collapsed }) {
  const { pathname } = useLocation();
  const isActive = pathname === item.path || pathname.startsWith(item.path + '/');

  return (
    <Link
      to={item.path}
      aria-label={item.label}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-[4px] px-3 py-2 text-[13px] font-medium transition-colors duration-150',
        'focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0',
        isActive
          ? 'bg-secondary/40 text-foreground'
          : 'text-muted-foreground hover:bg-secondary/20 hover:text-foreground',
        collapsed && 'justify-center px-2',
      )}
    >
      <item.icon
        className={cn('size-4 shrink-0 transition-colors', isActive ? 'text-primary' : 'group-hover:text-foreground')}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
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
      <nav className="flex-1 space-y-0.5 p-2 pt-4">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          id="sidebar-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex w-full items-center gap-2 rounded-[4px] px-3 py-2 text-[13px] text-muted-foreground',
            'transition-colors hover:bg-secondary/20 hover:text-foreground',
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
