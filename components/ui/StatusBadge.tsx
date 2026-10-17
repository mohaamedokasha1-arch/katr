import type { Locale, LiveStatusKind } from '@/types/rail';
import { statusMeta } from '@/lib/display';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export function StatusBadge({
  locale,
  kind,
  delayMinutes = 0,
  className,
  withDescription = true,
}: {
  locale: Locale;
  kind: LiveStatusKind;
  delayMinutes?: number;
  className?: string;
  withDescription?: boolean;
}) {
  const meta = statusMeta(locale, kind, delayMinutes);
  return (
    <Badge
      tone={meta.tone}
      title={withDescription ? meta.description : undefined}
      className={cn('whitespace-nowrap py-1.5', className)}
    >
      <span className="relative flex h-1.5 w-1.5">
        {meta.pulse ? (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-70 motion-safe:animate-pulse-soft',
              meta.tone === 'success' && 'bg-success dark:bg-emerald-400',
              meta.tone === 'brand' && 'bg-brand-500 dark:bg-brand-300',
              meta.tone === 'signal' && 'bg-signal dark:bg-orange-400',
              meta.tone === 'danger' && 'bg-danger dark:bg-red-400',
              meta.tone === 'neutral' && 'bg-slate-400',
            )}
          />
        ) : null}
        <span
          className={cn(
            'relative inline-flex h-1.5 w-1.5 rounded-full',
            meta.tone === 'success' && 'bg-success dark:bg-emerald-400',
            meta.tone === 'brand' && 'bg-brand-500 dark:bg-brand-300',
            meta.tone === 'signal' && 'bg-signal dark:bg-orange-400',
            meta.tone === 'danger' && 'bg-danger dark:bg-red-400',
            meta.tone === 'neutral' && 'bg-slate-400 dark:bg-slate-500',
          )}
        />
      </span>
      {meta.label}
    </Badge>
  );
}
