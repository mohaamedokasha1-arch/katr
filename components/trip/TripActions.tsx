'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BellRing,
  Check,
  Copy,
  MessageCircle,
  Share2,
  Star,
} from 'lucide-react';
import type { TripSnapshot } from '@/lib/client-storage';
import {
  addReminder,
  getReminders,
  getSavedTrips,
  removeReminder,
  removeReminderByTrip,
  saveItinerary,
  subscribeStorage,
  toggleSavedTrip,
  tripToItinerary,
} from '@/lib/client-storage';
import type { SavedItinerary } from '@/lib/client-storage';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { formatClockClient } from '@/lib/client-time';

export function SaveTripButton({
  locale,
  snapshot,
  itinerary,
  compact = false,
}: {
  locale: 'ar' | 'en';
  snapshot: TripSnapshot;
  itinerary?: Omit<SavedItinerary, 'savedAt'>;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const update = () =>
      setSaved(getSavedTrips().some((trip) => trip.tripId === snapshot.tripId));
    update();
    return subscribeStorage(update);
  }, [snapshot.tripId]);

  const ar = locale === 'ar';

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => {
        const nowSaved = toggleSavedTrip(snapshot);
        if (nowSaved && itinerary) {
          saveItinerary({ ...itinerary, savedAt: new Date().toISOString() });
        }
        setSaved(nowSaved);
        toast(
          nowSaved
            ? ar
              ? 'تم حفظ الرحلة على جهازك.'
              : 'Trip saved on this device.'
            : ar
              ? 'تمت إزالة الرحلة من المحفوظات.'
              : 'Trip removed from saved.',
          nowSaved ? 'success' : 'info',
        );
      }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
        saved
          ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300'
          : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
      )}
      title={ar ? 'حفظ في المفضلة' : 'Save trip'}
    >
      <Star className={cn('h-3.5 w-3.5', saved && 'fill-current')} aria-hidden />
      {compact ? null : <span>{saved ? (ar ? 'محفوظة' : 'Saved') : ar ? 'حفظ' : 'Save'}</span>}
    </button>
  );
}

const PRESETS = [30, 60, 120, 180];

