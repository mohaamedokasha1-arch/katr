import Link from 'next/link';
import type { Locale } from '@/types/rail';
import { addDays, formatWeekday, todayCairo, weekdayShort } from '@/lib/time';
import { dayOfWeek } from '@/lib/time';
import { cn } from '@/lib/utils';

export function DateStrip({
  locale,
  fromId,
  toId,
  date,
  extraParams,
  basePath = '/search',
}: {
  locale: Locale;
  fromId: string;
  toId: string;
  date: string;
  extraParams?: Record<string, string>;
  basePath?: string;
}) {
  const ar = locale === 'ar';
  const today = todayCairo();
  const dates = Array.from({ length: 7 }, (_, index) => addDays(date, index - 1));
  const base = new URLSearchParams({ from: fromId, to: toId, ...extraParams });

  return (
    <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
      {dates.map((value) => {
        const active = value === date;
        const relative =
          value === today
            ? ar
              ? 'اليوم'
              : 'Today'
            : value === addDays(today, 1)
              ? ar
                ? 'غدًا'
                : 'Tomorrow'
              : formatWeekday(value, locale);
        const params = new URLSearchParams(base);
        params.set('date', value);
        return (
          <Link
            key={value}
            href={`${basePath}?${params.toString()}`}
            scroll={false}
            className={cn(
              'flex min-w-[72px] shrink-0 flex-col items-center rounded-xl border px-3 py-2 transition',
              active
                ? 'border-brand-600 bg-brand-700 text-white shadow-sm dark:border-brand-400 dark:bg-brand-500'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
            )}
            aria-current={active ? 'date' : undefined}
          >
            <span className={cn('text-[9px] font-semibold', active ? 'text-white/75' : 'text-slate-400')}>
              {relative}
            </span>
            <span className="num mt-0.5 text-sm font-bold">
              {value.slice(8, 10)}/{value.slice(5, 7)}
            </span>
            <span className={cn('mt-0.5 text-[9px]', active ? 'text-white/70' : 'text-slate-400')}>
              {weekdayShort(dayOfWeek(value), locale)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
