'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MapPin } from 'lucide-react';
import type { TripResult } from '@/types/rail';
import { formatClock, minutesDayOffset } from '@/lib/time';
import { countLabel } from '@/lib/display';
import { cn } from '@/lib/utils';

type Stop = TripResult['stops'][number];

export function Timeline({
  stops,
  locale,
  color,
  distanceLabel = true,
}: {
  stops: Stop[];
  locale: 'ar' | 'en';
  color: string;
  distanceLabel?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const ar = locale === 'ar';
  const lastIndex = stops.length - 1;

  const { visible, hiddenCount } = useMemo(() => {
    if (expanded || stops.length <= 8) return { visible: stops, hiddenCount: 0 };
    const keep = new Set<number>([0, lastIndex]);
    stops.forEach((stop, index) => {
      if (stop.isBoardPoint || stop.isAlightPoint) {
        keep.add(index);
        if (index > 0) keep.add(index - 1);
        if (index < lastIndex) keep.add(index + 1);
      }
    });
    const sorted = Array.from(keep).sort((a, b) => a - b);
    let hidden = 0;
    for (let i = 0; i < stops.length; i += 1) if (!keep.has(i)) hidden += 1;
    return { visible: sorted.map((index) => stops[index]), hiddenCount: hidden };
  }, [expanded, stops, lastIndex]);

  let previousIndex = -1;

  return (
    <div>
      <ol className="relative">
        <span
          className="absolute bottom-4 start-[7px] top-4 w-px border-s-2 border-dashed opacity-40"
          style={{ borderColor: color }}
          aria-hidden
        />
        {visible.map((stop) => {
          const index = stops.indexOf(stop);
          const gap = previousIndex >= 0 ? index - previousIndex - 1 : 0;
          previousIndex = index;
          const isFirst = index === 0;
          const isLast = index === lastIndex;
          const arrivalOffset = stop.arrivalMinutes === null ? 0 : minutesDayOffset(stop.arrivalMinutes);
          const departureOffset = minutesDayOffset(stop.departureMinutes);

          return (
            <li key={stop.station.id} className="relative pb-6 ps-7 last:pb-0">
              {gap > 0 ? (
                <div className="mb-3 ms-1 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="h-px w-4 bg-slate-300 dark:bg-white/20" aria-hidden />
                  {countLabel(gap, locale, 'stations')} {ar ? 'بينهما' : 'in between'}
                </div>
              ) : null}

              <span
                className={cn(
                  'absolute start-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white dark:bg-night-800',
                  stop.isBoardPoint
                    ? 'border-success ring-4 ring-success/15'
                    : stop.isAlightPoint
                      ? 'border-signal ring-4 ring-signal/15'
                      : 'border-slate-300 dark:border-slate-600',
                )}
                aria-hidden
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    stop.isBoardPoint
                      ? 'bg-success'
                      : stop.isAlightPoint
                        ? 'bg-signal'
                        : 'bg-slate-300 dark:bg-slate-600',
                  )}
                />
              </span>

              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/station/${stop.station.id}`}
                      className={cn(
                        'text-sm font-semibold transition hover:text-brand-700 dark:hover:text-brand-300',
                        stop.isBoardPoint || stop.isAlightPoint
                          ? 'text-ink dark:text-white'
                          : 'text-slate-600 dark:text-slate-300',
                      )}
                    >
                      {ar ? stop.station.nameAr : stop.station.nameEn}
                    </Link>
                    {stop.isBoardPoint ? (
                      <span className="rounded bg-success-soft px-1.5 py-0.5 text-[9px] font-bold text-success-ink dark:bg-success/10 dark:text-emerald-300">
                        {ar ? 'اركب هنا' : 'Board here'}
                      </span>
                    ) : null}
                    {stop.isAlightPoint ? (
                      <span className="rounded bg-signal-soft px-1.5 py-0.5 text-[9px] font-bold text-signal-ink dark:bg-signal/10 dark:text-orange-300">
                        {ar ? 'انزل هنا' : 'Alight here'}
                      </span>
                    ) : null}
                    {isFirst ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                        {ar ? 'بداية الخط' : 'Origin'}
                      </span>
                    ) : null}
                    {isLast ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                        {ar ? 'نهاية الخط' : 'Terminus'}
                      </span>
                    ) : null}
                  </div>
                  {distanceLabel ? (
                    <p className="num mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                      <MapPin className="h-2.5 w-2.5" aria-hidden />
                      {stop.distanceKm} km
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3 text-end">
                  {stop.arrivalMinutes !== null ? (
                    <div>
                      <p className="num text-sm font-semibold text-ink dark:text-white">
                        {formatClock(stop.arrivalMinutes)}
                        {arrivalOffset > 0 ? (
                          <span className="num ms-1 rounded bg-slate-100 px-1 text-[8px] font-bold text-slate-500 dark:bg-white/10">
                            +{arrivalOffset}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[9px] text-slate-400">{ar ? 'وصول' : 'arrival'}</p>
                    </div>
                  ) : null}
                  {!isLast ? (
                    <div>
                      <p className="num text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {formatClock(stop.departureMinutes)}
                        {departureOffset > arrivalOffset ? (
                          <span className="num ms-1 rounded bg-slate-100 px-1 text-[8px] font-bold text-slate-500 dark:bg-white/10">
                            +{departureOffset}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[9px] text-slate-400">{ar ? 'تحرك' : 'departure'}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {hiddenCount > 0 || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} aria-hidden />
          {expanded
            ? ar
              ? 'اطوِ المحطات'
              : 'Collapse stops'
            : ar
              ? `عرض كل المحطات (${stops.length})`
              : `Show all ${stops.length} stops`}
        </button>
      ) : null}

      <p className="mt-4 text-[10px] leading-5 text-slate-400">
        {ar
          ? 'كل الأوقات بتوقيت القاهرة المحلي. المحطات الصغيرة لا تظهر كوجهة بحث لكنها مدرجة ضمن مسار الرحلة.'
          : 'All times are Cairo local time. Minor request stops are listed in the route but cannot be used as search endpoints.'}
      </p>
    </div>
  );
}
