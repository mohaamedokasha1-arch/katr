'use client';

import { useRouter } from 'next/navigation';
import { ArrowDownToLine, ArrowUpFromLine, TrainFront } from 'lucide-react';
import type { Locale } from '@/types/rail';
import { STATIONS } from '@/lib/data/stations';
import { countLabel, tierLabel } from '@/lib/display';
import { cn } from '@/lib/utils';

export function BoardControls({
  locale,
  stationId,
  direction,
}: {
  locale: Locale;
  stationId: string;
  direction: 'departures' | 'arrivals';
}) {
  const router = useRouter();
  const ar = locale === 'ar';

  const grouped = [1, 2, 3]
    .map((tier) => ({
      tier,
      stations: STATIONS.filter((station) => station.searchable && station.tier === tier),
    }))
    .filter((group) => group.stations.length > 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <TrainFront
          className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <select
          value={stationId}
          onChange={(event) => {
            router.push(`/board?station=${event.target.value}&direction=${direction}`);
          }}
          aria-label={ar ? 'اختر المحطة' : 'Choose station'}
          className="field-input h-10 w-64 appearance-none ps-9 pe-8 text-xs font-semibold"
        >
          {grouped.map((group) => (
            <optgroup key={group.tier} label={tierLabel(locale, group.tier as 1 | 2 | 3)}>
              {group.stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {ar ? station.nameAr : station.nameEn}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 dark:border-white/10 dark:bg-white/5">
        {(
          [
            { value: 'departures' as const, ar: 'مغادرة', en: 'Departures', icon: ArrowUpFromLine },
            { value: 'arrivals' as const, ar: 'وصول', en: 'Arrivals', icon: ArrowDownToLine },
          ] as const
        ).map((tab) => {
          const active = direction === tab.value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() =>
                router.push(`/board?station=${stationId}&direction=${tab.value}`)
              }
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold transition',
                active
                  ? 'bg-brand-700 text-white shadow-sm dark:bg-brand-500'
                  : 'text-slate-500 hover:text-ink dark:text-slate-400 dark:hover:text-white',
              )}
              aria-pressed={active}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {ar ? tab.ar : tab.en}
            </button>
          );
        })}
      </div>

      <span className="text-[10px] text-slate-400">
        {ar ? `${countLabel(STATIONS.filter((station) => station.searchable).length, locale, 'stations')} متاحة للبحث` : `${countLabel(STATIONS.filter((station) => station.searchable).length, locale, 'stations')} searchable`}
      </span>
    </div>
  );
}
