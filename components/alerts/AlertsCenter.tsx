'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BellRing,
  Check,
  ChevronDown,
  Clock3,
  Loader2,
  Trash2,
  TrainFront,
  TriangleAlert,
} from 'lucide-react';
import type { Locale } from '@/types/rail';
import type { SavedReminder, TripSnapshot } from '@/lib/client-storage';
import {
  getReminders,
  getSavedTrips,
  removeReminder,
  removeReminderByTrip,
  subscribeStorage,
  toggleSavedTrip,
  type SavedTripSummary,
} from '@/lib/client-storage';
import { formatClockClient, formatRelativeClient } from '@/lib/client-time';
import { buttonClasses } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

type PermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

function snapshotTitle(snapshot: TripSnapshot, ar: boolean) {
  return ar ? snapshot.titleAr : snapshot.titleEn;
}

export function AlertsCenter({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const toast = useToast();
  const [reminders, setReminders] = useState<SavedReminder[]>([]);
  const [saved, setSaved] = useState<SavedTripSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [permission, setPermission] = useState<PermissionState>('unsupported');
  const [requesting, setRequesting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const sync = () => {
      setReminders(getReminders());
      setSaved(getSavedTrips());
      setLoaded(true);
    };
    sync();
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission as PermissionState);
    }
    return subscribeStorage(sync);
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const sorted = [...reminders].sort(
      (a, b) => new Date(a.remindAtIso).getTime() - new Date(b.remindAtIso).getTime(),
    );
    return {
      upcoming: sorted.filter((item) => new Date(item.remindAtIso).getTime() > now - 30 * 60_000),
      past: sorted.filter((item) => new Date(item.remindAtIso).getTime() <= now - 30 * 60_000),
    };
  }, [reminders]);

  const savedOnly = saved.filter(
    (item) => !reminders.some((reminder) => reminder.tripId === item.tripId),
  );

  const askPermission = async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      setPermission('granted');
      toast(ar ? 'التنبيهات مفعّلة بالفعل.' : 'Notifications are already enabled.', 'success');
      return;
    }
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      toast(
        result === 'granted'
          ? ar
            ? 'تمام، هنبّهك قبل القطر.'
            : 'Done — we will nudge you before the train.'
          : ar
            ? 'لم يتم تفعيل الإشعارات. التذكيرات ستظهر داخل الموقع فقط.'
            : 'Notifications are off. Reminders will still show inside the site.',
        result === 'granted' ? 'success' : 'info',
      );
    } catch {
      toast(ar ? 'المتصفح مش سامح بالإشعارات.' : 'This browser blocked the permission prompt.', 'error');
    } finally {
      setRequesting(false);
    }
  };

  const sendTest = () => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      toast(ar ? 'فعّل الإشعارات الأول.' : 'Enable notifications first.', 'error');
      return;
    }
    try {
      new Notification(ar ? 'راكِب — تجربة إشعار' : 'Rakeb — test notification', {
        body: ar
          ? 'كذا هيبان شكل التنبيه قبل ميعاد القطر.'
          : 'This is how a pre-departure alert will look.',
        icon: '/icons/icon-192.png',
      });
      toast(ar ? 'بعتناه.' : 'Sent.', 'success');
    } catch {
      toast(ar ? 'المتصفح رفض الإشعار.' : 'The browser rejected the notification.', 'error');
    }
  };

  const permissionCopy: Record<PermissionState, { ar: string; en: string; tone: string }> = {
    unsupported: {
      ar: 'المتصفح ده مش بيدعم الإشعارات. التذكيرات هتظهر جوّه الموقع.',
      en: 'This browser does not support notifications. Reminders will appear inside the site.',
      tone: 'text-slate-500 dark:text-slate-400',
    },
    default: {
      ar: 'فعّل الإشعارات وهنبهك قبل ميعاد القطر، على طول.',
      en: 'Allow notifications and we will nudge you before departure.',
      tone: 'text-slate-600 dark:text-slate-300',
    },
    granted: {
      ar: 'الإشعارات مفعّلة على الجهاز ده.',
      en: 'Notifications are enabled on this device.',
      tone: 'text-emerald-700 dark:text-emerald-300',
    },
    denied: {
      ar: 'الإشعارات مرفوضة من إعدادات المتصفح. تقدر تفتحها من أيقونة القفل في شريط العنوان.',
      en: 'Notifications are blocked in browser settings. Re-enable them from the padlock in the address bar.',
      tone: 'text-danger dark:text-red-300',
    },
  };
  const copy = permissionCopy[permission];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4 dark:border-white/5">
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink dark:text-white">
                  <BellRing className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden />
                  {ar ? 'تذكيرات قادمة' : 'Upcoming reminders'}
                  {upcoming.length > 0 ? (
                    <span className="num rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      {upcoming.length}
                    </span>
                  ) : null}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {ar
                    ? 'التذكيرات محفوظة على جهازك، ومن غير حساب. لو فتحت الموقع قبل الميعاد هتلاقي التنبيه.'
                    : 'Reminders live on your device with no account. Keep the site open near departure to get the nudge.'}
                </p>
              </div>
              <button
                type="button"
                onClick={askPermission}
                disabled={requesting || permission === 'unsupported' || permission === 'denied'}
                className={cn(
                  buttonClasses({ size: 'sm', variant: permission === 'granted' ? 'secondary' : 'primary' }),
                  'shrink-0',
                )}
              >
                {requesting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : permission === 'granted' ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <BellRing className="h-3.5 w-3.5" aria-hidden />
                )}
                {permission === 'granted'
                  ? ar
                    ? 'مفعّلة'
                    : 'Enabled'
                  : ar
                    ? 'فعّل الإشعارات'
                    : 'Enable notifications'}
              </button>
            </div>
            <p className={cn('border-b border-slate-100 px-4 py-2 text-[10px] leading-5 dark:border-white/5', copy.tone)}>
              {ar ? copy.ar : copy.en}
              {permission === 'granted' ? (
                <button type="button" onClick={sendTest} className="ms-2 font-semibold underline underline-offset-2">
                  {ar ? 'جرّب إشعار' : 'Send a test'}
                </button>
              ) : null}
            </p>

            {!loaded ? (
              <div className="space-y-2 p-4">
                <div className="skeleton h-14 rounded-xl" />
                <div className="skeleton h-14 rounded-xl" />
              </div>
            ) : upcoming.length === 0 ? (
              <div className="p-8 text-center">
                <Clock3 className="mx-auto h-6 w-6 text-slate-300" aria-hidden />
                <p className="mt-2 text-xs font-semibold text-ink dark:text-white">
                  {ar ? 'مفيش تذكيرات لسه' : 'No reminders yet'}
                </p>
                <p className="mx-auto mt-1 max-w-xs text-[11px] leading-6 text-slate-500 dark:text-slate-400">
                  {ar
                    ? 'من صفحة أي رحلة، اضغط "نبّهني" قبل المغادرة، وهتلاقي القطر هنا.'
                    : 'On any trip page tap “Remind me” before departure and it will appear here.'}
                </p>
                <Link href="/search" className={cn(buttonClasses({ size: 'sm' }), 'mt-3')}>
                  <TrainFront className="h-3.5 w-3.5" aria-hidden />
                  {ar ? 'ابحث عن رحلة' : 'Find a trip'}
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-white/5">
                {upcoming.map((reminder) => {
                  const due = new Date(reminder.remindAtIso);
                  const overdue = due.getTime() <= Date.now();
                  return (
                    <li key={reminder.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                          overdue
                            ? 'bg-signal-soft text-signal-ink dark:bg-signal/15 dark:text-orange-300'
                            : 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
                        )}
                      >
                        {overdue ? <TriangleAlert className="h-4 w-4" aria-hidden /> : <BellRing className="h-4 w-4" aria-hidden />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="num rounded bg-brand-700 px-1.5 py-0.5 text-[9px] font-bold text-white dark:bg-brand-500">
                            {reminder.serviceNumber}
                          </span>
                          <p className="truncate text-xs font-semibold text-ink dark:text-white">
                            {snapshotTitle(reminder, ar)}
                          </p>
                        </div>
                        <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
                          {ar ? reminder.fromNameAr : reminder.fromNameEn} → {ar ? reminder.toNameAr : reminder.toNameEn}
                          {' · '}
                          <span className="num">{formatClockClient(reminder.departMinutes)}</span>
                        </p>
                        <p className={cn('mt-0.5 text-[10px]', overdue ? 'text-signal-ink dark:text-orange-300' : 'text-slate-400')}>
                          {overdue
                            ? ar
                              ? 'الميعاد عدّى — راجع حالة القطر'
                              : 'Reminder passed — check the trip status'
                            : ar
                              ? `هنبهك بعد ${formatRelativeClient(reminder.remindAtIso)}`
                              : `Reminder in ${formatRelativeClient(reminder.remindAtIso)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/trip/${reminder.tripId}`}
                          className={buttonClasses({ size: 'sm', variant: 'secondary' })}
                        >
                          {ar ? 'افتح الرحلة' : 'Open trip'}
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            removeReminder(reminder.id);
                            toast(ar ? 'اتشال التذكير.' : 'Reminder removed.', 'info');
                          }}
                          aria-label={ar ? 'احذف التذكير' : 'Remove reminder'}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-danger dark:hover:bg-white/5"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {savedOnly.length > 0 ? (
            <section className="panel overflow-hidden">
              <div className="border-b border-slate-100 p-4 dark:border-white/5">
                <h2 className="text-sm font-bold text-ink dark:text-white">
                  {ar ? 'رحلات محفوظة' : 'Saved trips'}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {ar
                    ? 'محفوظة على جهازك للمقارنة أو للحجز لاحقًا. ضيف تذكير لأي رحلة عشان توصلك.'
                    : 'Kept on your device for comparing or booking later. Add a reminder so it reaches you.'}
                </p>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-white/5">
                {savedOnly.map((trip) => (
                  <li key={trip.tripId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="num rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {trip.serviceNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink dark:text-white">
                        {snapshotTitle(trip, ar)}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {ar ? trip.fromNameAr : trip.fromNameEn} → {ar ? trip.toNameAr : trip.toNameEn}
                      </p>
                    </div>
                    <Link href={`/trip/${trip.tripId}`} className={buttonClasses({ size: 'sm', variant: 'ghost' })}>
                      {ar ? 'التفاصيل' : 'Details'}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        toggleSavedTrip(trip);
                        removeReminderByTrip(trip.tripId);
                        toast(ar ? 'اتشالت من المحفوظات.' : 'Removed from saved.', 'info');
                      }}
                      aria-label={ar ? 'احذف من المحفوظات' : 'Remove from saved'}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-danger dark:hover:bg-white/5"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {past.length > 0 ? (
            <section className="panel overflow-hidden">
              <button
                type="button"
                onClick={() => setShowHistory((value) => !value)}
                aria-expanded={showHistory}
                className="flex w-full items-center justify-between p-4 text-start"
              >
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {ar ? `تذكيرات قديمة (${past.length})` : `Past reminders (${past.length})`}
                </span>
                <ChevronDown
                  className={cn('h-4 w-4 text-slate-400 transition', showHistory && 'rotate-180')}
                  aria-hidden
                />
              </button>
              {showHistory ? (
                <ul className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-white/5 dark:border-white/5">
                  {past.map((reminder) => (
                    <li key={reminder.id} className="flex items-center gap-2 px-4 py-2.5">
                      <span className="text-[11px] text-slate-400 line-through">
                        {ar ? reminder.fromNameAr : reminder.fromNameEn} → {ar ? reminder.toNameAr : reminder.toNameEn}
                      </span>
                      <span className="num ms-auto text-[10px] text-slate-400">{reminder.date}</span>
                      <button
                        type="button"
                        onClick={() => removeReminder(reminder.id)}
                        aria-label={ar ? 'احذف' : 'Delete'}
                        className="text-slate-300 transition hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="space-y-3">
          <div className="panel p-4">
            <h2 className="text-xs font-bold text-ink dark:text-white">
              {ar ? 'إزاي التنبيهات بتشتغل؟' : 'How alerts work'}
            </h2>
            <ol className="mt-2 space-y-2 text-[11px] leading-6 text-slate-600 dark:text-slate-300">
              <li className="flex gap-2">
                <span className="num flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[9px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">1</span>
                {ar ? 'اختار رحلة واحفظها.' : 'Pick a trip and save it.'}
              </li>
              <li className="flex gap-2">
                <span className="num flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[9px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">2</span>
                {ar ? 'حدد قبلها بكام دقيقة تحب نبهك.' : 'Choose how many minutes ahead to be nudged.'}
              </li>
              <li className="flex gap-2">
                <span className="num flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[9px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">3</span>
                {ar ? 'سيبت الموقع مفتوح؟ التنبيه يوصلك حتى لو في تاب تاني.' : 'Keep the site open and the alert still arrives across tabs.'}
              </li>
            </ol>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-[10px] leading-5 text-slate-500 dark:border-white/15 dark:text-slate-400">
            {ar
              ? 'مش بنبعت بياناتك لأي جهة. التذكيرات بتتخزن في localStorage على جهازك، وسيرفر العرض التجريبي بيحفظ الاشتراك كصف مجهول بدون بريد أو رقم.'
              : 'No personal data leaves your device without consent. Reminders sit in localStorage; the demo server stores an anonymous subscription row with no email or phone.'}
          </div>
        </aside>
    </div>
  );
}
