import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  CalendarDays,
  Clock3,
  Info,
  MapPin,
  Route as RouteIcon,
  Snowflake,
  TrainFront,
  Wallet,
} from 'lucide-react';
import type { FaqItem, TrainClassId } from '@/types/rail';
import { getLocale } from '@/lib/locale';
import { buildMetadata, breadcrumbJsonLd, faqJsonLd } from '@/lib/seo';
import { parseRoutePair, routePairPath } from '@/lib/data/station-slugs';
import { STATION_MAP } from '@/lib/data/stations';
import { LINE_MAP } from '@/lib/data/lines';
import { TRAIN_CLASS_IDS, TRAIN_CLASS_MAP } from '@/lib/data/train-classes';
import { getAllRoutePairs, searchTrips, summariseTrips } from '@/lib/search';
import {
  countLabel,
  formatDuration,
  formatFare,
  formatFareRange,
} from '@/lib/display';
import {
  formatDateFull,
  formatClock,
  todayCairo,
  isValidDateString,
  isDateInSeason,
} from '@/lib/time';
import { PageHeader } from '@/components/layout/PageHeader';
import { ResultsSection } from '@/components/search/ResultsSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { TrainClassIcon } from '@/components/ui/TrainClassIcon';
import { buttonClasses } from '@/components/ui/Button';
import { LiveRefresher } from '@/components/trip/LiveBits';

export const dynamic = 'force-dynamic';

type Params = Promise<{ pair: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { pair } = await params;
  const parsed = parseRoutePair(pair);
  const ar = locale === 'ar';
  if (!parsed) {
    return buildMetadata({
      locale,
      title: ar ? 'مسار غير موجود' : 'Route not found',
      description: '',
      path: `/route/${pair}`,
      noindex: true,
    });
  }
  const from = STATION_MAP[parsed.fromId];
  const to = STATION_MAP[parsed.toId];
  const response = searchTrips({
    from: from.id,
    to: to.id,
    date: todayCairo(),
    sort: 'departure',
  });
  const summary = summariseTrips(response.trips);
  const everServed = getAllRoutePairs().some(
    (item) => item.fromId === from.id && item.toId === to.id,
  );
  return buildMetadata({
    locale,
    title: ar
      ? `مواعيد قطارات ${from.nameAr} إلى ${to.nameAr}`
      : `${from.nameEn} to ${to.nameEn} train times`,
    description: ar
      ? `كل مواعيد القطارات من ${from.nameAr} إلى ${to.nameAr}: ${summary?.tripCount ?? 0} رحلة اليوم، المدة من ${summary ? formatDuration(summary.minDurationMinutes, 'ar') : '—'}، والأسعار التقديرية لكل درجة.`
      : `Every train from ${from.nameEn} to ${to.nameEn}: ${summary?.tripCount ?? 0} services today, journeys from ${summary ? formatDuration(summary.minDurationMinutes, 'en') : '—'}, and estimated fares by class.`,
    path: `/route/${pair}`,
    noindex: !everServed,
  });
}

