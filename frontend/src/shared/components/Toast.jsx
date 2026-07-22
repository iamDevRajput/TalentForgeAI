/**
 * Toast.jsx — Notification toast system
 *
 * Built on Radix UI Toast (@radix-ui/react-toast).
 * Used for: success/error/info feedback on API responses.
 *
 * Usage (via useToast hook):
 *   const { toast } = useToast()
 *   toast({ title: 'Done', description: 'Application submitted', variant: 'success' })
 */

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Context ──────────────────────────────────────────────────────────────────

const ToastContext = React.createContext(null);

const VARIANT_STYLES = {
  default: 'border-border bg-card text-foreground',
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
  error:   'border-destructive/30 bg-destructive/10 text-destructive',
  info:    'border-primary/30 bg-primary/10 text-primary',
};

const VARIANT_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  default: null,
};

// ── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const toast = React.useCallback(({ title, description, variant = 'default', duration = 4000 }) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, title, description, variant, duration, open: true }]);
  }, []);

  const dismiss = React.useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open: false } : t)));
    // Clean up after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}

        {toasts.map((t) => {
          const Icon = VARIANT_ICONS[t.variant];
          return (
            <ToastPrimitive.Root
              key={t.id}
              open={t.open}
              onOpenChange={(open) => !open && dismiss(t.id)}
              duration={t.duration}
              className={cn(
                'group pointer-events-auto relative flex w-full max-w-sm items-start gap-3',
                'rounded-xl border p-4 shadow-lg',
                'data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full',
                'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full',
                'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
                VARIANT_STYLES[t.variant],
              )}
            >
              {Icon && <Icon className="mt-0.5 size-4 shrink-0" />}
              <div className="flex-1 space-y-1">
                {t.title && (
                  <ToastPrimitive.Title className="text-sm font-semibold leading-tight">
                    {t.title}
                  </ToastPrimitive.Title>
                )}
                {t.description && (
                  <ToastPrimitive.Description className="text-xs opacity-80">
                    {t.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close
                className="opacity-60 transition-opacity hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="size-3.5" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}

        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
