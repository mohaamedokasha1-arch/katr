'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { LiveSignalIcon } from '@/components/ui/LiveSignalIcon';
import { cn } from '@/lib/utils';
import { countdownParts, formatClockClient } from '@/lib/client-time';

export function LiveRefresher({
  locale,
  intervalMs = 45_000,
  className,
  onDark = false,
}: {
  locale: 'ar' | 'en';
  intervalMs?: number;
  className?: string;
  onDark?: boolean;
}) {
  const router = useRouter();
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [spinning, setSpinning] = useState(false);
  const ar = locale === 'ar';

  useEffect(() => {
    setUpdatedAt(new Date());
    const timer = window.setInterval(() => {
      setSpinning(true);
      router.refresh();
      setUpdatedAt(new Date());
      window.setTimeout(() => setSpinning(false), 900);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [router, intervalMs]);

  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]',
        onDark ? 'text-brand-200/70' : 'text-slate-500 dark:text-slate-400',
        className,
      )}
      aria-live="off"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-success/60 dark:bg-emerald-400/60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success dark:bg-emerald-400" />
      </span>
      <LiveSignalIcon className="h-3 w-3" />
      <span>
        {ar ? 'تحديث تلقائي' : 'Auto-refresh'}
        <span className="num ms-1 opacity-70">{Math.round(intervalMs / 1000)}s</span>
      </span>
      {updatedAt ? (
        <span className="inline-flex items-center gap-1 opacity-70">
          <RefreshCw className={cn('h-3 w-3', spinning && 'animate-spin')} aria-hidden />
          <span className="num">{formatClockClient(updatedAt.getHours() * 60 + updatedAt.getMinutes())}</span>
        </span>
      ) : null}
    </div>
  );
}

export function LiveClock({ locale, onDark = true }: { locale: 'ar' | 'en'; onDark?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const time = now
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Cairo',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(now)
    : '--:--';

  const date = now
    ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
        timeZone: 'Africa/Cairo',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(now)
    : '';

  return (
    <div className="flex items-baseline gap-2">
      <span
        className={cn(
          'num text-lg font-semibold tabular-nums',
          onDark ? 'text-white' : 'text-ink dark:text-white',
        )}
        suppressHydrationWarning
      >
        {time}
      </span>
      <span
        className={cn('text-[11px]', onDark ? 'text-brand-200/70' : 'text-slate-500 dark:text-slate-400')}
        suppressHydrationWarning
      >
        {date}
      </span>
      <span
        className={cn(
          'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
          onDark ? 'bg-white/10 text-brand-200/80' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400',
        )}
      >
        Cairo
      </span>
    </div>
  );
}

export function DepartureCountdown({
  targetIso,
  locale,
  compact = false,
}: {
  targetIso: string;
  locale: 'ar' | 'en';
  compact?: boolean;
}) {
  const [now, setNow] = useState<number | null>(null);
  const ar = locale === 'ar';

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (now === null) {
    return <span className="num text-sm font-semibold text-slate-400">--:--:--</span>;
  }

  const parts = countdownParts(targetIso, now);
  if (parts.expired) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400">
        {ar ? 'موعد التحرك حان' : 'Departure time reached'}
      </span>
    );
  }

  if (compact) {
    return (
      <span className="num inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
        {parts.hours.toString().padStart(2, '0')}:{parts.minutes.toString().padStart(2, '0')}:
        {parts.seconds.toString().padStart(2, '0')}
      </span>
    );
  }

  const cells = [
    { value: parts.days, labelAr: 'يوم', labelEn: 'days' },
    { value: parts.hours, labelAr: 'ساعة', labelEn: 'hrs' },
    { value: parts.minutes, labelAr: 'دقيقة', labelEn: 'min' },
    { value: parts.seconds, labelAr: 'ثانية', labelEn: 'sec' },
  ];

  return (
    <div className="flex items-center gap-1.5" role="timer" aria-live="off">
      {cells.map((cell) => (
        <div
          key={cell.labelEn}
          className="min-w-[48px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center dark:border-white/10 dark:bg-white/5"
        >
          <span className="num block text-lg font-semibold leading-none text-ink dark:text-white">
            {String(cell.value).padStart(2, '0')}
          </span>
          <span className="mt-0.5 block text-[9px] text-slate-400">{ar ? cell.labelAr : cell.labelEn}</span>
        </div>
      ))}
    </div>
  );
}

export function LastUpdated({
  iso,
  locale,
  className,
}: {
  iso: string;
  locale: 'ar' | 'en';
  className?: string;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  const ar = locale === 'ar';
  const label =
    diffMinutes < 1
      ? ar
        ? 'الآن'
        : 'just now'
      : diffMinutes < 60
        ? ar
          ? `منذ ${diffMinutes} دقيقة`
          : `${diffMinutes} min ago`
        : ar
          ? `منذ ${Math.round(diffMinutes / 60)} ساعة`
          : `${Math.round(diffMinutes / 60)} hr ago`;

  return (
    <span className={cn('text-[11px] text-slate-400', className)} suppressHydrationWarning>
      {ar ? 'آخر تحديث ' : 'Updated '}
      {label}
    </span>
  );
}
