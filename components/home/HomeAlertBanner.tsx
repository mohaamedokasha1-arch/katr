import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarClock, CircleAlert, Info, Wrench } from 'lucide-react';
import type { Locale, OverrideType } from '@/types/rail';
import type { AlertItem } from '@/lib/home';
import { formatDateShort } from '@/lib/time';

const typeStyles: Record<OverrideType, { ar: string; en: string; tone: string; icon: typeof Info }> = {
  delay: {
    ar: 'تأخير',
    en: 'Delay',
    tone: 'text-signal-ink dark:text-orange-300',
    icon: CircleAlert,
  },
  cancellation: {
    ar: 'إلغاء',
    en: 'Cancellation',
    tone: 'text-danger dark:text-red-300',
    icon: CircleAlert,
  },
  maintenance: {
    ar: 'صيانة',
    en: 'Maintenance',
    tone: 'text-danger dark:text-red-300',
    icon: Wrench,
  },
  schedule_change: {
    ar: 'تعديل موعد',
    en: 'Schedule change',
    tone: 'text-brand-700 dark:text-brand-300',
    icon: CalendarClock,
  },
  extra_run: {
    ar: 'رحلة إضافية',
    en: 'Extra run',
    tone: 'text-success-ink dark:text-emerald-300',
    icon: Info,
  },
};

export function HomeAlertBanner({
  locale,
  alerts,
}: {
  locale: Locale;
  alerts: AlertItem[];
}) {
  if (alerts.length === 0) return null;
  const ar = locale === 'ar';

  return (
    <section className="page-shell pt-6">
      <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/70 dark:border-amber-400/20 dark:bg-amber-500/[0.06]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 px-4 py-2.5 dark:border-amber-400/15">
          <div className="flex items-center gap-2 text-[11px] font-bold text-amber-900 dark:text-amber-200">
            <CircleAlert className="h-3.5 w-3.5" aria-hidden />
            {ar ? 'تغييرات منشورة على الشبكة' : 'Published network changes'}
            <span className="num rounded-full bg-amber-200/70 px-1.5 py-0.5 text-[9px] dark:bg-amber-400/20">
              {alerts.length}
            </span>
          </div>
          <Link
            href="/status"
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-900/70 transition hover:text-amber-900 dark:text-amber-200/70 dark:hover:text-amber-200"
          >
            {ar ? 'الحالة الكاملة' : 'Full status'}
            {ar ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
          </Link>
        </div>
        <ul className="divide-y divide-amber-200/50 dark:divide-amber-400/10">
          {alerts.slice(0, 3).map((alert) => {
            const style = typeStyles[alert.type];
            const Icon = style.icon;
            return (
              <li key={alert.id} className="flex flex-wrap items-start gap-2 px-4 py-2.5">
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${style.tone}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-amber-950 dark:text-amber-100">
                    <span className={`me-1.5 rounded px-1 py-0.5 text-[9px] font-bold ${style.tone} bg-white/60 dark:bg-white/5`}>
                      {ar ? style.ar : style.en}
                    </span>
                    {ar ? alert.titleAr : alert.titleEn}
                    {alert.delayMinutes ? (
                      <span className="num ms-1">+{alert.delayMinutes}m</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-amber-900/60 dark:text-amber-100/50">
                    {ar ? alert.reasonAr : alert.reasonEn}
                  </p>
                </div>
                <span className="num shrink-0 text-[9px] text-amber-900/50 dark:text-amber-200/40">
                  {formatDateShort(alert.fromDate, locale)}
                  {alert.toDate !== alert.fromDate ? ` – ${formatDateShort(alert.toDate, locale)}` : ''}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
