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
  ParkingCircle,
  Ticket,
  TrainFront,
  Wifi,
} from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata } from '@/lib/seo';
import { STATION_MAP } from '@/lib/data/stations';
import { getStationBoard } from '@/lib/live';
import { getStationStatus } from '@/lib/store';
import { LINE_MAP } from '@/lib/data/lines';
import { amenityLabel, tierLabel } from '@/lib/display';
import { formatDateFull, todayCairo } from '@/lib/time';
import { PageHeader } from '@/components/layout/PageHeader';
import { BoardControls } from '@/components/board/BoardControls';
import { ConfidenceLegend } from '@/components/board/BoardTable';
import { LiveBoardFeed } from '@/components/board/LiveBoardFeed';
import { LiveClock } from '@/components/trip/LiveBits';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const locale = await getLocale();
  const params = await searchParams;
  const station = STATION_MAP[first(params.station) ?? 'cairo-ramses'] ?? STATION_MAP['cairo-ramses'];
  const ar = locale === 'ar';
  return buildMetadata({
    locale,
    title: ar ? `لوحة ${station.nameAr} المباشرة` : `${station.nameEn} live board`,
    description: ar
      ? `المغادرة والوصول المباشر في محطة ${station.nameAr}: المواعيد، التأخيرات، الأرصفة، ودرجة الثقة لكل رحلة.`
      : `Live departures and arrivals at ${station.nameEn}: times, delays, platforms and confidence for every service.`,
    path: `/board?station=${station.id}`,
    noindex: true,
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

export default async function BoardPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const params = await searchParams;
  const stationId = first(params.station) ?? 'cairo-ramses';
  const direction = first(params.direction) === 'arrivals' ? 'arrivals' : 'departures';
  const station = STATION_MAP[stationId];
  if (!station) notFound();

  const board = getStationBoard({
    stationId: station.id,
    direction: direction === 'arrivals' ? 'arrival' : 'departure',
    limit: 40,
    windowBeforeMinutes: 60,
    windowAfterMinutes: 300,
  });
  const rows = direction === 'arrivals' ? board.arrivals : board.departures;
  const status = getStationStatus(station.id);
  const delayed = rows.filter((row) => row.status.delayMinutes > 0).length;
  const cancelled = rows.filter((row) => row.status.kind === 'cancelled').length;

  return (
    <>
      <PageHeader
        locale={locale}
        eyebrow={ar ? 'لوحة مباشرة' : 'Live board'}
        title={ar ? station.nameAr : station.nameEn}
        description={
          ar
            ? 'لوحة الحركة المباشرة بنفس فكرة شاشات المحطة: المواعيد، التأخيرات، والأرصفة — متاحة من أي مكان.'
            : 'The live movement board, just like the screens inside the station: times, delays and platforms — from anywhere.'
        }
        breadcrumbs={[
          { label: ar ? 'المحطات' : 'Stations', href: '/stations' },
          { label: ar ? 'لوحة مباشرة' : 'Live board' },
        ]}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <TrainFront className="h-3 w-3" aria-hidden />
              {tierLabel(locale, station.tier)}
            </span>
            <span className="num inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              {station.code}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <MapPin className="h-3 w-3" aria-hidden />
              {ar ? station.governorateAr : station.governorateEn}
            </span>
            {status === 'maintenance' ? (
              <span className="rounded-full bg-danger-soft px-2.5 py-1 text-[10px] font-bold text-danger dark:bg-danger/10 dark:text-red-300">
                {ar ? 'صيانة مؤقتة' : 'Temporarily under maintenance'}
              </span>
            ) : null}
          </>
        }
      >
        <Link
          href={`/station/${station.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
        >
          {ar ? 'صفحة المحطة' : 'Station page'}
          {ar ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
        </Link>
      </PageHeader>

      <div className="page-shell py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BoardControls locale={locale} stationId={station.id} direction={direction} />
          <div className="flex items-center gap-2">
            <LiveClock locale={locale} onDark={false} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="relative overflow-hidden rounded-2xl bg-[#071a33] text-white shadow-board">
            <div className="pointer-events-none absolute inset-0 opacity-40 hero-grid" aria-hidden />
            <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/10 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300/70">
                  {direction === 'arrivals'
                    ? ar
                      ? 'الوصول · LIVE ARRIVALS'
                      : 'LIVE ARRIVALS'
                    : ar
                      ? 'المغادرة · LIVE DEPARTURES'
                      : 'LIVE DEPARTURES'}
                </p>
                <p className="num mt-1 text-[11px] text-brand-200/60">
                  {formatDateFull(todayCairo(), locale)} · {ar ? 'توقيت القاهرة' : 'Cairo time'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-semibold text-brand-200/80">
                  {rows.length} {ar ? 'رحلة' : 'trips'}
                  {delayed > 0 ? ` · ${delayed} ${ar ? 'متأخرة' : 'late'}` : ''}
                  {cancelled > 0 ? ` · ${cancelled} ${ar ? 'ملغاة' : 'cancelled'}` : ''}
                </span>
              </div>
            </div>
            <div className="relative">
              <LiveBoardFeed
                locale={locale}
                stationId={station.id}
                direction={direction}
                mode={direction === 'arrivals' ? 'arrival' : 'departure'}
                initialRows={rows}
              />
            </div>
            <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
              <ConfidenceLegend locale={locale} />
              <p className="text-[9px] text-brand-300/50">
                {ar
                  ? 'تعرض اللوحة 60 دقيقة سابقة و5 ساعات قادمة. الأرصفة قد تتغير داخل المحطة.'
                  : 'Showing 60 minutes back and 5 hours ahead. Platforms can change inside the station.'}
              </p>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="panel p-4">
              <h2 className="text-xs font-bold text-ink dark:text-white">
                {ar ? 'خطوط المحطة' : 'Station lines'}
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
                {ar ? 'مرافق المحطة' : 'Station facilities'}
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

            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-[11px] leading-6 text-brand-900 dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-100">
              <Info className="mb-1 inline h-3.5 w-3.5" aria-hidden />
              {ar
                ? 'اللوحة تعتمد على الجدول المنشور وبلاغات الركاب. عند تعارضها مع شاشة المحطة، اتبع الشاشة الرسمية.'
                : 'The board combines the published timetable with rider reports. If it conflicts with the on-station screen, follow the official screen.'}
            </div>

            <div className={cn('rounded-xl border border-slate-200 p-3 text-[10px] dark:border-white/10')}>
              <p className="font-semibold text-slate-500 dark:text-slate-400">
                {ar ? 'محطات أخرى' : 'Other stations'}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {['cairo-ramses', 'alexandria-sidi-gaber', 'tanta', 'asyut', 'luxor', 'port-said']
                  .filter((id) => id !== station.id)
                  .slice(0, 4)
                  .map((id) => {
                    const other = STATION_MAP[id];
                    return (
                      <Link
                        key={id}
                        href={`/board?station=${id}&direction=${direction}`}
                        className="rounded-md border border-slate-200 px-1.5 py-1 text-[10px] font-medium text-slate-500 transition hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:text-slate-400"
                      >
                        {ar ? other.nameAr : other.nameEn}
                      </Link>
                    );
                  })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