export default async function RoutePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const { pair } = await params;
  const query = await searchParams;
  const parsed = parseRoutePair(pair);
  if (!parsed) notFound();

  const from = STATION_MAP[parsed.fromId];
  const to = STATION_MAP[parsed.toId];
  if (!from || !to) notFound();

  const today = todayCairo();
  const rawDate = first(query.date);
  const date = rawDate && isValidDateString(rawDate) ? rawDate : today;
  const direct = first(query.direct) === '1';
  const sortRaw = first(query.sort);
  const sort =
    sortRaw === 'arrival' || sortRaw === 'duration' || sortRaw === 'price'
      ? sortRaw
      : 'departure';
  const classes = (first(query.classes) ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is TrainClassId => (TRAIN_CLASS_IDS as string[]).includes(item));
  const beforeRaw = Number(first(query.before) ?? '');
  const before = Number.isFinite(beforeRaw) && beforeRaw > 0 && beforeRaw < 1440 ? beforeRaw : undefined;
  const maxFareRaw = Number(first(query.maxFare) ?? '');
  const maxFare =
    Number.isFinite(maxFareRaw) && maxFareRaw > 0 && maxFareRaw <= 3000 ? maxFareRaw : undefined;

  const response = searchTrips({
    from: from.id,
    to: to.id,
    date,
    directOnly: direct,
    classes,
    sort,
  });
  const summary = summariseTrips(response.trips);
  const sharedLineIds = from.lineIds.filter((lineId) => to.lineIds.includes(lineId));
  const accent = LINE_MAP[sharedLineIds[0]]?.color ?? '#1565C0';
  const seasonalOff = sharedLineIds.some((lineId) => {
    const line = LINE_MAP[lineId];
    return Boolean(line?.seasonal && line.season && !isDateInSeason(date, line.season));
  });
  const seasonalLine = sharedLineIds.map((id) => LINE_MAP[id]).find((line) => line?.seasonal);
  const lineForLink = LINE_MAP[sharedLineIds[0]];
  const classesSeen = Array.from(new Set(response.trips.flatMap((trip) => trip.classes)));

  const faqItems: FaqItem[] = [
    {
      id: `${pair}-first`,
      category: 'search',
      qAr: `إمتى أول قطار من ${from.nameAr} إلى ${to.nameAr}؟`,
      qEn: `When is the first train from ${from.nameEn} to ${to.nameEn}?`,
      aAr: summary
        ? `أول رحلة في ${formatDateFull(date, 'ar')} تتحرك الساعة ${formatClock(summary.firstDepartureMinutes)} بتوقيت القاهرة حسب آخر جدول منشور.`
        : 'لا توجد رحلات منشورة في هذا اليوم.',
      aEn: summary
        ? `The first service on ${formatDateFull(date, 'en')} departs at ${formatClock(summary.firstDepartureMinutes)} Cairo time according to the latest published timetable.`
        : 'No published services on this date.',
    },
    {
      id: `${pair}-last`,
      category: 'search',
      qAr: 'وآخر قطار؟',
      qEn: 'And the last train?',
      aAr: summary
        ? `آخر رحلة تتحرك الساعة ${formatClock(summary.lastDepartureMinutes)}، وتصل بعد ${formatDuration(summary.maxDurationMinutes, 'ar')} تقريبًا.`
        : 'الجدول يتغير حسب اليوم، راجع التواريخ القريبة.',
      aEn: summary
        ? `The last service departs at ${formatClock(summary.lastDepartureMinutes)} and arrives in about ${formatDuration(summary.maxDurationMinutes, 'en')}.`
        : 'Timetables vary by day; check nearby dates.',
    },
    {
      id: `${pair}-price`,
      category: 'booking',
      qAr: 'كام سعر التذكرة؟',
      qEn: 'How much is the ticket?',
      aAr:
        summary && summary.minFare !== null && summary.maxFare !== null
          ? `نطاق السعر التقديري اليوم ${formatFareRange(summary.minFare, summary.maxFare, 'ar')} لكل الدرجات. السعر النهائي يُحدد عند الحجز الرسمي.`
          : 'السعر يختلف حسب الدرجة والتاريخ، ويُحدد عند الحجز الرسمي.',
      aEn:
        summary && summary.minFare !== null && summary.maxFare !== null
          ? `Today’s estimated range is ${formatFareRange(summary.minFare, summary.maxFare, 'en')} across classes. The final fare is set at official booking.`
          : 'Fares vary by class and date and are confirmed at official booking.',
    },
    {
      id: `${pair}-direct`,
      category: 'search',
      qAr: 'هل فيه قطارات مباشرة؟',
      qEn: 'Are there direct trains?',
      aAr: response.trips.some((trip) => trip.isDirect)
        ? 'نعم، توجد رحلات مباشرة بدون توقف بين المحطتين. استخدم فلتر "مباشر فقط" لعرضها وحدها.'
        : 'أغلب الرحلات تتوقف في محطات وسط الطريق. استخدم فلتر الدرجة للمقارنة بين الخيارات.',
      aEn: response.trips.some((trip) => trip.isDirect)
        ? 'Yes, there are direct trips with no stops between the two stations. Use the “direct only” filter to see them alone.'
        : 'Most trips stop at intermediate stations. Use the class filter to compare options.',
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: ar ? 'الرئيسية' : 'Home', path: '/' },
            { name: ar ? 'المسارات' : 'Routes', path: '/lines' },
            { name: ar ? `${from.nameAr} → ${to.nameAr}` : `${from.nameEn} → ${to.nameEn}`, path: `/route/${pair}` },
          ]),
          faqJsonLd(faqItems, locale),
        ]}
      />
      <PageHeader
        locale={locale}
        tone="dark"
        eyebrow={ar ? 'مسار مباشر' : 'Direct route'}
        title={ar ? `${from.nameAr} إلى ${to.nameAr}` : `${from.nameEn} to ${to.nameEn}`}
        description={
          ar
            ? `مواعيد القطارات وأسعارها التقديرية ومدة الرحلة على مسار ${from.nameAr} – ${to.nameAr}. المعروض مباشر من جدول اليوم مع درجة ثقة لكل رحلة.`
            : `Train times, estimated fares and journey durations from ${from.nameEn} to ${to.nameEn}, straight from today’s timetable with a confidence level per trip.`
        }
        breadcrumbs={[
          { label: ar ? 'الخطوط' : 'Lines', href: '/lines' },
          { label: ar ? `${from.nameAr} → ${to.nameAr}` : `${from.nameEn} → ${to.nameEn}` },
        ]}
        accentColor={accent}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold">
              <CalendarDays className="h-3 w-3" aria-hidden />
              {formatDateFull(date, locale)}
            </span>
            {summary ? (
              <>
                <span className="num inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold">
                  <TrainFront className="h-3 w-3" aria-hidden />
                  {countLabel(summary.tripCount, locale, 'trips')}
                </span>
                <span className="num inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold">
                  <Clock3 className="h-3 w-3" aria-hidden />
                  {formatDuration(summary.minDurationMinutes, locale)} – {formatDuration(summary.maxDurationMinutes, locale)}
                </span>
                <span className="num inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {summary.distanceKm} km
                </span>
              </>
            ) : null}
            <LiveRefresher locale={locale} intervalMs={60_000} onDark />
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={routePairPath(to.id, from.id)}
            className={buttonClasses({
              size: 'sm',
              variant: 'secondary',
              className: 'border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white',
            })}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
            {ar ? 'اعكس المسار' : 'Reverse route'}
          </Link>
          {lineForLink ? (
            <Link
              href={`/line/${lineForLink.slug}`}
              className={buttonClasses({
                size: 'sm',
                variant: 'secondary',
                className: 'border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white',
              })}
            >
              <RouteIcon className="h-3.5 w-3.5" aria-hidden />
              {ar ? 'صفحة الخط' : 'Line page'}
            </Link>
          ) : null}
        </div>
      </PageHeader>

      <div className="page-shell py-6">
        {seasonalOff && seasonalLine ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-400/20 dark:bg-sky-500/10">
            <div className="flex items-start gap-2">
              <Snowflake className="mt-0.5 h-4 w-4 text-sky-600 dark:text-sky-300" aria-hidden />
              <div>
                <p className="text-xs font-bold text-sky-900 dark:text-sky-100">
                  {ar ? 'مسار موسمي خارج التشغيل' : 'This seasonal route is out of season'}
                </p>
                <p className="mt-0.5 text-[11px] leading-5 text-sky-800/70 dark:text-sky-200/70">
                  {ar
                    ? 'خط الساحل الشمالي يعمل صيفًا فقط. النتائج أدناه ستكون فارغة، وجرّب تاريخًا داخل الموسم.'
                    : 'The North Coast line runs in summer only. Results may be empty; try a date within the season.'}
                </p>
              </div>
            </div>
            <Link href={`/line/${seasonalLine.slug}`} className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
              {ar ? 'تفاصيل الموسم' : 'Season details'}
            </Link>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1fr_288px]">
          <ResultsSection
            locale={locale}
            basePath={`/route/${pair}`}
            query={{
              from: from.id,
              to: to.id,
              date,
              direct,
              classes,
              sort,
              before,
              maxFare,
            }}
            isToday={date === today}
          />

          <aside className="space-y-3">
            <div className="panel p-4">
              <h2 className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
                <RouteIcon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" aria-hidden />
                {ar ? 'ملخص المسار' : 'Route summary'}
              </h2>
              <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                {ar
                  ? `المسافة التقريبية ${summary?.distanceKm ?? '—'} كم. ${response.trips.length} رحلة في ${formatDateFull(date, locale)}.`
                  : `Approximate distance ${summary?.distanceKm ?? '—'} km. ${response.trips.length} services on ${formatDateFull(date, locale)}.`}
              </p>
              <dl className="mt-3 space-y-1.5 text-[11px]">
                {summary ? (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-400">{ar ? 'أول تحرك' : 'First departure'}</dt>
                      <dd className="num font-semibold text-ink dark:text-white">
                        {formatClock(summary.firstDepartureMinutes)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-400">{ar ? 'آخر تحرك' : 'Last departure'}</dt>
                      <dd className="num font-semibold text-ink dark:text-white">
                        {formatClock(summary.lastDepartureMinutes)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-400">{ar ? 'أقصر مدة' : 'Shortest'}</dt>
                      <dd className="num font-semibold text-ink dark:text-white">
                        {formatDuration(summary.minDurationMinutes, locale)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-400">{ar ? 'أقل سعر' : 'Lowest fare'}</dt>
                      <dd className="num font-semibold text-ink dark:text-white">
                        {summary.minFare !== null ? formatFare(summary.minFare, locale) : '—'}
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </div>

            {classesSeen.length > 0 ? (
              <div className="panel p-4">
                <h2 className="text-xs font-bold text-ink dark:text-white">
                  {ar ? 'الدرجات على هذا المسار' : 'Classes on this route'}
                </h2>
                <div className="mt-2 flex flex-wrap gap-1">
                  {classesSeen.map((classId) => (
                    <span
                      key={classId}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-1.5 py-1 text-[10px] font-medium text-slate-500 dark:border-white/10 dark:text-slate-400"
                    >
                      <TrainClassIcon classId={classId} size={12} />
                      {ar ? TRAIN_CLASS_MAP[classId].shortAr : TRAIN_CLASS_MAP[classId].shortEn}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="panel p-4">
              <h2 className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
                <Info className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                {ar ? 'روابط سريعة' : 'Quick links'}
              </h2>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link href={`/station/${from.id}`} className="flex items-center justify-between rounded-lg px-1.5 py-1 text-[11px] text-slate-600 transition hover:bg-slate-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-white/5">
                    <span>{ar ? `محطة ${from.nameAr}` : `${from.nameEn} station`}</span>
                    {ar ? <ArrowLeft className="h-3 w-3 opacity-40" /> : <ArrowRight className="h-3 w-3 opacity-40" />}
                  </Link>
                </li>
                <li>
                  <Link href={`/station/${to.id}`} className="flex items-center justify-between rounded-lg px-1.5 py-1 text-[11px] text-slate-600 transition hover:bg-slate-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-white/5">
                    <span>{ar ? `محطة ${to.nameAr}` : `${to.nameEn} station`}</span>
                    {ar ? <ArrowLeft className="h-3 w-3 opacity-40" /> : <ArrowRight className="h-3 w-3 opacity-40" />}
                  </Link>
                </li>
                {lineForLink ? (
                  <li>
                    <Link href={`/line/${lineForLink.slug}`} className="flex items-center justify-between rounded-lg px-1.5 py-1 text-[11px] text-slate-600 transition hover:bg-slate-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-white/5">
                      <span>{ar ? lineForLink.nameAr : lineForLink.nameEn}</span>
                      {ar ? <ArrowLeft className="h-3 w-3 opacity-40" /> : <ArrowRight className="h-3 w-3 opacity-40" />}
                    </Link>
                  </li>
                ) : null}
                <li>
                  <Link href={`/search?from=${from.id}&to=${to.id}&date=${date}`} className="flex items-center justify-between rounded-lg px-1.5 py-1 text-[11px] text-slate-600 transition hover:bg-slate-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-white/5">
                    <span>{ar ? 'البحث المتقدم' : 'Advanced search'}</span>
                    {ar ? <ArrowLeft className="h-3 w-3 opacity-40" /> : <ArrowRight className="h-3 w-3 opacity-40" />}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[10px] leading-5 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
              <Wallet className="mb-1 inline h-3.5 w-3.5" aria-hidden />
              {ar
                ? 'الأسعار المعروضة تقديرية وليست عرضًا للبيع. راكب لا يبيع تذاكر.'
                : 'Displayed fares are estimates, not an offer of sale. Rakeb does not sell tickets.'}
            </div>
          </aside>
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="panel p-5">
            <h2 className="text-lg font-bold text-ink dark:text-white">
              {ar ? `عن مسار ${from.nameAr} – ${to.nameAr}` : `About ${from.nameEn} – ${to.nameEn}`}
            </h2>
            <div className="mt-3 space-y-3 text-[12px] leading-7 text-slate-600 dark:text-slate-300">
              <p>
                {ar
                  ? `المسافة التقريبية بين المحطتين ${summary?.distanceKm ?? '—'} كم، وتتوفر اليوم ${response.trips.length} رحلة مباشرة. تتراوح المدة بين ${summary ? formatDuration(summary.minDurationMinutes, 'ar') : '—'} و${summary ? formatDuration(summary.maxDurationMinutes, 'ar') : '—'} حسب نوع القطار وعدد التوقفات.`
                  : `The approximate distance is ${summary?.distanceKm ?? '—'} km, with ${response.trips.length} direct services today. Journeys range from ${summary ? formatDuration(summary.minDurationMinutes, 'en') : '—'} to ${summary ? formatDuration(summary.maxDurationMinutes, 'en') : '—'} depending on the train and its stops.`}
              </p>
              <p>
                {ar
                  ? `محطة الانطلاق ${from.nameAr} تخدمها ${from.lineIds.length} خطوط، ومحطة الوصول ${to.nameAr} تخدمها ${to.lineIds.length} خطوط. اضغط على أي محطة لمعرفة المرافق ولوحة الحركة المباشرة.`
                  : `${from.nameEn} is served by ${from.lineIds.length} lines and ${to.nameEn} by ${to.lineIds.length}. Open either station for facilities and its live board.`}
              </p>
              <p>
                {ar
                  ? 'الأوقات المعروضة بتوقيت القاهرة المحلي، وقد تتأخر الرحلة أو يتغير موعدها. درجة الثقة بجانب كل رحلة توضح هل البيانات رسمية، قياسية، مجتمعية، أم تحتاج تحققًا.'
                  : 'Times are Cairo local time and may be delayed or changed. The confidence badge on each trip shows whether data is official, standard, rider-confirmed or stale.'}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {classesSeen.map((classId) => (
                <span key={classId} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  {ar ? TRAIN_CLASS_MAP[classId].nameAr : TRAIN_CLASS_MAP[classId].nameEn}
                </span>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="text-sm font-bold text-ink dark:text-white">
              {ar ? 'أسئلة شائعة عن المسار' : 'Route FAQs'}
            </h2>
            <div className="mt-3 space-y-2">
              {faqItems.map((item) => (
                <details key={item.id} className="group rounded-xl border border-slate-200 p-3 dark:border-white/10">
                  <summary className="cursor-pointer list-none text-xs font-semibold text-ink dark:text-white">
                    {ar ? item.qAr : item.qEn}
                  </summary>
                  <p className="mt-2 text-[11px] leading-6 text-slate-500 dark:text-slate-400">
                    {ar ? item.aAr : item.aEn}
                  </p>
                </details>
              ))}
            </div>
            <button
              type="button"
              disabled
              className="mt-3 w-full rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-semibold text-slate-400 dark:bg-white/5"
              title={ar ? 'الأسعار تقديرية ولا تُباع التذاكر هنا' : 'Fares are estimates; tickets are not sold here'}
            >
              {ar ? 'راكب لا يبيع تذاكر — احجز من القنوات الرسمية' : 'Rakeb does not sell tickets — book officially'}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
