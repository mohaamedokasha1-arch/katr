import Link from 'next/link';
import { CalendarClock, CircleAlert, ShieldCheck, Users } from 'lucide-react';
import type { Confidence, Locale } from '@/types/rail';
import {
  confidenceMeta,
  confidenceReasonText,
  type Tone,
} from '@/lib/display';
import { relativeTime } from '@/lib/display';
import { cn } from '@/lib/utils';

const LEVELS = ['official', 'standard', 'community', 'stale'] as const;

const levelIcon = {
  official: ShieldCheck,
  standard: CalendarClock,
  community: Users,
  stale: CircleAlert,
};

const activeRing: Record<Tone, string> = {
  success: 'border-success/40 bg-success-soft dark:border-success/30 dark:bg-success/10',
  brand: 'border-brand-300 bg-brand-50 dark:border-brand-400/30 dark:bg-brand-500/10',
  signal: 'border-signal/30 bg-signal-soft dark:border-signal/30 dark:bg-signal/10',
  neutral: 'border-slate-300 bg-slate-50 dark:border-white/20 dark:bg-white/5',
  danger: 'border-danger/30 bg-danger-soft dark:bg-danger/10',
  violet: 'border-violet-300 bg-violet-50 dark:bg-violet-500/10',
};

export function ConfidenceExplainer({
  confidence,
  locale,
  compact = false,
}: {
  confidence: Confidence;
  locale: Locale;
  compact?: boolean;
}) {
  const ar = locale === 'ar';
  const current = confidenceMeta(locale, confidence.level);

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-ink dark:text-white">
          {ar ? 'درجة الثقة في هذه البيانات' : 'Confidence in this data'}
        </h2>
        <Link
          href="/faq#confidence"
          className="text-[11px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
        >
          {ar ? 'كيف تُحسب؟' : 'How it works'}
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div
              className={cn(
                'h-full rounded-full',
                confidence.level === 'official' && 'bg-success',
                confidence.level === 'standard' && 'bg-brand-500',
                confidence.level === 'community' && 'bg-signal',
                confidence.level === 'stale' && 'bg-slate-400',
              )}
              style={{ width: `${confidence.score}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
            <span>{current.label}</span>
            <span className="num">{confidence.score}/100</span>
          </div>
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
        {current.description}
      </p>

      <ul className="mt-3 space-y-1.5">
        {confidence.reasonKeys.map((reason) => (
          <li key={reason} className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden />
            {confidenceReasonText(locale, reason)}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[10px] text-slate-400">
        {ar ? 'آخر تحديث للمصدر ' : 'Source last updated '}
        {relativeTime(confidence.lastUpdatedIso, locale)}
        {confidence.communityConfirmations > 0
          ? ar
            ? ` · ${confidence.communityConfirmations} بلاغ مجتمعي اليوم`
            : ` · ${confidence.communityConfirmations} rider reports today`
          : ''}
      </p>

      {compact ? null : (
        <div className="mt-4 grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-3 dark:border-white/10">
          {LEVELS.map((level) => {
            const meta = confidenceMeta(locale, level);
            const Icon = levelIcon[level];
            const active = level === confidence.level;
            return (
              <div
                key={level}
                className={cn(
                  'rounded-lg border p-2 transition',
                  active
                    ? activeRing[meta.tone]
                    : 'border-transparent bg-transparent opacity-60',
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3" aria-hidden />
                  <span className="text-[10px] font-bold">{meta.label}</span>
                </div>
                <p className="mt-1 text-[9px] leading-4 text-slate-500 dark:text-slate-400">
                  {meta.description}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
