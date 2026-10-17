import { CalendarClock, CircleAlert, ShieldCheck, Users } from 'lucide-react';
import type { Confidence, Locale } from '@/types/rail';
import { confidenceMeta } from '@/lib/display';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const icons = {
  check: ShieldCheck,
  schedule: CalendarClock,
  users: Users,
  alert: CircleAlert,
};

export function ConfidenceBadge({
  locale,
  confidence,
  className,
  showLabel = true,
}: {
  locale: Locale;
  confidence: Confidence;
  className?: string;
  showLabel?: boolean;
}) {
  const meta = confidenceMeta(locale, confidence.level);
  const Icon = icons[meta.icon];
  return (
    <Badge
      tone={meta.tone}
      className={cn('gap-1.5 py-1.5', className)}
      title={`${meta.label}: ${meta.description}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      <span className={showLabel ? undefined : 'sr-only'}>{meta.label}</span>
      {confidence.level === 'community' && confidence.communityConfirmations > 0 ? (
        <span className="num rounded bg-white/50 px-1 text-[9px] dark:bg-black/20">
          {confidence.communityConfirmations}
        </span>
      ) : null}
    </Badge>
  );
}
