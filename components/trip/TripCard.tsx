import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock3, MapPin, Route as RouteIcon, Sparkles } from 'lucide-react';
import type { Locale, TripResult } from '@/types/rail';
import { LINE_MAP } from '@/lib/data/lines';
import { TRAIN_CLASS_MAP } from '@/lib/data/train-classes';
import {
  formatDuration,
  formatFare,
  formatFareRange,
  countLabel,
} from '@/lib/display';
import { formatClock } from '@/lib/time';
import { Badge } from '@/components/ui/Badge';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TrainClassIcon } from '@/components/ui/TrainClassIcon';
import { TripActionsRow } from '@/components/trip/TripActions';
import { tripToItinerary, tripToSnapshot } from '@/lib/client-storage';
import { cn } from '@/lib/utils';

export function TripCard({
  trip,
  locale,
  tag,
  className,
}: {
  trip: TripResult;
  locale: Locale;
  tag?: string;
  className?: string;
}) {
  const line = LINE_MAP[trip.lineId];
  const ar = locale === 'ar';
  const cancelled = trip.status.kind === 'cancelled';
  const delayed = trip.status.delayMinutes > 0;
  const lowestFare = trip.fares.length ? Math.min(...trip.fares.map((fare) => fare.min)) : null;
  const intermediateCount = trip.stops.filter((stop) => stop.isIntermediate).length;
  const snapshot = tripToSnapshot(trip);
  const itinerary = tripToItinerary(trip);
  const detailHref = `/trip/${trip.tripId}?from=${trip.from.id}&to=${trip.to.id}`;
  const boardingOffset = trip.departDayOffset;
  const arrivalExtraDay =
    trip.arriveDayOffset > trip.departDayOffset ? trip.arriveDayOffset - trip.departDayOffset : 0;

  return (
    <article
      className={cn(
        'panel group relative overflow-hidden transition-shadow duration-200 hover:shadow-lift',
        cancelled && 'opacity-90',
        className,
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: line?.color ?? '#1565C0' }}
        aria-hidden
      />
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="num rounded-md bg-brand-700 px-2 py-1 text-[11px] font-bold text-white dark:bg-brand-500">
            {trip.serviceNumber}
          </span>
          <h3 className="text-sm font-bold text-ink dark:text-white">{ar ? trip.titleAr : trip.titleEn}</h3>
          <span className="text-[11px] text-slate-400">{ar ? line?.shortAr : line?.shortEn}</span>
          {tag ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
              {tag}
            </span>
          ) : null}
          <div className="ms-auto flex flex-wrap items-center justify-end gap-1.5">
            <ConfidenceBadge locale={locale} confidence={trip.confidence} />
            <StatusBadge
              locale={locale}
              kind={trip.status.kind}
              delayMinutes={trip.status.delayMinutes}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <div className={cn('min-w-0', cancelled && 'line-through decoration-danger/40')}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {ar ? 'التحرك' : 'Departure'}
            </p>
            <p className="num mt-0.5 flex items-baseline gap-1 text-[30px] font-semibold leading-none text-ink dark:text-white sm:text-[34px]">
              {formatClock(trip.departMinutes + trip.status.delayMinutes)}
              {boardingOffset > 0 ? (
                <span className="num rounded bg-slate-100 px-1 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                  +{boardingOffset}
                </span>
              ) : null}
            </p>
            <p className="mt-1.5 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
              {ar ? trip.from.nameAr : trip.from.nameEn}
            </p>
          </div>

          <div className="flex min-w-[86px] flex-col items-center text-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400">
              <Clock3 className="h-2.5 w-2.5" aria-hidden />
              {formatDuration(trip.durationMinutes, locale)}
            </span>
            <div className="mt-2 flex w-full items-center gap-1" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full border border-brand-500 bg-white dark:bg-night" />
              <span className="h-px flex-1 bg-gradient-to-r from-brand-300 to-brand-500/60 dark:from-brand-600" />
              <span className="text-brand-500 dark:text-brand-300">
                {ar ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-brand-500/60 to-brand-300 dark:to-brand-600" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            </div>
            <span className="mt-2 text-[10px] font-medium text-slate-400">
              {trip.isDirect
                ? ar
                  ? 'مباشر بدون توقف'
                  : 'Direct, no stops'
                : countLabel(intermediateCount, locale, 'stops')}
            </span>
          </div>

          <div className={cn('min-w-0 text-end', cancelled && 'line-through decoration-danger/40')}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {ar ? 'الوصول' : 'Arrival'}
            </p>
            <p className="num mt-0.5 flex items-baseline justify-end gap-1 text-[30px] font-semibold leading-none text-ink dark:text-white sm:text-[34px]">
              {arrivalExtraDay > 0 ? (
                <span className="num rounded bg-slate-100 px-1 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                  +{arrivalExtraDay}
                </span>
              ) : null}
              {formatClock(trip.arriveMinutes + trip.status.delayMinutes)}
            </p>
            <p className="mt-1.5 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
              {ar ? trip.to.nameAr : trip.to.nameEn}
            </p>
          </div>
        </div>

        {cancelled || delayed ? (
          <div
            className={cn(
              'mt-4 rounded-lg px-3 py-2 text-[11px] leading-5',
              cancelled
                ? 'bg-danger-soft text-danger-ink dark:bg-danger/10 dark:text-red-300'
                : 'bg-signal-soft text-signal-ink dark:bg-signal/10 dark:text-orange-300',
            )}
          >
            {ar ? trip.status.noteAr : trip.status.noteEn}
            {delayed ? (
              <span className="ms-1 font-bold">
                {ar
                  ? `(الموعد الأصلي ${formatClock(trip.departMinutes)})`
                  : `(scheduled ${formatClock(trip.departMinutes)})`}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-dashed border-slate-200 pt-3 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-1">
            {trip.classes.map((classId) => {
              const trainClass = TRAIN_CLASS_MAP[classId];
              return (
                <span
                  key={classId}
                  title={ar ? trainClass.descriptionAr : trainClass.descriptionEn}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300"
                >
                  <TrainClassIcon classId={classId} size={13} />
                  {ar ? trainClass.shortAr : trainClass.shortEn}
                </span>
              );
            })}
          </div>

          {lowestFare !== null ? (
            <p className="ms-auto text-xs text-slate-400">
              {ar ? 'من' : 'from'}{' '}
              <span className="num text-sm font-bold text-ink dark:text-white">
                {formatFare(lowestFare, locale)}
              </span>{' '}
              <span className="text-[10px]">{ar ? 'تقديري' : 'est.'}</span>
            </p>
          ) : null}
        </div>

        {trip.fares.length > 0 ? (
          <p className="mt-1 text-[10px] text-slate-400">
            {ar ? 'نطاق السعر:' : 'Fare range:'}{' '}
            <span className="num">
              {formatFareRange(
                Math.min(...trip.fares.map((fare) => fare.min)),
                Math.max(...trip.fares.map((fare) => fare.max)),
                locale,
              )}
            </span>
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TripActionsRow locale={locale} snapshot={snapshot} itinerary={itinerary} tripId={trip.tripId} compact />
          <div className="ms-auto flex items-center gap-3">
            {trip.status.platform ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <MapPin className="h-3 w-3" aria-hidden />
                {ar ? `رصيف ${trip.status.platform}` : `Platform ${trip.status.platform}`}
              </span>
            ) : null}
            <Link
              href={detailHref}
              className="inline-flex items-center gap-1 rounded-lg px-1 py-1 text-xs font-bold text-brand-700 transition hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200"
            >
              <RouteIcon className="h-3.5 w-3.5" aria-hidden />
              {ar ? 'التفاصيل' : 'Details'}
              {ar ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function TripList({
  trips,
  locale,
  fastestId,
  cheapestId,
}: {
  trips: TripResult[];
  locale: Locale;
  fastestId?: string;
  cheapestId?: string;
}) {
  return (
    <div className="grid gap-3">
      {trips.map((trip) => (
        <TripCard
          key={trip.tripId}
          trip={trip}
          locale={locale}
          tag={
            trip.tripId === fastestId
              ? locale === 'ar'
                ? 'الأسرع'
                : 'Fastest'
              : trip.tripId === cheapestId
                ? locale === 'ar'
                  ? 'الأرخص'
                  : 'Cheapest'
                : undefined
          }
        />
      ))}
    </div>
  );
}

export function BoardStatusDot({ tone }: { tone: string }) {
  return <Badge tone="neutral">{tone}</Badge>;
}
