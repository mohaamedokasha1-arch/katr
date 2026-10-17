'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BellRing, BookmarkCheck, WifiOff } from 'lucide-react';
import type { Locale } from '@/types/rail';
import {
  getReminders,
  getSavedTrips,
  subscribeStorage,
  type SavedReminder,
  type SavedTripSummary,
} from '@/lib/client-storage';

export function OfflineChecklist({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const [saved, setSaved] = useState<SavedTripSummary[]>([]);
  const [reminders, setReminders] = useState<SavedReminder[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSaved(getSavedTrips());
      setReminders(getReminders());
      setLoaded(true);
    };
    sync();
    return subscribeStorage(sync);
  }, []);

  if (!loaded) {
    return <div className="skeleton h-32 rounded-2xl" />;
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-slate-100 p-4 dark:border-white/5">
        <h2 className="text-sm font-bold text-ink dark:text-white">
          {ar ? 'متاح على جهازك دلوقتي' : 'Available on this device now'}
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          {ar
            ? 'البيانات دي محفوظة محليًا، مش محتاجة سيرفر.'
            : 'This data lives locally and needs no server.'}
        </p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink dark:text-white">
            <BookmarkCheck className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" aria-hidden />
            {ar ? 'رحلات محفوظة' : 'Saved trips'}
            <span className="num ms-auto rounded-full bg-white px-1.5 text-[9px] text-slate-500 dark:bg-white/10 dark:text-slate-400">
              {saved.length}
            </span>
          </p>
          {saved.length === 0 ? (
            <p className="mt-2 text-[10px] leading-5 text-slate-400">
              {ar ? 'مافيش رحلات محفوظة. احفظ رحلة وانت متصل عشان تفتحها هنا.' : 'None saved. Save a trip while online to open it here.'}
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {saved.slice(0, 4).map((trip) => (
                <li key={trip.tripId}>
                  <Link
                    href={`/trip/${trip.tripId}`}
                    className="flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-300"
                  >
                    <span className="num shrink-0 font-bold">{trip.serviceNumber}</span>
                    <span className="truncate">
                      {ar ? trip.fromNameAr : trip.fromNameEn} → {ar ? trip.toNameAr : trip.toNameEn}
                    </span>
                    {ar ? <ArrowLeft className="ms-auto h-3 w-3 shrink-0 opacity-40" aria-hidden /> : <ArrowRight className="ms-auto h-3 w-3 shrink-0 opacity-40" aria-hidden />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink dark:text-white">
            <BellRing className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" aria-hidden />
            {ar ? 'تذكيرات' : 'Reminders'}
            <span className="num ms-auto rounded-full bg-white px-1.5 text-[9px] text-slate-500 dark:bg-white/10 dark:text-slate-400">
              {reminders.length}
            </span>
          </p>
          {reminders.length === 0 ? (
            <p className="mt-2 text-[10px] leading-5 text-slate-400">
              {ar ? 'مافيش تذكيرات. أضف تنبيه من صفحة الرحلة.' : 'No reminders. Add one from a trip page.'}
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {reminders.slice(0, 4).map((reminder) => (
                <li key={reminder.id} className="truncate text-[10px] text-slate-600 dark:text-slate-300">
                  <span className="num font-bold">{reminder.serviceNumber}</span>{' '}
                  {ar
                    ? `${reminder.fromNameAr} → ${reminder.toNameAr}`
                    : `${reminder.fromNameEn} → ${reminder.toNameEn}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="flex items-center gap-1.5 border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-400 dark:border-white/5">
        <WifiOff className="h-3 w-3" aria-hidden />
        {ar ? 'هتتحدث أول ما الاتصال يرجع.' : 'They refresh as soon as you reconnect.'}
      </p>
    </div>
  );
}
