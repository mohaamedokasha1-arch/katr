import Link from 'next/link';
import { ArrowLeft, ArrowRight, Ban, Clock } from 'lucide-react';
import type { BoardRow, Confidence, Locale } from '@/types/rail';
import { formatClock } from '@/lib/time';
import { confidenceMeta } from '@/lib/display';
import { statusMeta } from '@/lib/display';
import { cn } from '@/lib/utils';

function statusColor(kind: BoardRow['status']['kind']): string {
  switch (kind) {
    case 'cancelled':
      return 'text-red-400';
    case 'delayed':
      return 'text-orange-300';
    case 'boarding':
      return 'text-emerald-300';
    case 'in_transit':
      return 'text-sky-300';
    default:
      return 'text-slate-300';
  }
}

function BoardConfidence({ confidence }: { confidence: Confidence }) {
  const tone =
    confidence.level === 'official'
      ? 'bg-emerald-400'
      : confidence.level === 'community'
        ? 'bg-orange-400'
        : confidence.level === 'stale'
          ? 'bg-slate-500'
          : 'bg-sky-400';
  return (
    <span className="inline-flex items-center gap-1" title={confidence.level}>
      <span className={cn('h-1.5 w-1.5 rounded-full', tone)} aria-hidden />
    </span>
  );
}

