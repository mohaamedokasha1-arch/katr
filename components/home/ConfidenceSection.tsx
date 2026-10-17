import Link from 'next/link';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import type { ConfidenceLevel, Locale, TripResult } from '@/types/rail';
import { confidenceMeta, confidenceReasonText, formatDuration } from '@/lib/display';
import { formatClock } from '@/lib/time';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { SectionHeading } from '@/components/ui/SectionHeading';

const LEVELS: ConfidenceLevel[] = ['official', 'standard', 'community', 'stale'];

export function ConfidenceSection({
  locale,
  examples,
}: {
  locale: Locale;
  examples: Array<{ level: ConfidenceLevel; trip: TripResult | null }>;
}) {
  const ar = locale === 'ar';

  return (
    <section className="border-y border-slate-200/70 bg-white dark:border-white/10 dark:bg-night-800">
      <div className="page-shell py-10 sm:py-14">
        <SectionHeading
          locale={locale}
          eyebrow={ar ? 'الميزة الأساسية' : 'The core differentiator'}
          title={ar ? 'الثقة مش شعار… ده نظام كامل' : 'Trust is not a slogan — it is a system'}
          description={
            ar
              ? 'كل معلومة في راكب تحمل مصدرها ودرجة ثقتها. تعرف بالضبط هل الموعد مؤكد رسميًا، أم جدول قياسي، أم تأكيد من ركاب اليوم، أم بيانات تحتاج إعادة تحقق.'
              : 'Every fact in Rakeb carries its source and confidence level. Know exactly whether a time is officially verified, a standard timetable, today’s rider confirmation, or data that needs re-checking.'
          }
          action={{ label: ar ? 'اقرأ كيف تُحسب' : 'How it is calculated', href: '/faq#confidence' }}
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div className="space-y-2">
            {LEVELS.map((level) => {
              const meta = confidenceMeta(locale, level);
              return (
                <div
                  key={level}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 dark:border-white/10"
                >
                  <span
                    className={
                      level === 'official'
                        ? 'mt-1 h-2 w-2 shrink-0 rounded-full bg-success'
                        : level === 'standard'
                          ? 'mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500'
                          : level === 'community'
                            ? 'mt-1 h-2 w-2 shrink-0 rounded-full bg-signal'
                            : 'mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-400'
                    }
                    aria-hidden
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-ink dark:text-white">{meta.label}</h3>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                        {level === 'official'
                          ? '4/4'
                          : level === 'standard'
                            ? '3/4'
                            : level === 'community'
                              ? '2/4'
                              : '1/4'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                      {meta.description}
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-[11px] leading-5 text-brand-800 dark:bg-brand-500/10 dark:text-brand-200">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {ar
                ? 'لا نعدّل جدولًا بسبب بلاغ واحد. التغييرات الرسمية تمر بمراجعة بشرية، والمجتمعي يحتاج 3 بلاغات مستقلة على الأقل.'
                : 'We never edit a timetable from one report. Official changes pass human review; community confirmation needs at least 3 independent reports.'}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-mist p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink dark:text-white">
                {ar ? 'أمثلة حقيقية من اليوم' : 'Real examples from today'}
              </h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold text-slate-400 dark:bg-white/10 dark:text-slate-400">
                {ar ? 'بيانات حية' : 'Live data'}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              {ar
                ? 'نفس المسار قد يحتوي رحلات بدرجات ثقة مختلفة. اضغط على أي مثال لفتح تفاصيله.'
                : 'The same route can hold trips with different confidence levels. Tap any example to open it.'}
            </p>

            <div className="mt-3 space-y-2">
              {examples.map(({ level, trip }) => {
                const meta = confidenceMeta(locale, level);
                if (!trip) {
                  return (
                    <div
                      key={level}
                      className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white/50 p-3 text-[11px] text-slate-400 dark:border-white/10 dark:bg-transparent"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" aria-hidden />
                      {ar ? `لا يوجد مثال ${meta.label} في هذا المسار الآن.` : `No ${meta.label} example on this route right now.`}
                    </div>
                  );
                }
                return (
                  <Link
                    key={level}
                    href={`/trip/${trip.tripId}?from=${trip.from.id}&to=${trip.to.id}`}
                    className="group flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-brand-300 hover:shadow-sm dark:border-white/10 dark:bg-night-700"
                  >
                    <ConfidenceBadge locale={locale} confidence={trip.confidence} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold text-ink dark:text-white">
                        <span className="num">{trip.serviceNumber}</span>
                        {' · '}
                        {ar ? trip.titleAr : trip.titleEn}
                      </p>
                      <p className="num mt-0.5 text-[10px] text-slate-400">
                        {formatClock(trip.departMinutes)} → {formatClock(trip.arriveMinutes)}
                        {' · '}
                        {formatDuration(trip.durationMinutes, locale)}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {confidenceReasonText(locale, trip.confidence.reasonKeys[0])}
                      </p>
                    </div>
                    {ar ? (
                      <ArrowLeft className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-brand-500" aria-hidden />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-brand-500" aria-hidden />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
