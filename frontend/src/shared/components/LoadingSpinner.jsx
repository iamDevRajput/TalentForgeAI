import { cn } from '@/lib/utils';

const sizeMap = {
  sm: 'size-4 border-2',
  md: 'size-8 border-2',
  lg: 'size-12 border-[3px]',
  xl: 'size-16 border-4',
};

/**
 * LoadingSpinner — Accessible, consistent spinner component.
 *
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {string} className   Additional CSS classes
 * @param {string} label       Accessible label for screen readers
 */
export default function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading...',
}) {
  return (
    <div role="status" aria-label={label} className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'rounded-full border-primary/30 border-t-primary animate-spin',
          sizeMap[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
