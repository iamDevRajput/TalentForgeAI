import { useAuthStore } from '@/features/auth/authStore';
import { cn } from '@/lib/utils';

export default function DashboardHero({ title, subtitle, action, actionLabel }) {
  const { user } = useAuthStore();
  
  const dateStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="relative mb-8 pb-6 border-b border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
      {/* Signature: AI Core Glow */}
      <div className="ai-core-glow" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          {/* Top Status Bar */}
          <div className="flex items-center gap-3 text-[12px] font-medium text-muted-foreground mb-3">
            <span className="flex items-center gap-1.5 text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Talent AI Active
            </span>
            <span className="text-border">•</span>
            <span>{dateStr}</span>
            <span className="text-border">•</span>
            <span className="capitalize">{user?.role || 'Guest'}</span>
          </div>
          
          {/* Main Greeting */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {title || `${getGreeting()}, ${user?.name?.split(' ')[0] || 'User'} 👋`}
          </h1>
          
          {/* Subtitle / Tagline */}
          {subtitle && (
            <p className="mt-1.5 text-[14px] text-muted-foreground max-w-xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Contextual Action */}
        {action && actionLabel && (
          <button 
            onClick={action}
            className="flex h-9 shrink-0 items-center justify-center rounded-md bg-foreground px-4 text-[13px] font-medium text-background transition-transform active:scale-95 hover:bg-foreground/90 shadow-sm"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
