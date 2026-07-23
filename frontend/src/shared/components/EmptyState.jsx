import { cn } from '@/lib/utils';

export default function EmptyState({ icon: Icon, title, description, action, actionLabel, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-[6px] border border-dashed border-border bg-card/50 p-12 text-center animate-in fade-in duration-300", className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/50 mb-4">
        {Icon && <Icon className="size-6 text-muted-foreground" />}
      </div>
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="mt-2 mb-6 text-[13px] text-muted-foreground max-w-sm">
        {description}
      </p>
      {action && actionLabel && (
        <button 
          onClick={action}
          className="flex h-8 items-center justify-center rounded-md bg-foreground px-4 text-[12px] font-medium text-background transition-transform active:scale-95 hover:bg-foreground/90 shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
