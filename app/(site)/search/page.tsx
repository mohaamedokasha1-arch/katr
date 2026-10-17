import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Info, Route as RouteIcon, ShieldCheck, TrainFront } from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata } from '@/lib/seo';
import { STATION_MAP } from '@/lib/data/stations';
import { LINE_MAP } from '@/lib/data/lines';
import { normaliseSearchQuery, getPopularRouteCards } from '@/lib/search';
import { POPULAR_PAIRS } from '@/lib/content';
import { routePairPath } from '@/lib/data/station-slugs';
import { formatDateFull, todayCairo } from '@/lib/time';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchForm } from '@/components/search/SearchForm';
import { ResultsSection } from '@/components/search/ResultsSection';
import { RecentTrips } from '@/components/search/RecentTrips';
import { PopularRoutes } from '@/components/home/PopularRoutes';
import { SearchLandingExtras } from '@/components/search/SearchLandingExtras';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const locale = await getLocale();
  const params = await searchParams;
  const from = STATION_MAP[first(params.from) ?? ''];
  const to = STATION_MAP[first(params.to) ?? ''];
  const ar = locale === 'ar';
  if (!from || !to) {
    return buildMetadata({
      locale,
      title: ar ? 'ابحث عن قطار' : 'Find a train',
      description: ar
        ? 'ابحث عن مواعيد القطارات بين أي محطتين في مصر، مع مقارنة الدرجات والأسعار التقديرية.'
        : 'Search Egyptian train times between any two stations, comparing classes and estimated fares.',
      path: '/search',
      noindex: true,
    });
  }
  return buildMetadata({
    locale,
    title: ar
      ? `مواعيد قطارات ${from.nameAr} إلى ${to.nameAr}`
      : `${from.nameEn} to ${to.nameEn} train times`,
    description: ar
      ? `كل رحلات ${from.nameAr} إلى ${to.nameAr} في تاريخ محدد: المواعيد، المدة، الدرجات، ونطاق السعر التقديري، بدرجة ثقة لكل رحلة.`
      : `Every ${from.nameEn} to ${to.nameEn} service on your date, with times, duration, classes and estimated fares — and a confidence level per trip.`,
    path: `/search?from=${from.id}&to=${to.id}&date=${first(params.date) ?? ''}`,
    noindex: true,
  });
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getLocale();
  const params = await searchParams;
  const ar = locale === 'ar';
  const today = todayCairo();
  const rawDate = first(params.date);
  const normalised = normaliseSearchQuery({
    from: first(params.from),
    to: first(params.to),
    date: rawDate,
    direct: first(params.direct),
    classes: first(params.classes),
    sort: first(params.sort),
  });

  const popularRoutes = getPopularRouteCards(POPULAR_PAIRS.slice(0, 6));

  if (!normalised) {
    return (
      <>
        <PageHeader
          locale={locale}
          eyebrow={ar ? 'ابحث بذكاء' : 'Search smart'}
          title={ar ? 'ابحث عن قطار' : 'Find a train'}
          description={
            ar
              ? 'اختار محطة الانطلاق والوصول والتاريخ. تقدر تكتب الاسم الشائع للمحطة، أو تستخدم موقعك لاختيار أقرب محطة.'
              : 'Pick your origin, destination and date. Type a station’s common name, or use your location for the nearest station.'
          }
          breadcrumbs={[{ label: ar ? 'البحث' : 'Search' }]}
        />
        <div className="page-shell relative z-10 -mt-5">
          <SearchForm
            locale={locale}
            initialDate={normalised ? undefined : rawDate ?? today}
            className="shadow-lift"
          />
        </div>
        <RecentTrips locale={locale} />
        <PopularRoutes locale={locale} routes={popularRoutes} />
        <SearchLandingExtras locale={locale} />
      </>
    );
  }

  const from = STATION_MAP[normalised.from];
  const to = STATION_MAP[normalised.to];
  const date = normalised.date;
  const beforeRaw = Number(first(params.before) ?? '');
  const before = Number.isFinite(beforeRaw) && beforeRaw > 0 && beforeRaw < 1440 ? beforeRaw : undefined;
  const maxFareRaw = Number(first(params.maxFare) ?? '');
  const maxFare =
    Number.isFinite(maxFareRaw) && maxFareRaw > 0 && maxFareRaw <= 3000 ? maxFareRaw : undefined;
  const sharedLines = from.lineIds.filter((lineId) => to.lineIds.includes(lineId));

  return (
    <>
      <PageHeader
        locale={locale}
        eyebrow={ar ? 'نتائج البحث' : 'Search results'}
        title={
          ar
            ? `${from.nameAr} إلى ${to.nameAr}`
            : `${from.nameEn} to ${to.nameEn}`
        }
        description={
          ar
            ? `مواعيد القطارات المباشرة على هذا المسار. الأسعار تقديرية، وكل رحلة تحمل درجة ثقة توضح مصدر بياناتها.`
            : 'Direct services on this route. Fares are estimates and every trip carries a confidence level showing where its data comes from.'
        }
        breadcrumbs={[
          { label: ar ? 'البحث' : 'Search', href: '/search' },
          { label: ar ? `${from.nameAr} → ${to.nameAr}` : `${from.nameEn} → ${to.nameEn}` },
        ]}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <CalendarDays className="h-3 w-3" aria-hidden />
              {formatDateFull(date, locale)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <RouteIcon className="h-3 w-3" aria-hidden />
              {sharedLines.length > 0
                ? sharedLines.map((lineId) => (ar ? LINE_MAP[lineId]?.shortAr : LINE_MAP[lineId]?.shortEn)).filter(Boolean).join(' · ')
                : ar
                  ? 'مسار مشترك'
                  : 'Shared corridor'}
            </span>
            {normalised.directOnly ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">
                <TrainFront className="h-3 w-3" aria-hidden />
                {ar ? 'مباشر فقط' : 'Direct only'}
              </span>
            ) : null}
          </>
        }
      >
        <Link
          href={routePairPath(from.id, to.id)}
          className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 sm:inline-flex dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
        >
          <Info className="h-3.5 w-3.5" aria-hidden />
          {ar ? 'صفحة المسار الكاملة' : 'Full route page'}
        </Link>
      </PageHeader>

      <div className="page-shell relative z-10 -mt-5">
        <SearchForm
          locale={locale}
          initialFrom={normalised.from}
          initialTo={normalised.to}
          initialDate={date}
          initialDirect={normalised.directOnly}
          initialClasses={(normalised.classes ?? []).join(',')}
          className="shadow-lift"
        />
      </div>

      <div className="page-shell grid gap-5 py-6 lg:grid-cols-[1fr_288px]">
        <ResultsSection
          locale={locale}
          query={{
            from: normalised.from,
            to: normalised.to,
            date,
            direct: Boolean(normalised.directOnly),
            classes: normalised.classes ?? [],
            sort: normalised.sort ?? 'departure',
            before,
            maxFare,
          }}
          isToday={date === today}
        />

        <aside className="space-y-3">
          <div className="panel p-4">
            <h2 className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
              {ar ? 'اقرأ الشارات قبل ما تنزل' : 'Read the badges before you go'}
            </h2>
            <ul className="mt-2 space-y-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              <li className="flex items-start gap-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden />
                {ar ? 'أخضر: مؤكد رسميًا أو بعد مراجعة بشرية منشورة.' : 'Green: officially verified or human-reviewed and published.'}
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                {ar ? 'أزرق: الجدول القياسي المعتاد لهذا القطار.' : 'Blue: the service’s regular timetable.'}
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" aria-hidden />
                {ar ? 'برتقالي: تأكيد من بلاغات ركاب اليوم.' : 'Orange: confirmed by today’s rider reports.'}
              </li>
              <li className="flex items-start gap-1.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                {ar ? 'رمادي: بيانات قديمة تحتاج إعادة تحقق.' : 'Grey: stale data that needs re-checking.'}
              </li>
            </ul>
            <Link href="/faq#confidence" className="mt-2 inline-block text-[10px] font-semibold text-brand-700 dark:text-brand-300">
              {ar ? 'التفاصيل الكاملة ←' : 'Full explanation →'}
            </Link>
          </div>

          <div className="panel p-4">
            <h2 className="text-xs font-bold text-ink dark:text-white">
              {ar ? 'مواسم وتنبيهات' : 'Seasons & notices'}
            </h2>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              {ar
                ? 'خط الساحل الشمالي لمرسى مطروح يعمل صيفًا فقط (1 يونيو – 30 سبتمبر). الرحلات الإضافية في الأعياد تُنشر كتعديلات منفصلة.'
                : 'The North Coast line to Marsa Matrouh runs in summer only (1 June – 30 September). Holiday extra runs appear as separate published changes.'}
            </p>
            <Link href="/status" className="mt-2 inline-block text-[10px] font-semibold text-brand-700 dark:text-brand-300">
              {ar ? 'حالة الشبكة اليوم ←' : 'Network status today →'}
            </Link>
          </div>

          {popularRoutes.slice(0, 3).length > 0 ? (
            <div className="panel p-4">
              <h2 className="text-xs font-bold text-ink dark:text-white">
                {ar ? 'مسارات شائعة' : 'Popular routes'}
              </h2>
              <ul className="mt-2 space-y-1.5">
                {popularRoutes.slice(0, 3).map((route) => (
                  <li key={`${route.from.id}-${route.to.id}`}>
                    <Link
                      href={routePairPath(route.from.id, route.to.id)}
                      className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-[11px] text-slate-600 transition hover:bg-slate-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                      <span className="truncate">
                        {ar ? route.from.nameAr : route.from.nameEn} →{' '}
                        {ar ? route.to.nameAr : route.to.nameEn}
                      </span>
                      {ar ? (
                        <svg className="h-3 w-3 shrink-0 opacity-40" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M19 12H5m6-6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <ArrowRight className="h-3 w-3 shrink-0 opacity-40" aria-hidden />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}
