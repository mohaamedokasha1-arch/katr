import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CalendarRange,
  CornerDownLeft,
  Info,
  MapPin,
  Route as RouteIcon,
  Snowflake,
  TrainFront,
} from 'lucide-react';
import type { FaqItem } from '@/types/rail';
import { getLocale } from '@/lib/locale';
import { buildMetadata, breadcrumbJsonLd, faqJsonLd } from '@/lib/seo';
import { getLineBySlug } from '@/lib/data/lines';
import { SERVICES } from '@/lib/data/services';
import { STATION_MAP } from '@/lib/data/stations';
import { LINE_MAP } from '@/lib/data/lines';
import { TRAIN_CLASS_MAP } from '@/lib/data/train-classes';
import { getTripStatus } from '@/lib/live';
import { getRunDecision, nextOperatingDates, serviceTitle } from '@/lib/schedule';
import { getPublishedOverrides } from '@/lib/store';
import {
  classLabel,
  countLabel,
  formatDuration,
  formatFare,
  tierLabel,
} from '@/lib/display';
import { formatClock, formatDateFull, formatSeason, isDateInSeason, todayCairo } from '@/lib/time';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { TrainClassIcon } from '@/components/ui/TrainClassIcon';
import { buttonClasses } from '@/components/ui/Button';
import { routePairPath } from '@/lib/data/station-slugs';
import { EmptyState } from '@/components/ui/EmptyState';
import { LiveRefresher } from '@/components/trip/LiveBits';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const line = getLineBySlug(slug);
  const ar = locale === 'ar';
  if (!line) {
    return buildMetadata({
      locale,
      title: ar ? 'خط غير موجود' : 'Line not found',
      description: '',
      path: `/line/${slug}`,
      noindex: true,
    });
  }
  const services = SERVICES.filter((service) => service.lineId === line.id);
  return buildMetadata({
    locale,
    title: ar ? `مواعيد قطارات ${line.nameAr}` : `${line.nameEn} train times`,
    description: ar
      ? `كل مواعيد قطارات ${line.nameAr}: ${services.length} رحلة مجدولة، المحطات على الخط، المدة، الدرجات، والأسعار التقديرية.`
      : `Every service on the ${line.nameEn} corridor: ${services.length} scheduled trains, stations, durations, classes and estimated fares.`,
    path: `/line/${line.slug}`,
  });
}

function nextSeasonStartDate(season: { startMonth: number; startDay: number }, today: string): string {
  const year = Number(today.slice(0, 4));
  const candidate = `${year}-${String(season.startMonth).padStart(2, '0')}-${String(season.startDay).padStart(2, '0')}`;
  if (candidate > today) return candidate;
  return `${year + 1}-${String(season.startMonth).padStart(2, '0')}-${String(season.startDay).padStart(2, '0')}`;
}

