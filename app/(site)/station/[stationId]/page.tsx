import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Coffee,
  CreditCard,
  Info,
  MapPin,
  Navigation,
  ParkingCircle,
  Ticket,
  TrainFront,
  Wifi,
} from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata, breadcrumbJsonLd, stationJsonLd } from '@/lib/seo';
import { STATION_MAP, STATIONS } from '@/lib/data/stations';
import { LINE_MAP } from '@/lib/data/lines';
import { SERVICES } from '@/lib/data/services';
import { getStationBoard } from '@/lib/live';
import { getStationStatus } from '@/lib/store';
import { nearestStations } from '@/lib/stations-search';
import { amenityLabel, countLabel, tierLabel } from '@/lib/display';
import { routePairPath } from '@/lib/data/station-slugs';
import { todayCairo } from '@/lib/time';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { StationBoardTabs } from '@/components/board/StationBoardTabs';
import { buttonClasses } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

type Params = Promise<{ stationId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await getLocale();
  const { stationId } = await params;
  const station = STATION_MAP[stationId];
  const ar = locale === 'ar';
  if (!station) {
    return buildMetadata({
      locale,
      title: ar ? 'محطة غير موجودة' : 'Station not found',
      description: '',
      path: `/station/${stationId}`,
      noindex: true,
    });
  }
  return buildMetadata({
    locale,
    title: ar
      ? `محطة ${station.nameAr} — مواعيد القطارات واللوحة المباشرة`
      : `${station.nameEn} station — train times & live board`,
    description: ar
      ? `${station.descriptionAr} شوف المغادرة والوصول والخطوط والمرافق ودرجة الثقة في كل رحلة.`
      : `${station.descriptionEn} See live departures, arrivals, lines, facilities and a confidence level for every trip.`,
    path: `/station/${station.id}`,
    noindex: !station.searchable,
  });
}

const amenityIcons = {
  tickets: Ticket,
  machine: CreditCard,
  waiting: Building2,
  cafe: Coffee,
  taxi: MapPin,
  atm: CreditCard,
  accessible: Wifi,
  parking: ParkingCircle,
};

