'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Bell, Clock, Star } from 'lucide-react';
import type { Locale } from '@/types/rail';
import {
  getRecentSearches,
  getSavedTrips,
  subscribeStorage,
  type RecentSearch,
  type SavedTripSummary,
} from '@/lib/client-storage';
import { formatClockClient } from '@/lib/client-time';

export function RecentTrips({ locale }: { locale: Locale }) {
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [saved, setSaved] = useState<SavedTripSummary[]>([]);
  const ar = locale === 'ar';

  useEffect(() => {
    const update = () => {
      setRecent(getRecentSearches());
      setSaved(getSavedTrips().slice(0, 4));
    };
    update();
    return subscribeStorage(update);
  }, []);

  if (recent.length === 0 && saved.length === 0) return null;

  return (
    <section className="page-shell pb-10">
      <div className="grid gap-3 lg:grid-cols-2">
        {recent.length > 0 ? (
          <div className="panel p-4">
            <h2 className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
              <Clock className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" aria-hidden />
              {ar ? 'آخر عمليات البحث' : 'Recent searches'}
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recent.map((search) => (
                <Link
                  key={`${search.fromId}-${search.toId}`}
                  href={`/search?from=${search.fromId}&to=${search.toId}&date=${search.date}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:text-slate-300"
                >
                  {ar ? search.fromNameAr : search.fromNameEn}
                  <ArrowLeft className="h-2.5 w-2.5 opacity-50 rtl:block ltr:hidden" aria-hidden />
                  <ArrowRight className="hidden h-2.5 w-2.5 opacity-50 ltr:block" aria-hidden />
                  {ar ? search.toNameAr : search.toNameEn}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {saved.length > 0 ? (
          <div className="panel p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden />
                {ar ? 'رحلاتك المحفوظة' : 'Saved trips'}
              </h2>
              <Link href="/alerts" className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 dark:text-brand-300">
                <Bell className="h-3 w-3" aria-hidden />
                {ar ? 'تنبيهاتي' : 'My alerts'}
              </Link>
            </div>
            <ul className="mt-2 divide-y divide-slate-100 dark:divide-white/5">
              {saved.map((trip) => (
                <li key={trip.tripId}>
                  <Link
                    href={`/trip/${trip.tripId}?from=${trip.fromId}&to=${trip.toId}`}
                    className="flex items-center justify-between gap-2 py-1.5 text-[11px]"
                  >
                    <span className="min-w-0 truncate font-semibold text-slate-700 dark:text-slate-200">
                      {ar ? `${trip.fromNameAr} → ${trip.toNameAr}` : `${trip.fromNameEn} → ${trip.toNameEn}`}
                    </span>
                    <span className="num shrink-0 text-slate-400">
                      {formatClockClient(trip.departMinutes)} · {trip.serviceNumber}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