export default async function LinePage({ params }: { params: Params }) {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const { slug } = await params;
  const line = getLineBySlug(slug);
  if (!line) notFound();

  const today = todayCairo();
  const overrides = getPublishedOverrides();
  const services = SERVICES.filter((service) => service.lineId === line.id);
  const stations = line.stationIds.map((id) => STATION_MAP[id]).filter(Boolean);

  const rows = services
    .map((service) => {
      const decision = getRunDecision(service, today, overrides);
      if (!decision.runs) return null;
      const { status, confidence } = getTripStatus({
        service,
        originDate: today,
        fromIndex: 0,
        toIndex: service.stops.length - 1,
        now: new Date(),
        overrides,
      });
      const origin = STATION_MAP[service.stops[0].stationId];
      const destination = STATION_MAP[service.stops[service.stops.length - 1].stationId];
      const arrival = service.stops[service.stops.length - 1].arrivalOffset ?? 0;
      return {
        service,
        status,
        confidence,
        origin,
        destination,
        depart: service.departureMinutes,
        arrive: service.departureMinutes + arrival,
        duration: arrival - service.stops[0].departureOffset,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.depart - b.depart);

  const seasonOff = line.seasonal && line.season ? !isDateInSeason(today, line.season) : false;
  const activeSeasonNote = line.season ? formatSeason(line.season, locale) : null;
  const nextSeason = line.season ? nextSeasonStartDate(line.season, today) : null;
  const durations = rows.map((row) => row.duration);
  const minDuration = durations.length ? Math.min(...durations) : null;
  const maxDuration = durations.length ? Math.max(...durations) : null;

  const majorStations = stations.filter((station) => station.tier <= 2);
  const routePairs: Array<{ fromId: string; toId: string }> = [];
  for (let i = 0; i < majorStations.length && routePairs.length < 12; i += 1) {
    for (let j = i + 1; j < majorStations.length && routePairs.length < 12; j += 1) {
      routePairs.push({ fromId: majorStations[i].id, toId: majorStations[j].id });
    }
  }

  const faqItems: FaqItem[] = [
    {
      id: `${line.id}-count`,
      category: 'search',
      qAr: `كم عدد القطارات على ${line.nameAr} اليوم؟`,
      qEn: `How many trains run on ${line.nameEn} today?`,
      aAr: `اليوم ${rows.length} رحلة مجدولة على الخط بحسب آخر جدول منشور، وقد تتغير حسب التعديلات الموسمية أو التشغيلية.`,
      aEn: `There are ${rows.length} scheduled services on the line today according to the latest published timetable, subject to seasonal or operational changes.`,
    },
    {
      id: `${line.id}-duration`,
      category: 'search',
      qAr: 'كم تستغرق الرحلة على الخط؟',
      qEn: 'How long does the journey take?',
      aAr:
        minDuration !== null && maxDuration !== null
          ? `تتراوح مدة الرحلة اليوم بين ${formatDuration(minDuration, 'ar')} و${formatDuration(maxDuration, 'ar')} حسب القطار وعدد توقفاته.`
          : 'تختلف المدة حسب القطار وعدد التوقفات.',
      aEn:
        minDuration !== null && maxDuration !== null
          ? `Journeys today range from ${formatDuration(minDuration, 'en')} to ${formatDuration(maxDuration, 'en')}, depending on the train and its stops.`
          : 'Duration varies by train and number of stops.',
    },
    {
      id: `${line.id}-season`,
      category: 'search',
      qAr: line.seasonal ? 'هل الخط موسمي؟' : 'هل يعمل الخط طوال العام؟',
      qEn: line.seasonal ? 'Is this line seasonal?' : 'Does this line run year-round?',
      aAr: line.seasonal
        ? `نعم، الخط موسمي ويعمل من ${activeSeasonNote ?? ''}. خارج الموسم لا توجد رحلات منتظمة.`
        : 'الخط يعمل طوال العام، مع تعديلات منشورة في الأعياد والصيانة.',
      aEn: line.seasonal
        ? `Yes. The line operates seasonally from ${activeSeasonNote ?? ''}. Outside the season there are no regular trips.`
        : 'The line runs year-round, with published changes for holidays and maintenance.',
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: ar ? 'الرئيسية' : 'Home', path: '/' },
            { name: ar ? 'الخطوط' : 'Lines', path: '/lines' },
            { name: ar ? line.nameAr : line.nameEn, path: `/line/${line.slug}` },
          ]),
          faqJsonLd(faqItems, locale),
        ]}
      />
      <div className="relative overflow-hidden border-b border-white/10 bg-[#051838] text-white">
        <div className="pointer-events-none absolute inset-0 hero-glow opacity-80" aria-hidden />
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-40" aria-hidden />
        <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: line.color }} aria-hidden />
        <div className="page-shell relative py-8 sm:py-10">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-brand-200/70">
            <Link href="/" className="hover:text-white">
              {ar ? 'الرئيسية' : 'Home'}
            </Link>
            <span>/</span>
            <Link href="/lines" className="hover:text-white">
              {ar ? 'الخطوط' : 'Lines'}
            </Link>
            <span>/</span>
            <span className="text-white">{ar ? line.shortAr : line.shortEn}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-white"
                  style={{ backgroundColor: line.color }}
                >
                  <RouteIcon className="h-3 w-3" aria-hidden />
                  {ar ? line.regionAr : line.regionEn}
                </span>
                {line.seasonal ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-sky-300/30 bg-sky-400/10 px-2 py-1 text-[10px] font-semibold text-sky-200">
                    <Snowflake className="h-3 w-3" aria-hidden />
                    {ar ? `موسمي · ${activeSeasonNote}` : `Seasonal · ${activeSeasonNote}`}
                  </span>
                ) : (
                  <span className="rounded-md border border-white/15 px-2 py-1 text-[10px] font-semibold text-brand-100/80">
                    {ar ? 'يعمل طوال العام' : 'Year-round'}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                {ar ? line.nameAr : line.nameEn}
              </h1>
              <p className="mt-2 text-sm leading-7 text-brand-100/75">
                {ar ? line.descriptionAr : line.descriptionEn}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-brand-200/70">
                <span className="num inline-flex items-center gap-1">
                  <TrainFront className="h-3 w-3" aria-hidden />
                  {rows.length} {ar ? 'رحلة اليوم' : 'services today'}
                </span>
                <span className="num inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {line.stationIds.length} {ar ? 'محطة' : 'stations'}
                </span>
                {minDuration !== null && maxDuration !== null ? (
                  <span className="num inline-flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" aria-hidden />
                    {formatDuration(minDuration, locale)} – {formatDuration(maxDuration, locale)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <LiveRefresher locale={locale} intervalMs={60_000} onDark />
              <Link
                href={`/board?station=${line.stationIds[0]}`}
                className={buttonClasses({
                  size: 'sm',
                  variant: 'secondary',
                  className: 'border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white',
                })}
              >
                {ar ? 'لوحة المحطة' : 'Station board'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="page-shell py-6">
        {seasonOff && line.season ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-400/20 dark:bg-sky-500/10">
            <div className="flex items-start gap-2">
              <Snowflake className="mt-0.5 h-4 w-4 text-sky-600 dark:text-sky-300" aria-hidden />
              <div>
                <p className="text-xs font-bold text-sky-900 dark:text-sky-100">
                  {ar ? 'الخط خارج الموسم حاليًا' : 'The line is currently out of season'}
                </p>
                <p className="mt-0.5 text-[11px] leading-5 text-sky-800/70 dark:text-sky-200/70">
                  {ar
                    ? `يعمل الخط من ${activeSeasonNote}. أول موعد متوقع للموسم القادم: ${nextSeason}.`
                    : `The line operates ${activeSeasonNote}. The next season is expected to start on ${nextSeason}.`}
                </p>
              </div>
            </div>
            {nextSeason ? (
              <Link
                href={`/search?from=${line.stationIds[0]}&to=${line.stationIds[line.stationIds.length - 1]}&date=${nextSeason}`}
                className={buttonClasses({ size: 'sm', variant: 'secondary' })}
              >
                {ar ? 'جرّب أول يوم في الموسم' : 'Try the season opener'}
              </Link>
            ) : null}
          </div>
        ) : null}

        <section className="panel p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ink dark:text-white">
              {ar ? 'محطات الخط بالترتيب' : 'Stations in order'}
            </h2>
            <span className="text-[10px] text-slate-400">
              {ar ? 'اضغط على أي محطة لعرض صفحتها ولوحة حركتها' : 'Tap any station for its page and live board'}
            </span>
          </div>
          <div className="mt-4 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex min-w-max items-start">
              {stations.map((station, index) => (
                <div key={station.id} className="flex items-start">
                  <Link
                    href={`/station/${station.id}`}
                    className="group flex w-[106px] flex-col items-center text-center"
                  >
                    <span
                      className="flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white dark:bg-night-800"
                      style={{ borderColor: line.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: line.color }} />
                    </span>
                    <span className="mt-2 text-[10px] font-semibold leading-4 text-slate-600 transition group-hover:text-brand-700 dark:text-slate-300">
                      {ar ? station.nameAr : station.nameEn}
                    </span>
                    <span className="num text-[8px] text-slate-400">{station.code}</span>
                  </Link>
                  {index < stations.length - 1 ? (
                    <span
                      className="mt-1.5 h-0.5 w-8 shrink-0 rounded-full opacity-50"
                      style={{ backgroundColor: line.color }}
                      aria-hidden
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-white">
                {ar ? 'مواعيد اليوم على الخط' : 'Today’s timetable'}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {formatDateFull(today, locale)} · {ar ? 'توقيت القاهرة' : 'Cairo time'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm dark:bg-white/10 dark:text-slate-300">
              <Info className="h-3 w-3" aria-hidden />
              {ar ? 'الأوقات تقديرية — راجع لوحة المحطة' : 'Estimated times — check the station board'}
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={<CalendarRange className="h-6 w-6" aria-hidden />}
                title={ar ? 'لا توجد رحلات اليوم' : 'No services today'}
                description={
                  line.seasonal
                    ? ar
                      ? 'الخط موسمي ولا يعمل اليوم. جرّب تاريخًا داخل الموسم.'
                      : 'This is a seasonal line and is not running today. Try a date within the season.'
                    : ar
                      ? 'لا توجد رحلات منشورة في هذا اليوم. راجع صفحة الخط في تاريخ آخر.'
                      : 'No published services on this day. Check the line on another date.'
                }
              >
                {line.season && nextSeason ? (
                  <Link
                    href={`/search?from=${line.stationIds[0]}&to=${line.stationIds[line.stationIds.length - 1]}&date=${nextSeason}`}
                    className={buttonClasses({ size: 'sm' })}
                  >
                    {ar ? 'أول يوم في الموسم' : 'Season opener'}
                  </Link>
                ) : null}
                <Link href="/search" className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
                  {ar ? 'ابحث في تاريخ آخر' : 'Search another date'}
                </Link>
              </EmptyState>
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-night-800">
              <div className="hidden grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 md:grid dark:border-white/10 dark:bg-white/[0.03]">
                <span>{ar ? 'القطار' : 'Train'}</span>
                <span>{ar ? 'المسار' : 'Route'}</span>
                <span>{ar ? 'التحرك / الوصول' : 'Depart / arrive'}</span>
                <span>{ar ? 'المدة' : 'Duration'}</span>
                <span className="text-end">{ar ? 'الحالة والثقة' : 'Status & confidence'}</span>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-white/5">
                {rows.map((row) => (
                  <li key={row.service.number}>
                    <Link
                      href={`/trip/${row.service.number}-${today}`}
                      className="grid gap-2 px-4 py-3 transition hover:bg-brand-50/40 md:grid-cols-[auto_1fr_auto_auto_auto] md:items-center md:gap-4 dark:hover:bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="num rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-brand-500">
                          {row.service.number}
                        </span>
                        <span className="md:hidden">
                          <StatusBadge locale={locale} kind={row.status.kind} delayMinutes={row.status.delayMinutes} />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink dark:text-white">
                          {ar ? serviceTitle(row.service, 'ar') : serviceTitle(row.service, 'en')}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          {ar ? row.origin.nameAr : row.origin.nameEn} →{' '}
                          {ar ? row.destination.nameAr : row.destination.nameEn}
                        </p>
                      </div>
                      <div className="num text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {formatClock(row.depart + row.status.delayMinutes)} →{' '}
                        {formatClock(row.arrive + row.status.delayMinutes)}
                      </div>
                      <div className="num text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDuration(row.duration, locale)}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <span className="hidden md:block">
                          <StatusBadge locale={locale} kind={row.status.kind} delayMinutes={row.status.delayMinutes} />
                        </span>
                        <ConfidenceBadge locale={locale} confidence={row.confidence} />
                      </div>
                      <div className="flex items-center gap-1 md:hidden">
                        {row.service.classes.slice(0, 4).map((classId) => (
                          <span key={classId} className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1 py-0.5 text-[8px] font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400">
                            <TrainClassIcon classId={classId} size={9} />
                            {ar ? TRAIN_CLASS_MAP[classId].shortAr : TRAIN_CLASS_MAP[classId].shortEn}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="panel p-5">
            <h2 className="text-sm font-bold text-ink dark:text-white">
              {ar ? 'مسارات مباشرة على الخط' : 'Direct route pages'}
            </h2>
            <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              {ar
                ? 'صفحات مخصصة لأشهر المسارات على هذا الخط، بمحتوى فريد وأسئلة شائعة لكل مسار.'
                : 'Dedicated pages for the busiest routes on this line, each with unique content and FAQs.'}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {routePairs.map((pair) => {
                const from = STATION_MAP[pair.fromId];
                const to = STATION_MAP[pair.toId];
                return (
                  <Link
                    key={`${pair.fromId}-${pair.toId}`}
                    href={routePairPath(pair.fromId, pair.toId)}
                    className="group flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:text-slate-300"
                  >
                    <span className="truncate">
                      {ar ? from.nameAr : from.nameEn} → {ar ? to.nameAr : to.nameEn}
                    </span>
                    {ar ? <ArrowLeft className="h-3 w-3 shrink-0 opacity-40" aria-hidden /> : <ArrowRight className="h-3 w-3 shrink-0 opacity-40" aria-hidden />}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink dark:text-white">
              <CornerDownLeft className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden />
              {ar ? 'أسئلة شائعة عن الخط' : 'Line FAQs'}
            </h2>
            <div className="mt-3 space-y-2">
              {faqItems.map((item) => (
                <details key={item.id} className="group rounded-xl border border-slate-200 p-3 open:bg-slate-50/50 dark:border-white/10 dark:open:bg-white/[0.03]">
                  <summary className="cursor-pointer list-none text-xs font-semibold text-ink dark:text-white">
                    {ar ? item.qAr : item.qEn}
                  </summary>
                  <p className="mt-2 text-[11px] leading-6 text-slate-500 dark:text-slate-400">
                    {ar ? item.aAr : item.aEn}
                  </p>
                </details>
              ))}
            </div>
            <Link href="/faq" className="mt-3 inline-block text-[10px] font-semibold text-brand-700 dark:text-brand-300">
              {ar ? 'كل الأسئلة الشائعة ←' : 'All FAQs →'}
            </Link>
          </section>
        </div>

        <section className="panel mt-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-ink dark:text-white">
                {ar ? 'محطات رئيسية على الخط' : 'Key stations on the line'}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stations.map((station) => (
                  <Link
                    key={station.id}
                    href={`/station/${station.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:text-slate-400"
                    title={tierLabel(locale, station.tier)}
                  >
                    {ar ? station.nameAr : station.nameEn}
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/stations" className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
              {ar ? 'دليل المحطات' : 'Station directory'}
            </Link>
          </div>
          <p className="mt-3 text-[10px] leading-5 text-slate-400">
            {ar
              ? 'درجة الثقة تختلف من قطار لآخر على نفس الخط: بعضها مؤكد رسميًا، وبعضها جدول قياسي أو بيانات تحتاج إعادة تحقق.'
              : 'Confidence varies by service on the same line: some are officially verified, others are standard timetables or stale data.'}
          </p>
        </section>
      </div>
    </>
  );
}