export function ReminderButton({
  locale,
  snapshot,
  compact = false,
}: {
  locale: 'ar' | 'en';
  snapshot: TripSnapshot;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const toast = useToast();
  const ar = locale === 'ar';
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () =>
      setActive(getReminders().some((reminder) => reminder.tripId === snapshot.tripId));
    update();
    return subscribeStorage(update);
  }, [snapshot.tripId]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function choose(minutes: number) {
    if (active) {
      removeReminderByTrip(snapshot.tripId);
    }
    addReminder(snapshot, minutes);
    setOpen(false);
    setActive(true);
    toast(
      ar
        ? `سنذكّرك قبل الموعد بـ ${minutes} دقيقة.`
        : `We will remind you ${minutes} minutes before departure.`,
      'success',
    );
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          toast(ar ? 'تم تفعيل إشعارات المتصفح لهذا الموقع.' : 'Browser notifications enabled.', 'success');
        }
      } catch {
        // Not fatal.
      }
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
          active
            ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-400/30 dark:bg-brand-500/10 dark:text-brand-200'
            : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
        )}
        title={ar ? 'أضف تنبيهًا' : 'Add reminder'}
      >
        {active ? <BellRing className="h-3.5 w-3.5" aria-hidden /> : <Bell className="h-3.5 w-3.5" aria-hidden />}
        {compact ? null : <span>{active ? (ar ? 'تنبيه مفعّل' : 'Alert on') : ar ? 'نبهني' : 'Remind me'}</span>}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={ar ? 'وقت التنبيه' : 'Reminder timing'}
          className="absolute end-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lift dark:border-white/10 dark:bg-night-700"
        >
          <p className="text-xs font-bold text-ink dark:text-white">
            {ar ? 'قبل موعد التحرك بـ' : 'Remind me before departure'}
          </p>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {PRESETS.map((minutes) => {
              const existing = getReminders().find(
                (reminder) => reminder.tripId === snapshot.tripId && reminder.minutesBefore === minutes,
              );
              return (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => choose(minutes)}
                  className={cn(
                    'rounded-lg border py-2 text-center transition',
                    existing
                      ? 'border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-200'
                      : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 dark:border-white/10 dark:hover:border-brand-400/40',
                  )}
                >
                  <span className="num block text-sm font-bold">{minutes}</span>
                  <span className="block text-[9px] text-slate-400">{ar ? 'دقيقة' : 'min'}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] leading-4 text-slate-400">
            {ar
              ? 'التنبيه محفوظ على جهازك. يعمل أثناء فتح الموقع، ومع إذن المتصفح يظهر كإشعار.'
              : 'Reminders are stored on your device. They work while the site is open and as a notification with permission.'}
          </p>
          {active ? (
            <button
              type="button"
              onClick={() => {
                removeReminderByTrip(snapshot.tripId);
                setActive(false);
                setOpen(false);
                toast(ar ? 'تم إيقاف التنبيه لهذه الرحلة.' : 'Reminder removed for this trip.', 'info');
              }}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              <Check className="h-3 w-3" aria-hidden />
              {ar ? 'إيقاف التنبيه' : 'Remove reminder'}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function ShareTripButton({
  locale,
  snapshot,
  tripId,
  compact = false,
}: {
  locale: 'ar' | 'en';
  snapshot: TripSnapshot;
  tripId: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const toast = useToast();
  const ar = locale === 'ar';

  useEffect(() => {
    // Read the origin after mount so the server never touches window.
    setOrigin(window.location.origin);
  }, []);

  function buildText(): string {
    const base = origin || process.env.NEXT_PUBLIC_SITE_URL || '';
    const tripUrl = `${base}/trip/${tripId}`;
    const depart = formatClockClient(snapshot.departMinutes);
    const arrive = formatClockClient(snapshot.arriveMinutes);
    if (ar) {
      return [
        `🚆 قطار ${snapshot.serviceNumber} — ${snapshot.titleAr}`,
        `${snapshot.fromNameAr} → ${snapshot.toNameAr}`,
        `${depart} → ${arrive}`,
        `التاريخ: ${snapshot.date}`,
        `التفاصيل: ${tripUrl}`,
        '— راكب | اعرف ميعادك قبل ما يفوتك',
      ].join('\n');
    }
    return [
      `🚆 Train ${snapshot.serviceNumber} — ${snapshot.titleEn}`,
      `${snapshot.fromNameEn} → ${snapshot.toNameEn}`,
      `${depart} → ${arrive}`,
      `Date: ${snapshot.date}`,
      `Details: ${tripUrl}`,
      '— Rakeb',
    ].join('\n');
  }

  async function share() {
    const text = buildText();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: ar ? 'تفاصيل الرحلة' : 'Trip details', text });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast(ar ? 'تم نسخ تفاصيل الرحلة.' : 'Trip details copied.', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast(ar ? 'تعذر النسخ من المتصفح.' : 'Copy failed in this browser.', 'error');
    }
  }

  return (
    <div className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
        title={ar ? 'مشاركة' : 'Share'}
      >
        {copied ? <Copy className="h-3.5 w-3.5" aria-hidden /> : <Share2 className="h-3.5 w-3.5" aria-hidden />}
        {compact ? null : <span>{copied ? (ar ? 'تم النسخ' : 'Copied') : ar ? 'مشاركة' : 'Share'}</span>}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(buildText())}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ar ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}
        title="WhatsApp"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
      </a>
    </div>
  );
}

export function TripActionsRow({
  locale,
  snapshot,
  itinerary,
  tripId,
  compact = false,
}: {
  locale: 'ar' | 'en';
  snapshot: TripSnapshot;
  itinerary?: Omit<SavedItinerary, 'savedAt'>;
  tripId: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <SaveTripButton locale={locale} snapshot={snapshot} itinerary={itinerary} compact={compact} />
      <ReminderButton locale={locale} snapshot={snapshot} compact={compact} />
      <ShareTripButton locale={locale} snapshot={snapshot} tripId={tripId} compact={compact} />
    </div>
  );
}
