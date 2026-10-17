import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  Radio,
  ShieldCheck,
  Sparkles,
  TrainFront,
} from 'lucide-react';
import type { Locale } from '@/types/rail';
import type { AlertItem, HomeLiveData } from '@/lib/home';
import { SearchForm } from '@/components/search/SearchForm';
import { TrainNumberSearch } from '@/components/search/TrainNumberSearch';
import { LiveClock, LiveRefresher } from '@/components/trip/LiveBits';
import { POPULAR_PAIRS } from '@/lib/content';
import { STATION_MAP } from '@/lib/data/stations';
import { routePairPath } from '@/lib/data/station-slugs';
import { formatDateShort } from '@/lib/time';

export function Hero({
  locale,
  data,
  alert,
}: {
  locale: Locale;
  data: HomeLiveData;
  alert?: AlertItem;
}) {
  const ar = locale === 'ar';
  const quickRoutes = POPULAR_PAIRS.slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-[#051838] text-white">
      <div className="pointer-events-none absolute inset-0 hero-glow" aria-hidden />
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -bottom-32 start-[-10%] h-72 w-[60%] rounded-full bg-brand-600/10 blur-3xl"
        aria-hidden
      />

      <div className="page-shell relative pb-10 pt-9 sm:pb-12 sm:pt-12 lg:pb-14 lg:pt-14">
        <div className="grid items-start gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-12">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-brand-100">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-emerald-400/70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                {ar ? 'منصة مستقلة · بيانات شفافة' : 'Independent · transparent data'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium text-brand-200/70">
                <ShieldCheck className="h-3 w-3" aria-hidden />
                {ar ? 'درجة ثقة لكل معلومة' : 'Confidence score on every fact'}
              </span>
            </div>

            <h1 className="mt-5 max-w-2xl text-[38px] font-bold leading-[1.18] tracking-tight sm:text-[48px] lg:text-[54px]">
              {ar ? (
                <>
                  اعرف ميعادك…
                  <br />
                  <span className="text-brand-200">قبل ما يفوتك.</span>
                </>
              ) : (
                <>
                  Know your train,
                  <br />
                  <span className="text-brand-200">before it leaves.</span>
                </>
              )}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-brand-100/80 sm:text-base sm:leading-8">
              {ar
                ? 'مواعيد قطارات مصر في مكان واحد، مع مصدر واضح لكل معلومة: رسمي، قياسي، أو مؤكد من الركاب. ابحث، احفظ رحلتك، وخليك عارف قبل ما تتحرك.'
                : 'Egyptian rail timetables in one place, with a clear source for every data point: official, standard or rider-confirmed. Search, save your trip, and know before you move.'}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-brand-200/70">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-signal" aria-hidden />
                {ar ? 'أقل من 3 ثوانٍ من البحث للنتيجة' : 'Under 3 seconds from search to result'}
              </span>
              <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
              <span className="inline-flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                {ar ? 'لوحات محطات مباشرة' : 'Live station boards'}
              </span>
              <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
              <span className="inline-flex items-center gap-1.5">
                <TrainFront className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                {ar ? 'يعمل بدون اتصال كتطبيق' : 'Installable, works offline'}
              </span>
            </div>
          </div>

          <aside className="relative">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-board backdrop-blur-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-300/70">
                    {ar ? 'شبكة اليوم' : 'Network today'}
                  </p>
                  <p className="num mt-1 text-[11px] text-brand-200/60">
                    {formatDateShort(data.date, locale)} · {ar ? 'توقيت القاهرة' : 'Cairo time'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" />
                  Live
                </span>
              </div>

              <div className="mt-3">
                <LiveClock locale={locale} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/[0.06] p-2.5">
                  <div className="num text-xl font-semibold text-white">{data.counts.services}</div>
                  <div className="mt-0.5 text-[9px] text-brand-200/70">{ar ? 'رحلة اليوم' : 'trips today'}</div>
                </div>
                <div className="rounded-xl bg-white/[0.06] p-2.5">
                  <div className="num text-xl font-semibold text-orange-300">
                    {data.counts.delayed + data.counts.cancelled}
                  </div>
                  <div className="mt-0.5 text-[9px] text-brand-200/70">{ar ? 'تغييرات' : 'changes'}</div>
                </div>
                <div className="rounded-xl bg-white/[0.06] p-2.5">
                  <div className="num text-xl font-semibold text-emerald-300">{data.counts.changed}</div>
                  <div className="mt-0.5 text-[9px] text-brand-200/70">{ar ? 'إضافية' : 'extra runs'}</div>
                </div>
              </div>

              {alert ? (
                <Link
                  href="/status"
                  className="group mt-3 flex items-start gap-2 rounded-xl border border-signal/25 bg-signal/10 p-2.5 transition hover:bg-signal/15"
                >
                  <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-300" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-orange-200">
                      {ar ? alert.titleAr : alert.titleEn}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-brand-100/60">
                      {ar ? alert.reasonAr : alert.reasonEn}
                    </p>
                  </div>
                  <ArrowUpRight className="h-3 w-3 shrink-0 text-orange-300/70 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              ) : (
                <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-2.5 text-[10px] text-emerald-200/80">
                  {ar ? 'لا توجد تغييرات منشورة على الشبكة الآن.' : 'No published network changes right now.'}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <LiveRefresher locale={locale} intervalMs={60_000} onDark />
                <Link
                  href="/status"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-200/80 transition hover:text-white"
                >
                  {ar ? 'حالة الشبكة' : 'Network status'}
                  {ar ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                </Link>
              </div>
            </div>
          </aside>
        </div>

        <SearchForm locale={locale} variant="hero" className="mt-7 sm:mt-8" />

        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-300/50">
            {ar ? 'الأكثر بحثًا' : 'Popular'}
          </span>
          {quickRoutes.map((pair) => {
            const from = STATION_MAP[pair.fromId];
            const to = STATION_MAP[pair.toId];
            return (
              <Link
                key={`${pair.fromId}-${pair.toId}`}
                href={routePairPath(pair.fromId, pair.toId)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[10px] font-medium text-brand-100/80 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
              >
                {ar ? from.nameAr : from.nameEn}
                {ar ? <ArrowLeft className="h-2.5 w-2.5 opacity-50" /> : <ArrowRight className="h-2.5 w-2.5 opacity-50" />}
                {ar ? to.nameAr : to.nameEn}
              </Link>
            );
          })}
          <span className="text-brand-300/30">|</span>
          <span className="text-[10px] text-brand-200/60">{ar ? 'معاك رقم القطار؟' : 'Know the number?'}</span>
          <TrainNumberSearch locale={locale} variant="dark" />
        </div>
      </div>

      <div className="relative h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" aria-hidden />
    </section>
  );
}
