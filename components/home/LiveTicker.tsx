import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ArrowRight, Ban, Clock } from 'lucide-react';
import type { Locale } from '@/types/rail';
import type { HomeLiveData } from '@/lib/home';
import { statusForTicker, tickerClock } from '@/lib/home';
import { cn } from '@/lib/utils';

export function LiveTicker({ locale, data }: { locale: Locale; data: HomeLiveData }) {
  const ar = locale === 'ar';
  const rows = data.ticker.length > 0 ? data.ticker : [];

  if (rows.length === 0) {
    return (
      <div className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-night-800">
        <div className="page-shell flex h-11 items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-success/60" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          {ar ? 'كل الرحلات المنشورة اليوم في الموعد حتى الآن.' : 'All published services are on time so far today.'}
        </div>
      </div>
    );
  }

  const items = [...rows, ...rows];

  return (
    <div className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-night-800">
      <div className="page-shell flex h-11 items-center gap-3 overflow-hidden">
        <span className="z-10 flex shrink-0 items-center gap-1.5 bg-white pe-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-night-800 dark:text-slate-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-signal/60" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-signal" />
          </span>
          {ar ? 'حركة اليوم' : 'Live now'}
        </span>

        <div className="ticker-mask relative flex-1 overflow-hidden">
          <div className="flex w-max animate-ticker gap-5 whitespace-nowrap hover:[animation-play-state:paused]">
            {items.map((row, index) => {
              const cancelled = row.status.kind === 'cancelled';
              const delayed = row.status.delayMinutes > 0;
              return (
                <Link
                  key={`${row.tripId}-${index}`}
                  href={`/trip/${row.tripId}`}
                  aria-hidden={index >= rows.length}
                  tabIndex={index >= rows.length ? -1 : undefined}
                  className={cn(
                    'inline-flex items-center gap-2 text-[11px] transition hover:text-brand-700 dark:hover:text-brand-200',
                    cancelled
                      ? 'text-danger dark:text-red-300'
                      : delayed
                        ? 'text-signal-ink dark:text-orange-300'
                        : 'text-slate-500 dark:text-slate-400',
                  )}
                >
                  {cancelled ? (
                    <Ban className="h-3 w-3" aria-hidden />
                  ) : delayed ? (
                    <Clock className="h-3 w-3" aria-hidden />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-brand-400" aria-hidden />
                  )}
                  <span className="num font-bold">{row.serviceNumber}</span>
                  <span>{ar ? row.destinationAr : row.destinationEn}</span>
                  <span className="num opacity-70">{tickerClock(row.status)}</span>
                  <span className="font-bold">{statusForTicker(row.status, locale)}</span>
                  <span className="h-3 w-px bg-slate-200 dark:bg-white/10" aria-hidden />
                </Link>
              );
            })}
          </div>
        </div>

        <Link
          href="/status"
          className="z-10 flex shrink-0 items-center gap-1 bg-white ps-2 text-[10px] font-semibold text-brand-700 dark:bg-night-800 dark:text-brand-300"
        >
          {ar ? 'الكل' : 'All'}
          {ar ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
        </Link>
      </div>
    </div>
  );
}
