'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, MapPin, Search, TrainFront } from 'lucide-react';
import type { Locale } from '@/types/rail';
import { STATION_OPTIONS } from '@/lib/data/stations';
import { LINE_MAP } from '@/lib/data/lines';
import { searchStationOptions } from '@/lib/stations-search';
import { tierLabel } from '@/lib/display';
import { cn } from '@/lib/utils';

export function StationDirectory({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const [query, setQuery] = useState('');
  const [lineId, setLineId] = useState<string>('');
  const [governorate, setGovernorate] = useState<string>('');

  const governorates = useMemo(
    () =>
      Array.from(
        new Set(
          STATION_OPTIONS.filter((station) => station.searchable).map((station) =>
            ar ? station.governorateAr : station.governorateEn,
          ),
        ),
      ).sort((a, b) => a.localeCompare(b, ar ? 'ar' : 'en')),
    [ar],
  );

  const results = useMemo(() => {
    const ranked = searchStationOptions(query, { limit: 200 });
    return ranked.filter((station) => {
      if (lineId && !station.lineIds.includes(lineId)) return false;
      if (governorate) {
        const value = ar ? station.governorateAr : station.governorateEn;
        if (value !== governorate) return false;
      }
      return true;
    });
  }, [query, lineId, governorate, ar]);

  const groups = [
    { tier: 1, stations: results.filter((station) => station.tier === 1) },
    { tier: 2, stations: results.filter((station) => station.tier === 2) },
    { tier: 3, stations: results.filter((station) => station.tier === 3) },
  ].filter((group) => group.stations.length > 0);

  return (
    <div>
      <div className="panel p-3.5">
        <div className="grid gap-2 sm:grid-cols-[1fr_190px_190px]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ar ? 'ابحث باسم المحطة أو المدينة أو الكود' : 'Search a station, city or code'}
              className="field-input h-10 ps-9 text-xs"
              aria-label={ar ? 'بحث المحطات' : 'Search stations'}
            />
          </div>
          <select
            value={governorate}
            onChange={(event) => setGovernorate(event.target.value)}
            className="field-input h-10 text-xs"
            aria-label={ar ? 'المحافظة' : 'Governorate'}
          >
            <option value="">{ar ? 'كل المحافظات' : 'All governorates'}</option>
            {governorates.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={lineId}
            onChange={(event) => setLineId(event.target.value)}
            className="field-input h-10 text-xs"
            aria-label={ar ? 'الخط' : 'Line'}
          >
            <option value="">{ar ? 'كل الخطوط' : 'All lines'}</option>
            {Object.values(LINE_MAP).map((line) => (
              <option key={line.id} value={line.id}>
                {ar ? line.shortAr : line.shortEn}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-slate-400">
            {ar ? `${results.length} محطة مطابقة` : `${results.length} matching stations`}
          </span>
          {query || lineId || governorate ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setLineId('');
                setGovernorate('');
              }}
              className="text-[10px] font-semibold text-brand-700 dark:text-brand-300"
            >
              {ar ? 'مسح الفلاتر' : 'Clear filters'}
            </button>
          ) : null}
          <div className="ms-auto hidden gap-1 sm:flex">
            {['cairo-ramses', 'alexandria-misr', 'tanta', 'asyut'].map((id) => {
              const station = STATION_OPTIONS.find((item) => item.id === id);
              if (!station) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setQuery(ar ? station.nameAr : station.nameEn);
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:text-slate-400"
                >
                  {ar ? station.nameAr : station.nameEn}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="panel mt-4 p-10 text-center">
          <MapPin className="mx-auto h-6 w-6 text-slate-300" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-ink dark:text-white">
            {ar ? 'لا توجد محطة بهذا الاسم' : 'No station matches'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {ar ? 'جرّب كتابة الاسم الشائع، مثل "رمسيس" أو "محطة مصر".' : 'Try a common name such as “Ramses” or “Misr”.'}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {groups.map((group) => (
            <section key={group.tier}>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-xs font-bold text-ink dark:text-white">
                  {tierLabel(locale, group.tier as 1 | 2 | 3)}
                </h2>
                <span className="num rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                  {group.stations.length}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.stations.map((station) => (
                  <Link
                    key={station.id}
                    href={`/station/${station.id}`}
                    className="group panel flex items-start justify-between gap-2 p-3 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift dark:hover:border-brand-400/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink dark:text-white">
                        {ar ? station.nameAr : station.nameEn}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {ar ? station.governorateAr : station.governorateEn}
                        {' · '}
                        <span className="num">{station.code}</span>
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {station.lineIds.slice(0, 3).map((id) => {
                          const line = LINE_MAP[id];
                          if (!line) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 rounded bg-slate-50 px-1 py-0.5 text-[8px] font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400"
                            >
                              <span className="h-1 w-1 rounded-full" style={{ backgroundColor: line.color }} aria-hidden />
                              {ar ? line.shortAr : line.shortEn}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-700 group-hover:text-white dark:bg-brand-500/10 dark:text-brand-300">
                      {ar ? <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> : <ArrowRight className="h-3.5 w-3.5" aria-hidden />}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <details className="mt-5 rounded-xl border border-dashed border-slate-300 p-3 dark:border-white/15">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <TrainFront className="h-3.5 w-3.5" aria-hidden />
          {ar ? 'توقفات بالطلب (لا تُستخدم كوجهة بحث)' : 'Request stops (not search endpoints)'}
        </summary>
        <div className="mt-2 flex flex-wrap gap-1">
          {STATION_OPTIONS.filter((station) => !station.searchable).map((station) => (
            <Link
              key={station.id}
              href={`/station/${station.id}`}
              className={cn(
                'rounded-md bg-slate-50 px-1.5 py-1 text-[10px] text-slate-500 transition hover:text-brand-700 dark:bg-white/5 dark:text-slate-400',
              )}
            >
              {ar ? station.nameAr : station.nameEn}
            </Link>
          ))}
        </div>
      </details>
    </div>
  );
}
