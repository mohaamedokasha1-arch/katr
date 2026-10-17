'use client';

import { useEffect, useRef } from 'react';
import {
  getReminders,
  markReminderNotified,
  removeReminder,
} from '@/lib/client-storage';
import { useToast } from '@/components/ui/Toast';

const firedThisSession = new Set<string>();

/**
 * Client-side reminder dispatcher. Runs while the app is open: it fires a
 * toast and, with permission, a native notification when a saved reminder
 * becomes due. It never asks for permission on its own.
 */
export function ReminderWatcher({ locale }: { locale: 'ar' | 'en' }) {
  const toast = useToast();
  const localeRef = useRef(locale);
  localeRef.current = locale;

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      const reminders = getReminders();
      const ar = localeRef.current === 'ar';
      for (const reminder of reminders) {
        if (reminder.notified) {
          if (now - new Date(reminder.remindAtIso).getTime() > 3 * 60_000) {
            removeReminder(reminder.id);
          }
          continue;
        }
        const dueAt = new Date(reminder.remindAtIso).getTime();
        if (dueAt <= now && dueAt > now - 15 * 60_000 && !firedThisSession.has(reminder.id)) {
          firedThisSession.add(reminder.id);
          markReminderNotified(reminder.id);
          const title = ar
            ? `قطار ${reminder.serviceNumber} بعد ${reminder.minutesBefore} دقيقة`
            : `Train ${reminder.serviceNumber} in ${reminder.minutesBefore} minutes`;
          const body = ar
            ? `${reminder.fromNameAr} → ${reminder.toNameAr}. استعد للتحرك للمحطة.`
            : `${reminder.fromNameEn} → ${reminder.toNameEn}. Get ready to head to the station.`;
          toast(`${title} — ${body}`, 'info');
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification(title, { body, icon: '/icons/icon-192.png', tag: reminder.id });
            } catch {
              // Some browsers block the constructor; the toast already fired.
            }
          }
        }
      }
    };

    check();
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [toast]);

  return null;
}