export default async function StationPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const { stationId } = await params;
  const station = STATION_MAP[stationId];
  if (!station) notFound();

  const board = getStationBoard({
    stationId: station.id,
    direction: 'departure',
    limit: 12,
    windowBeforeMinutes: 60,
    windowAfterMinutes: 300,
  });
  const arrivalsBoard = getStationBoard({
    stationId: station.id,
    direction: 'arrival',
    limit: 12,
    windowBeforeMinutes: 60,
    windowAfterMinutes: 300,
  });
  const status = getStationStatus(station.id);
  const nearby = nearestStations(station.lat, station.lng, 5).filter((item) => item.id !== station.id);
  const destinations = Array.from(
    new Map(
      STATIONS.filter(
        (candidate) =>
          candidate.searchable &&
          candidate.id !== station.id &&
          candidate.tier <= 2 &&
          candidate.lineIds.some((lineId) => station.lineIds.includes(lineId)),
      ).map((candidate) => [candidate.id, candidate]),
    ).values(),
  ).slice(0, 8);

  const passingServices = SERVICES.filter((service) =>
    service.stops.some((stop) => stop.stationId === station.id),
  ).length;

  return (
    <>
      <JsonLd
        data={[
          stationJsonLd({
            locale,
            name: ar ? station.nameAr : station.nameEn,
            code: station.code,
            lat: station.lat,
            lng: station.lng,
            description: ar ? station.descriptionAr : station.descriptionEn,
          }),
          breadcrumbJsonLd([
            { name: ar ? 'الرئيسية' : 'Home', path: '/' },
            { name: ar ? 'المحطات' : 'Stations', path: '/stations' },
            { name: ar ? station.nameAr : station.nameEn, path: `/station/${station.id}` },
          ]),
        ]}
      />
      <PageHeader
        locale={locale}
        eyebrow={tierLabel(locale, station.tier)}
        title={ar ? station.nameAr : station.nameEn}
        description={ar ? station.descriptionAr : station.descriptionEn}
        breadcrumbs={[
          { label: ar ? 'المحطات' : 'Stations', href: '/stations' },
          { label: ar ? station.nameAr : station.nameEn },
        ]}
        meta={
          <>
            <span className="num inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              {station.code}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <MapPin className="h-3 w-3" aria-hidden />
              {ar ? station.governorateAr : station.governorateEn}
            </span>
            <span className="num inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <TrainFront className="h-3 w-3" aria-hidden />
              {passingServices} {ar ? 'رحلة تخدم المحطة' : 'serving services'}
            </span>
            {status === 'maintenance' ? (
              <span className="rounded-full bg-danger-soft px-2.5 py-1 text-[10px] font-bold text-danger dark:bg-danger/10 dark:text-red-300">
                {ar ? 'المحطة تحت صيانة مؤقتة' : 'Station temporarily under maintenance'}
              </span>
            ) : null}
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Link href={`/board?station=${station.id}`} className={buttonClasses({ size: 'sm' })}>
            <TrainFront className="h-3.5 w-3.5" aria-hidden />
            {ar ? 'اللوحة الكاملة' : 'Full board'}
          </Link>
          <Link
            href={`/search?from=${station.id}&date=${todayCairo()}`}
            className={buttonClasses({ size: 'sm', variant: 'secondary' })}
          >
            {ar ? 'ابحث من هنا' : 'Search from here'}
          </Link>
        </div>
      </PageHeader>

      <div className="page-shell grid gap-4 py-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <StationBoardTabs
            locale={locale}
            stationId={station.id}
            stationNameAr={board.station.nameAr}
            stationNameEn={board.station.nameEn}
            departures={board.departures}
            arrivals={arrivalsBoard.arrivals}
          />

          <section className="panel p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-ink dark:text-white">
                  {ar ? 'من هنا إلى أين؟' : 'Where to from here?'}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {ar
                    ? 'أشهر الوجهات المتاحة من هذه المحطة على نفس الخطوط.'
                    : 'Popular destinations reachable from this station on the same lines.'}
                </p>
              </div>
              <Link href="/search" className="text-[10px] font-semibold text-brand-700 dark:text-brand-300">
                {ar ? 'بحث مخصص ←' : 'Custom search →'}
              </Link>
            </div>
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {destinations.map((destination) => (
                <Link
                  key={destination.id}
                  href={routePairPath(station.id, destination.id)}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:text-slate-300"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" aria-hidden />
                    <span className="truncate">{ar ? destination.nameAr : destination.nameEn}</span>
                  </span>
                  {ar ? (
                    <ArrowLeft className="h-3 w-3 shrink-0 opacity-40" aria-hidden />
                  ) : (
                    <ArrowRight className="h-3 w-3 shrink-0 opacity-40" aria-hidden />
                  )}
                </Link>
              ))}
            </div>
          </section>

          <section className="panel p-4 sm:p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink dark:text-white">
              <Info className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden />
              {ar ? 'عن المحطة' : 'About the station'}
            </h2>
            <p className="mt-2 text-[12px] leading-7 text-slate-600 dark:text-slate-300">
              {ar ? station.descriptionAr : station.descriptionEn}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-white/5">
                <dt className="text-[9px] text-slate-400">{ar ? 'المستوى' : 'Tier'}</dt>
                <dd className="mt-0.5 font-semibold text-ink dark:text-white">{tierLabel(locale, station.tier)}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-white/5">
                <dt className="text-[9px] text-slate-400">{ar ? 'الكود' : 'Code'}</dt>
                <dd className="num mt-0.5 font-semibold text-ink dark:text-white">{station.code}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-white/5">
                <dt className="text-[9px] text-slate-400">{ar ? 'الإحداثيات' : 'Coordinates'}</dt>
                <dd className="num mt-0.5 text-[10px] font-medium text-ink dark:text-white">
                  {station.lat.toFixed(3)}, {station.lng.toFixed(3)}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-white/5">
                <dt className="text-[9px] text-slate-400">{ar ? 'الخطوط' : 'Lines'}</dt>
                <dd className="num mt-0.5 font-semibold text-ink dark:text-white">{station.lineIds.length}</dd>
              </div>
            </dl>
            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-5 text-slate-400">
              <Navigation className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              {ar
                ? 'الإحداثيات تقريبية لمركز المحطة وتُستخدم لميزة "أقرب محطة".'
                : 'Coordinates are approximate station-centre values used by the nearest-station feature.'}
            </p>
          </section>
        </div>

        <aside className="space-y-3">
          <div className="panel p-4">
            <h2 className="text-xs font-bold text-ink dark:text-white">
              {ar ? 'الخطوط التي تمر بالمحطة' : 'Lines at this station'}
            </h2>
            <ul className="mt-2 space-y-1.5">
              {station.lineIds.map((lineId) => {
                const line = LINE_MAP[lineId];
                if (!line) return null;
                return (
                  <li key={lineId}>
                    <Link
                      href={`/line/${line.slug}`}
                      className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-[11px] text-slate-600 transition hover:bg-slate-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                      <span className="h-1.5 w-4 shrink-0 rounded-full" style={{ backgroundColor: line.color }} aria-hidden />
                      <span className="truncate">{ar ? line.nameAr : line.nameEn}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="panel p-4">
            <h2 className="text-xs font-bold text-ink dark:text-white">
              {ar ? 'المرافق المتاحة' : 'Facilities'}
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {station.amenities.map((amenity) => {
                const Icon = amenityIcons[amenity];
                return (
                  <span
                    key={amenity}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400"
                  >
                    <Icon className="h-3 w-3" aria-hidden />
                    {amenityLabel(locale, amenity)}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="panel p-4">
            <h2 className="text-xs font-bold text-ink dark:text-white">
              {ar ? 'أقرب محطات' : 'Nearest stations'}
            </h2>
            <ul className="mt-2 space-y-1.5">
              {nearby.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/station/${item.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-[11px] text-slate-600 transition hover:bg-slate-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    <span className="truncate">{ar ? item.nameAr : item.nameEn}</span>
                    <span className="num shrink-0 text-[9px] text-slate-400">{Math.round(item.distance ?? 0)} km</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-[10px] leading-5 text-brand-900 dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-100">
            <Info className="mb-1 inline h-3.5 w-3.5" aria-hidden />
            {ar
              ? 'درجة ثقة كل رحلة تظهر بجانبها في اللوحة. لو المعلومة قديمة، راجع شاشة المحطة قبل التحرك.'
              : 'Every trip on the board carries a confidence level. If data is stale, check the station screen before leaving.'}
          </div>

          <div className="panel p-4">
            <h2 className="text-xs font-bold text-ink dark:text-white">
              {ar ? 'إحصاء سريع' : 'Quick stats'}
            </h2>
            <p className="num mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              {countLabel(station.lineIds.length, locale, 'lines')} ·{' '}
              {countLabel(passingServices, locale, 'trips')} {ar ? 'تخدم المحطة' : 'serve the station'}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              {ar
                ? `أقرب محطة أخرى: ${nearby[0] ? (ar ? nearby[0].nameAr : nearby[0].nameEn) : '—'}`
                : `Nearest other station: ${nearby[0] ? nearby[0].nameEn : '—'}`}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
