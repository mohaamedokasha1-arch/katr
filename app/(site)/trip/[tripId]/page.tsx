import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  CalendarClock,
  Clock3,
  Compass,
  Info,
  MapPin,
  Route as RouteIcon,
  Sparkles,
  TrainFront,
  TriangleAlert,
} from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata, breadcrumbJsonLd, tripJsonLd } from '@/lib/seo';
import {
  getTripById,
  searchTrips,
} from '@/lib/search';
import { getService, SERVICES } from '@/lib/data/services';
import { LINE_MAP } from '@/lib/data/lines';
import {
  getActiveOverrides,
  getRunDecision,
  nextOperatingDates,
  seasonStatus,
  serviceTitle,
} from '@/lib/schedule';
import { getConsensus } from '@/lib/reports';
import { getPublishedOverrides } from '@/lib/store';
import { getTripStatus } from '@/lib/live';
import {
  dataSourceLabel,
  formatDuration,
  formatFareRange,
  classLabel,
  countLabel,
  featureLabel,
} from '@/lib/display';
import { addDays, formatDateFull, formatDateMedium, formatClock, toIso, todayCairo } from '@/lib/time';
import { JsonLd } from '@/components/seo/JsonLd';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { buttonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Timeline } from '@/components/trip/Timeline';
import { FareTable } from '@/components/trip/FareTable';
import { OFFICIAL_BOOKING_URL } from '@/lib/data/sources';
import { ConfidenceExplainer } from '@/components/trip/ConfidenceExplainer';
import { ReportPanel } from '@/components/trip/ReportPanel';
import { DepartureCountdown, LastUpdated, LiveRefresher } from '@/components/trip/LiveBits';
import { TripActionsRow } from '@/components/trip/TripActions';
import { tripToItinerary, tripToSnapshot } from '@/lib/client-storage';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Params = Promise<{ tripId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { tripId } = await params;
  const query = await searchParams;
  const match = /^(\d{3,4})-(\d{4}-\d{2}-\d{2})$/.exec(tripId);
  const ar = locale === 'ar';
  if (!match) {
    return buildMetadata({
      locale,
      title: ar ? 'رحلة غير موجودة' : 'Trip not found',
      description: '',
      path: `/trip/${tripId}`,
      noindex: true,
    });
  }
  const service = getService(match[1]);
  if (!service) {
    return buildMetadata({
      locale,
      title: ar ? 'رحلة غير موجودة' : 'Trip not found',
      description: '',
      path: `/trip/${tripId}`,
      noindex: true,
    });
  }
  const trip = getTripById(tripId, { fromId: first(query.from), toId: first(query.to) });
  if (!trip) {
    return buildMetadata({
      locale,
      title: ar ? `القطار ${service.number}` : `Train ${service.number}`,
      description: ar
        ? `القطار ${service.number} لا يعمل في هذا التاريخ. شوف التواريخ القادمة والتفاصيل.`
        : `Train ${service.number} does not operate on this date. See upcoming dates and details.`,
      path: `/trip/${tripId}`,
      noindex: true,
    });
  }
  return buildMetadata({
    locale,
    title: ar
      ? `قطار ${trip.serviceNumber} — ${trip.from.nameAr} إلى ${trip.to.nameAr}`
      : `Train ${trip.serviceNumber} — ${trip.from.nameEn} to ${trip.to.nameEn}`,
    description: ar
      ? `موعد قطار ${trip.serviceNumber} (${trip.titleAr}) من ${trip.from.nameAr} إلى ${trip.to.nameAr} يوم ${formatDateFull(trip.date, locale)}: التحرك ${formatClock(trip.departMinutes)}، الوصول ${formatClock(trip.arriveMinutes)}، المدة ${formatDuration(trip.durationMinutes, locale)}.`
      : `Train ${trip.serviceNumber} (${trip.titleEn}) from ${trip.from.nameEn} to ${trip.to.nameEn} on ${formatDateFull(trip.date, locale)}: departs ${formatClock(trip.departMinutes)}, arrives ${formatClock(trip.arriveMinutes)}, duration ${formatDuration(trip.durationMinutes, locale)}.`,
    path: `/trip/${tripId}`,
    noindex: true,
    type: 'article',
  });
}

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const { tripId } = await params;
  const query = await searchParams;
  const match = /^(\d{3,4})-(\d{4}-\d{2}-\d{2})$/.exec(tripId);
  if (!match) notFound();

  const [, number, date] = match;
  const service = getService(number);
  if (!service) notFound();

  const trip = getTripById(tripId, { fromId: first(query.from), toId: first(query.to) });
  const line = LINE_MAP[service.lineId];

  if (!trip) {
    const overrides = getPublishedOverrides();
    const nextDates = nextOperatingDates(service, addDays(date, 1), 3, overrides);
    const season = seasonStatus(service, date);
    const ar2 = ar;
    return (
      <>
        <PageHeader
          locale={locale}
          eyebrow={ar2 ? 'القطار غير متاح' : 'Service unavailable'}
          title={ar2 ? `القطار ${service.number} — ${serviceTitle(service, 'ar')}` : `Train ${service.number} — ${serviceTitle(service, 'en')}`}
          description={
            ar2
              ? `هذا القطار غير مدرج في تاريخ ${formatDateFull(date, locale)}. قد يكون خطًا موسميًا أو يعمل في أيام محددة فقط.`
              : `This service is not scheduled on ${formatDateFull(date, locale)}. It may be seasonal or operate only on selected days.`
          }
          breadcrumbs={[
            { label: ar2 ? 'الخطوط' : 'Lines', href: '/lines' },
            { label: ar2 ? line?.shortAr ?? '' : line?.shortEn ?? '', href: line ? `/line/${line.slug}` : '/lines' },
            { label: `#${service.number}` },
          ]}
          accentColor={line?.color}
        />
        <div className="page-shell py-8">
          <EmptyState
            icon={<CalendarClock className="h-6 w-6" aria-hidden />}
            title={
              season.state === 'before' || season.state === 'after'
                ? ar2
                  ? 'خط موسمي'
                  : 'Seasonal line'
                : ar2
                  ? 'لا تعمل في هذا اليوم'
                  : 'Does not run on this day'
            }
            description={
              season.state === 'before' || season.state === 'after'
                ? ar2
                  ? `خط مرسى مطروح يعمل من 1 يونيو حتى 30 سبتمبر. أول تاريخ متاح: ${season.nextStart ?? '—'}.`
                  : `The Marsa Matrouh line runs from 1 June to 30 September. Next available date: ${season.nextStart ?? '—'}.`
                : ar2
                  ? 'هذا القطار يعمل في أيام محددة. اختر أحد التواريخ القادمة أدناه.'
                  : 'This train operates on selected days. Pick one of the upcoming dates below.'
            }
          >
            {nextDates.map((nextDate) => (
              <Link
                key={nextDate}
                href={`/trip/${service.number}-${nextDate}`}
                className={buttonClasses({ size: 'sm', variant: 'secondary' })}
              >
                <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                {formatDateMedium(nextDate, locale)}
              </Link>
            ))}
            <Link href={`/line/${line?.slug ?? ''}`} className={buttonClasses({ size: 'sm' })}>
              {ar2 ? 'صفحة الخط' : 'Line page'}
            </Link>
          </EmptyState>
        </div>
      </>
    );
  }

  const consensus = getConsensus(trip.serviceNumber, trip.date);
  const overrides = getPublishedOverrides();
  const activeOverrides = getActiveOverrides(service, trip.date, overrides);
  const today = todayCairo();
  const snapshot = tripToSnapshot(trip);
  const itinerary = tripToItinerary(trip);
  const cancelled = trip.status.kind === 'cancelled';
  const delayed = trip.status.delayMinutes > 0;
  const targetIso = toIso(trip.date, trip.departMinutes + trip.status.delayMinutes);

  const segmentOptions = searchTrips(
    {
      from: trip.from.id,
      to: trip.to.id,
      date: trip.date,
      sort: 'departure',
    },
    new Date(),
  ).trips
    .filter((candidate) => candidate.tripId !== trip.tripId && candidate.status.kind !== 'cancelled')
    .slice(0, 3);

  const dateOptions = Array.from({ length: 7 }, (_, index) => addDays(trip.date, index - 2)).filter(
    (value) => getRunDecision(service, value, overrides).runs,
  );

  const otherServices = SERVICES.filter(
    (candidate) =>
      candidate.lineId === service.lineId &&
      candidate.number !== service.number &&
      candidate.stops.some((stop) => stop.stationId === trip.from.id) &&
      candidate.stops.some((stop) => stop.stationId === trip.to.id),
  ).slice(0, 4);

  return (
    <>
      <JsonLd
        data={[
          tripJsonLd(trip, locale),
          breadcrumbJsonLd([
            { name: ar ? 'الرئيسية' : 'Home', path: '/' },
            { name: ar ? 'الخطوط' : 'Lines', path: '/lines' },
            { name: ar ? line?.nameAr ?? '' : line?.nameEn ?? '', path: `/line/${line?.slug ?? ''}` },
            { name: `#${trip.serviceNumber} ${formatDateMedium(trip.date, locale)}`, path: `/trip/${trip.tripId}` },
          ]),
        ]}
      />
      <PageHeader
        locale={locale}
        tone="dark"
        eyebrow={ar ? 'تفاصيل الرحلة' : 'Trip details'}
        title={`${trip.serviceNumber} — ${ar ? trip.titleAr : trip.titleEn}`}
        description={`${ar ? trip.from.nameAr : trip.from.nameEn} ${ar ? 'إلى' : 'to'} ${ar ? trip.to.nameAr : trip.to.nameEn} · ${formatDateFull(trip.date, locale)}`}
        breadcrumbs={[
          { label: ar ? 'الخطوط' : 'Lines', href: '/lines' },
          { label: ar ? line?.shortAr ?? '' : line?.shortEn ?? '', href: `/line/${line?.slug ?? ''}` },
          { label: `#${trip.serviceNumber}` },
        ]}
        accentColor={line?.color}
        meta={
          <>
            <StatusBadge locale={locale} kind={trip.status.kind} delayMinutes={trip.status.delayMinutes} />
            <ConfidenceBadge locale={locale} confidence={trip.confidence} />
            {line ? (
              <Link
                href={`/line/${line.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-brand-100/80 transition hover:bg-white/10"
              >
                <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: line.color }} aria-hidden />
                {ar ? line.shortAr : line.shortEn}
              </Link>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-[10px] text-brand-200/60">
              <LiveRefresher locale={locale} intervalMs={45_000} onDark />
            </span>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/search?from=${trip.from.id}&to=${trip.to.id}&date=${trip.date}`}
            className={buttonClasses({
              size: 'sm',
              variant: 'secondary',
              className: 'border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white',
            })}
          >
            <TrainFront className="h-3.5 w-3.5" aria-hidden />
            {ar ? 'كل رحلات المسار' : 'All route trips'}
          </Link>
        </div>
      </PageHeader>

      <div className="page-shell grid gap-5 py-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink dark:text-white">
                <RouteIcon className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden />
                {ar ? 'مسار الرحلة والمحطات' : 'Route & stops'}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="num">{countLabel(trip.stops.length, locale, 'stops')}</span>
                <span aria-hidden>·</span>
                <span className="num">{trip.distanceKm} km</span>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <Timeline
                stops={trip.stops}
                locale={locale}
                color={line?.color ?? '#1565C0'}
              />
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-ink dark:text-white">
                {ar ? 'الدرجات والأسعار التقديرية' : 'Classes & estimated fares'}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                <Info className="h-2.5 w-2.5" aria-hidden />
                {ar ? 'يُرجى التأكيد عند الحجز' : 'Confirm at booking'}
              </span>
            </div>
            <div className="mt-3">
              <FareTable trip={trip} locale={locale} />
            </div>
            <p className="mt-2 text-[10px] leading-5 text-slate-400">
              {ar
                ? 'راكب لا يبيع تذاكر. الأسعار نطاقات تقديرية مبنية على المسافة والدرجة، وقد تختلف عن السعر الرسمي وقت الحجز.'
                : 'Rakeb does not sell tickets. Fares are estimated ranges based on distance and class, and may differ from the official price at booking.'}
            </p>
            <a
              href={OFFICIAL_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex text-[11px] font-semibold text-brand-700 underline-offset-2 hover:underline dark:text-brand-300"
            >
              {ar ? 'الحجز الرسمي عبر سكك حديد مصر (ENR) ↗' : 'Official booking via Egyptian National Railways (ENR) ↗'}
            </a>
          </section>

          {service.notesAr || service.notesEn || service.features.length > 0 ? (
            <section className="panel p-4 sm:p-5">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink dark:text-white">
                <Sparkles className="h-4 w-4 text-signal" aria-hidden />
                {ar ? 'اعرف قبل ما تركب' : 'Know before you board'}
              </h2>
              {service.notesAr || service.notesEn ? (
                <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-[11px] leading-6 text-brand-900 dark:bg-brand-500/10 dark:text-brand-100">
                  {ar ? service.notesAr : service.notesEn}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {service.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-500 dark:border-white/10 dark:text-slate-400"
                  >
                    {featureLabel(locale, feature)}
                  </span>
                ))}
                {service.classes.map((classId) => (
                  <span
                    key={classId}
                    className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-500 dark:border-white/10 dark:text-slate-400"
                  >
                    {classLabel(locale, classId)}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-2.5 text-center dark:bg-white/5">
                  <p className="num text-sm font-semibold text-ink dark:text-white">
                    {formatDuration(trip.durationMinutes, locale)}
                  </p>
                  <p className="text-[9px] text-slate-400">{ar ? 'مدة الرحلة' : 'Journey time'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 text-center dark:bg-white/5">
                  <p className="num text-sm font-semibold text-ink dark:text-white">
                    {trip.distanceKm} km
                  </p>
                  <p className="text-[9px] text-slate-400">{ar ? 'المسافة' : 'Distance'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 text-center dark:bg-white/5">
                  <p className="num text-sm font-semibold text-ink dark:text-white">
                    {trip.stops.filter((stop) => stop.isIntermediate).length}
                  </p>
                  <p className="text-[9px] text-slate-400">{ar ? 'توقفات بينهما' : 'Stops in between'}</p>
                </div>
              </div>
            </section>
          ) : null}

          <ReportPanel
            locale={locale}
            serviceNumber={trip.serviceNumber}
            date={trip.date}
            stationId={trip.from.id}
            stationNameAr={trip.from.nameAr}
            stationNameEn={trip.from.nameEn}
            canReport={trip.date === today}
            initialConsensus={{
              total: consensus.total,
              uniqueReporters: consensus.uniqueReporters,
              confirmed: consensus.confirmed,
              delayMinutes: consensus.delayMinutes,
              needed: consensus.needed,
            }}
          />

          {segmentOptions.length > 0 ? (
            <section className="panel p-4 sm:p-5">
              <h2 className="text-sm font-bold text-ink dark:text-white">
                {cancelled
                  ? ar
                    ? 'أقرب بدائل في نفس اليوم'
                    : 'Closest alternatives today'
                  : ar
                    ? 'رحلات أخرى على نفس المسار'
                    : 'Other trips on this route'}
              </h2>
              <ul className="mt-2 divide-y divide-slate-100 dark:divide-white/5">
                {segmentOptions.map((option) => (
                  <li key={option.tripId}>
                    <Link
                      href={`/trip/${option.tripId}?from=${trip.from.id}&to=${trip.to.id}`}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 transition hover:bg-slate-50/60 dark:hover:bg-white/[0.03]"
                    >
                      <span className="num rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                        {option.serviceNumber}
                      </span>
                      <span className="num text-sm font-semibold text-ink dark:text-white">
                        {formatClock(option.departMinutes)}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {ar ? option.titleAr : option.titleEn}
                      </span>
                      <span className="ms-auto flex items-center gap-2">
                        <StatusBadge locale={locale} kind={option.status.kind} delayMinutes={option.status.delayMinutes} />
                        {ar ? <ArrowLeft className="h-3.5 w-3.5 text-slate-300" /> : <ArrowRight className="h-3.5 w-3.5 text-slate-300" />}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="panel p-4 sm:p-5">
            <h2 className="text-sm font-bold text-ink dark:text-white">{ar ? 'التواريخ القريبة' : 'Nearby dates'}</h2>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {ar
                ? 'القطار قد يعمل في أيام محددة فقط. التنقل بين التواريخ يعرض نفس الرحلة في يوم مختلف.'
                : 'This service may run on selected days only. Switching dates shows the same trip on another day.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {dateOptions.map((value) => {
                const active = value === trip.date;
                return (
                  <Link
                    key={value}
                    href={`/trip/${trip.serviceNumber}-${value}?from=${trip.from.id}&to=${trip.to.id}`}
                    className={cn(
                      'flex min-w-[68px] flex-col items-center rounded-lg border px-2.5 py-1.5 text-center transition',
                      active
                        ? 'border-brand-600 bg-brand-700 text-white dark:border-brand-400 dark:bg-brand-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
                    )}
                    aria-current={active ? 'date' : undefined}
                  >
                    <span className={cn('text-[9px]', active ? 'text-white/70' : 'text-slate-400')}>
                      {formatDateMedium(value, locale)}
                    </span>
                    <span className="num mt-0.5 text-[11px] font-semibold">{value.slice(5)}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="panel overflow-hidden">
            <div className="border-b border-slate-100 bg-mist px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {ar ? 'حالة الرحلة' : 'Trip status'}
              </p>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge locale={locale} kind={trip.status.kind} delayMinutes={trip.status.delayMinutes} />
                <ConfidenceBadge locale={locale} confidence={trip.confidence} />
              </div>

              <div className="mt-4 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    {ar ? 'التحرك' : 'Departure'}
                  </p>
                  <p className="num text-3xl font-semibold leading-none text-ink dark:text-white">
                    {formatClock(trip.departMinutes + trip.status.delayMinutes)}
                  </p>
                  {delayed ? (
                    <p className="num mt-1 text-[10px] text-slate-400 line-through">
                      {formatClock(trip.departMinutes)}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {ar ? trip.from.nameAr : trip.from.nameEn}
                  </p>
                </div>
                <div className="mt-4 flex-1 border-t-2 border-dashed border-slate-200 dark:border-white/10" aria-hidden />
                <div className="text-end">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    {ar ? 'الوصول' : 'Arrival'}
                  </p>
                  <p className="num text-3xl font-semibold leading-none text-ink dark:text-white">
                    {formatClock(trip.arriveMinutes + trip.status.delayMinutes)}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {ar ? trip.to.nameAr : trip.to.nameEn}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3 w-3" aria-hidden />
                  {formatDuration(trip.durationMinutes, locale)}
                </span>
                {trip.status.platform ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {ar ? `رصيف ${trip.status.platform}` : `Platform ${trip.status.platform}`}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <Compass className="h-3 w-3" aria-hidden />
                  {dataSourceLabel(locale, trip.status.source)}
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-white/[0.04]">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {ar ? 'متبقي على موعد التحرك' : 'Time to departure'}
                </p>
                <div className="mt-1.5">
                  <DepartureCountdown targetIso={targetIso} locale={locale} />
                </div>
                <p className="mt-2 text-[9px] text-slate-400">
                  <LastUpdated iso={trip.status.updatedAtIso} locale={locale} />
                </p>
              </div>

              {trip.status.noteAr || trip.status.noteEn ? (
                <div
                  className={cn(
                    'mt-3 rounded-lg px-3 py-2 text-[11px] leading-5',
                    cancelled
                      ? 'bg-danger-soft text-danger-ink dark:bg-danger/10 dark:text-red-300'
                      : 'bg-signal-soft text-signal-ink dark:bg-signal/10 dark:text-orange-300',
                  )}
                >
                  <p className="flex items-start gap-1.5">
                    <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                    {ar ? trip.status.noteAr : trip.status.noteEn}
                  </p>
                  {activeOverrides.length > 0 ? (
                    <p className="mt-1 text-[9px] opacity-70">
                      {ar ? 'تعديل منشور من ' : 'Published by '}
                      {activeOverrides[0].source === 'community'
                        ? ar
                          ? 'بلاغات الركاب'
                          : 'rider reports'
                        : activeOverrides[0].source === 'official' || activeOverrides[0].source === 'partner'
                          ? ar
                            ? 'مصدر رسمي'
                            : 'official source'
                          : ar
                            ? 'فريق العمليات'
                            : 'operations team'}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4">
                <TripActionsRow
                  locale={locale}
                  snapshot={snapshot}
                  itinerary={itinerary}
                  tripId={trip.tripId}
                />
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] dark:border-white/10">
                <Link
                  href={`/station/${trip.from.id}`}
                  className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
                >
                  {ar ? 'لوحة المحطة' : 'Station board'} {ar ? '◂' : '▸'}
                </Link>
                <Link
                  href={`/line/${line?.slug ?? ''}`}
                  className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
                >
                  {ar ? 'صفحة الخط' : 'Line page'} {ar ? '◂' : '▸'}
                </Link>
              </div>
            </div>
          </div>

          <ConfidenceExplainer confidence={trip.confidence} locale={locale} />

          <div className="panel p-4">
            <h2 className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
              <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              {ar ? 'معلومات سريعة' : 'Quick facts'}
            </h2>
            <dl className="mt-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">{ar ? 'رقم القطار' : 'Train number'}</dt>
                <dd className="num font-semibold text-ink dark:text-white">{trip.serviceNumber}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">{ar ? 'الدرجات' : 'Classes'}</dt>
                <dd className="text-end font-medium text-ink dark:text-white">
                  {trip.classes.map((classId) => classLabel(locale, classId)).join(' · ')}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">{ar ? 'نطاق السعر' : 'Fare range'}</dt>
                <dd className="num font-semibold text-ink dark:text-white">
                  {trip.fares.length
                    ? formatFareRange(
                        Math.min(...trip.fares.map((fare) => fare.min)),
                        Math.max(...trip.fares.map((fare) => fare.max)),
                        locale,
                      )
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">{ar ? 'أيام التشغيل' : 'Operating days'}</dt>
                <dd className="text-end font-medium text-ink dark:text-white">
                  {service.operatingDays.type === 'daily'
                    ? ar
                      ? 'يوميًا'
                      : 'Daily'
                    : `${service.operatingDays.days.length} ${ar ? 'أيام' : 'days'}`}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">{ar ? 'آخر تحقق' : 'Last verified'}</dt>
                <dd className="num font-semibold text-ink dark:text-white">
                  {service.lastVerifiedDaysAgo === 0
                    ? ar
                      ? 'اليوم'
                      : 'today'
                    : `${service.lastVerifiedDaysAgo} ${ar ? 'يوم' : 'd'}`}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-[9px] leading-4 text-slate-400">
              {ar
                ? 'بيانات الرحلة قابلة للتغيير. تحقق من لوحة المحطة قبل التحرك.'
                : 'Trip data can change. Check the station board before leaving.'}
            </p>
          </div>

          {otherServices.length > 0 ? (
            <div className="panel p-4">
              <h2 className="text-xs font-bold text-ink dark:text-white">
                {ar ? 'قطارات أخرى على نفس الخط' : 'Other trains on this line'}
              </h2>
              <ul className="mt-2 space-y-1">
                {otherServices.map((other) => (
                  <li key={other.number}>
                    <Link
                      href={`/train/${other.number}`}
                      className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-[11px] text-slate-600 transition hover:bg-slate-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                      <span className="num font-semibold">#{other.number}</span>
                      <span className="truncate">{ar ? serviceTitle(other, 'ar') : serviceTitle(other, 'en')}</span>
                      <span className="num text-slate-400">{formatClock(other.departureMinutes)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-[10px] leading-5 text-slate-500 dark:border-white/10 dark:bg-night-800 dark:text-slate-400">
            <Badge tone="neutral" className="mb-2">
              {ar ? 'تنبيه' : 'Note'}
            </Badge>
            {ar
              ? 'راكب منصة مستقلة وغير تابعة لهيئة السكك الحديدية. في حال تعارض المعلومات، اتبع الإعلان الرسمي داخل المحطة.'
              : 'Rakeb is independent and not affiliated with Egyptian National Railways. If information conflicts, follow the official on-station announcement.'}
          </div>
        </aside>
      </div>
    </>
  );
}