export function BoardTable({
  locale,
  rows,
  mode,
  dense = false,
  dark = true,
}: {
  locale: Locale;
  rows: BoardRow[];
  mode: 'departure' | 'arrival';
  dense?: boolean;
  dark?: boolean;
}) {
  const ar = locale === 'ar';

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center px-4 py-10 text-center',
          dark ? 'text-slate-400' : 'text-slate-500',
        )}
      >
        <Clock className="mb-2 h-5 w-5 opacity-50" aria-hidden />
        <p className="text-sm font-medium">
          {ar ? 'لا توجد رحلات في هذه النافذة الزمنية.' : 'No trips in this time window.'}
        </p>
        <p className="mt-1 text-[11px] opacity-70">
          {ar
            ? 'اللوحة تعرض 45 دقيقة سابقة و4 ساعات قادمة.'
            : 'The board shows 45 minutes back and 4 hours ahead.'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('w-full', dark ? 'text-slate-200' : 'text-ink dark:text-slate-100')}>
      <table className="w-full border-collapse text-start">
        <caption className="sr-only">
          {ar ? 'لوحة الرحلات المباشرة' : 'Live board rows'}
        </caption>
        <thead>
          <tr
            className={cn(
              'text-[9px] font-bold uppercase tracking-[0.14em]',
              dark ? 'text-slate-500' : 'text-slate-400',
            )}
          >
            <th className="px-3 py-2 text-start font-bold">{ar ? 'الموعد' : 'Time'}</th>
            <th className="px-2 py-2 text-start font-bold">{ar ? 'القطار' : 'Train'}</th>
            <th className="px-2 py-2 text-start font-bold">
              {mode === 'departure' ? (ar ? 'الوجهة' : 'Destination') : ar ? 'قادم من' : 'From'}
            </th>
            <th className="hidden px-2 py-2 text-start font-bold sm:table-cell">
              {ar ? 'الحالة' : 'Status'}
            </th>
            <th className="hidden px-2 py-2 text-end font-bold md:table-cell">
              {ar ? 'الرصيف' : 'Platform'}
            </th>
            <th className="px-3 py-2 text-end font-bold">
              <span className="sr-only">{ar ? 'التفاصيل' : 'Details'}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const cancelled = row.status.kind === 'cancelled';
            const delayed = row.status.delayMinutes > 0;
            const meta = statusMeta(locale, row.status.kind, row.status.delayMinutes);
            const expected = formatClock(row.expectedMinutes % 1440);
            return (
              <tr
                key={`${row.tripId}-${row.kind}`}
                className={cn(
                  'group border-t transition-colors',
                  dark
                    ? 'border-white/[0.06] hover:bg-white/[0.04]'
                    : 'border-slate-100 hover:bg-brand-50/40 dark:border-white/5',
                  dense ? 'text-[11px]' : 'text-xs',
                )}
              >
                <td className={cn('px-3', dense ? 'py-2' : 'py-2.5')}>
                  <span
                    className={cn(
                      'num font-semibold',
                      delayed ? 'text-orange-300' : cancelled ? 'text-red-400 line-through' : dark ? 'text-white' : 'text-ink dark:text-white',
                    )}
                  >
                    {expected}
                    {row.dayOffset > 0 ? (
                      <span className="num ms-1 align-top text-[8px] font-bold text-sky-300/80" title={ar ? 'اليوم التالي' : 'Next day'}>
                        +{row.dayOffset}
                      </span>
                    ) : null}
                  </span>
                  {delayed ? (
                    <span className="num ms-1 block text-[9px] font-medium text-slate-500 line-through">
                      {formatClock(row.scheduledMinutes % 1440)}
                    </span>
                  ) : null}
                </td>
                <td className={cn('px-2', dense ? 'py-2' : 'py-2.5')}>
                  <Link
                    href={`/trip/${row.tripId}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-brand-300 hover:text-brand-200"
                  >
                    <span className="num">{row.serviceNumber}</span>
                    <BoardConfidence confidence={row.confidence} />
                  </Link>
                  {row.titleAr && !dense ? (
                    <span className={cn('block text-[9px]', dark ? 'text-slate-500' : 'text-slate-400')}>
                      {ar ? row.titleAr : row.titleEn}
                    </span>
                  ) : null}
                </td>
                <td className={cn('px-2 font-medium', dense ? 'py-2' : 'py-2.5')}>
                  <span className={dark ? 'text-slate-200' : 'text-slate-700 dark:text-slate-200'}>
                    {ar ? row.counterpart.nameAr : row.counterpart.nameEn}
                  </span>
                </td>
                <td className={cn('hidden px-2 sm:table-cell', dense ? 'py-2' : 'py-2.5')}>
                  <span className={cn('inline-flex items-center gap-1 font-semibold', statusColor(row.status.kind))}>
                    {cancelled ? <Ban className="h-3 w-3" aria-hidden /> : null}
                    {delayed ? <Clock className="h-3 w-3" aria-hidden /> : null}
                    {meta.label}
                  </span>
                </td>
                <td className={cn('hidden px-2 text-end md:table-cell', dense ? 'py-2' : 'py-2.5')}>
                  {row.platform ? (
                    <span className="num inline-flex h-5 min-w-5 items-center justify-center rounded bg-white/10 px-1 text-[10px] font-bold text-white">
                      {row.platform}
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className={cn('px-3 text-end', dense ? 'py-2' : 'py-2.5')}>
                  <Link
                    href={`/trip/${row.tripId}`}
                    aria-label={ar ? `تفاصيل القطار ${row.serviceNumber}` : `Train ${row.serviceNumber} details`}
                    className="inline-flex text-slate-500 transition group-hover:text-brand-300"
                  >
                    {ar ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ConfidenceLegend({ locale, dark = true }: { locale: Locale; dark?: boolean }) {
  const ar = locale === 'ar';
  const items: Array<{ level: Confidence['level']; color: string }> = [
    { level: 'official', color: 'bg-emerald-400' },
    { level: 'standard', color: 'bg-sky-400' },
    { level: 'community', color: 'bg-orange-400' },
    { level: 'stale', color: 'bg-slate-500' },
  ];
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px]', dark ? 'text-slate-500' : 'text-slate-400')}>
      <span className="font-semibold uppercase tracking-wider">{ar ? 'الثقة' : 'Confidence'}</span>
      {items.map((item) => (
        <span key={item.level} className="inline-flex items-center gap-1">
          <span className={cn('h-1.5 w-1.5 rounded-full', item.color)} aria-hidden />
          {confidenceMeta(locale, item.level).short}
        </span>
      ))}
    </div>
  );
}
