import { cn } from '@/lib/utils';

export function BrandMark({ className }) {
  return (
    <div className={cn("relative flex items-center justify-center shrink-0", className)}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-foreground"
      >
        <path 
          d="M4 6H20V9H13.5V20H10.5V9H4V6Z" 
          fill="currentColor" 
        />
        {/* Subtle AI spark/forge ember */}
        <circle 
          cx="17" 
          cy="16" 
          r="3" 
          fill="hsl(var(--primary))" 
          className="animate-pulse"
          style={{ animationDuration: '3s' }}
        />
      </svg>
    </div>
  );
}

export function BrandLogo({ className, markSize = "size-7", textSize = "text-[15px]" }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn(
        "flex items-center justify-center rounded-[6px] border border-border bg-card shadow-sm",
        markSize
      )}>
        <BrandMark className="size-4" />
      </div>
      <span className={cn("font-bold tracking-tight text-foreground", textSize)}>
        TalentForge<span className="text-primary">AI</span>
      </span>
    </div>
  );
}
