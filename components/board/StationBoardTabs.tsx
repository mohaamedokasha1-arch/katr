'use client';

import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import type { BoardRow, Locale } from '@/types/rail';
import { ConfidenceLegend } from '@/components/board/BoardTable';
import { LiveBoardFeed } from '@/components/board/LiveBoardFeed';
import { LiveClock, LiveRefresher } from '@/components/trip/LiveBits';
import { cn } from '@/lib/utils';

export function StationBoardTabs({
  locale,
  stationId,
  stationNameAr,
  stationNameEn,
  departures,
  arrivals,
}: {
  locale: Locale;
  stationId: string;
  stationNameAr: string;
  stationNameEn: string;
  departures: BoardRow[];
  arrivals: BoardRow[];
}) {
  const [tab, setTab] = useState<'departures' | 'arrivals'>('departures');
  const ar = locale === 'ar';
  const rows = tab === 'departures' ? departures : arrivals;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#071a33] text-white shadow-board">
      <div className="pointer-events-none absolute inset-0 opacity-40 hero-grid" aria-hidden />
      <div className="relative flex flex-wrap items-start justify-between gap-3 border-b border-white/10 p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300/70">
            {ar ? 'لوحة المحطة المباشرة' : 'Live station board'}
          </p>
          <h2 className="mt-1 text-base font-bold">
            {ar ? stationNameAr : stationNameEn}
          </h2>
          <div className="mt-1">
            <LiveClock locale={locale} />
          </div>
        </div>
        <LiveRefresher locale={locale} intervalMs={60_000} onDark />
      </div>

      <div className="relative flex border-b border-white/10 px-3 pt-2">
        {(
          [
            { value: 'departures' as const, ar: 'المغادرة', en: 'Departures', icon: ArrowUpFromLine },
            { value: 'arrivals' as const, ar: 'الوصول', en: 'Arrivals', icon: ArrowDownToLine },
          ] as const
        ).map((item) => {
          const active = tab === item.value;
          const Icon = item.icon;
          const count = item.value === 'departures' ? departures.length : arrivals.length;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              aria-pressed={active}
              className={cn(
                'relative flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-[11px] font-semibold transition',
                active ? 'bg-white/[0.07] text-white' : 'text-brand-200/60 hover:text-white',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {ar ? item.ar : item.en}
              <span className="num rounded-full bg-white/10 px-1 text-[9px]">{count}</span>
              {active ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-300" /> : null}
            </button>
          );
        })}
      </div>

      <LiveBoardFeed
        key={tab}
        locale={locale}
        stationId={stationId}
        direction={tab}
        mode={tab === 'departures' ? 'departure' : 'arrival'}
        initialRows={rows}
        dense
      />

      <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
        <ConfidenceLegend locale={locale} />
        <p className="text-[9px] text-brand-300/50">
          {ar ? '4 ساعات قادمة · الأرصفة قد تتغير' : 'Next 4 hours · platforms may change'}
        </p>
      </div>
    </div>
  );
}
