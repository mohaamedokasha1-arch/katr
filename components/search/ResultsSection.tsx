import Link from 'next/link';
import {
  ArrowLeftRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Info,
  SearchX,
  Sparkles,
  TrainFront,
  Wallet,
} from 'lucide-react';
import type { Locale, TrainClassId } from '@/types/rail';
import { searchTrips, summariseTrips } from '@/lib/search';
import { formatDuration, formatFare, formatFareRange, countLabel } from '@/lib/display';
import { addDays, formatClock } from '@/lib/time';
import { TripList } from '@/components/trip/TripCard';
import { SearchFilters } from '@/components/search/SearchFilters';
import { DateStrip } from '@/components/search/DateStrip';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonClasses } from '@/components/ui/Button';

export interface ResultsQuery {
  from: string;
  to: string;
  date: string;
  direct: boolean;
  classes: TrainClassId[];
  sort: 'departure' | 'arrival' | 'duration' | 'price';
  before?: number;
  maxFare?: number;
}

function lowestFare(trip: { fares: Array<{ min: number }> }): number {
  return trip.fares.length ? Math.min(...trip.fares.map((fare) => fare.min)) : Number.MAX_SAFE_INTEGER;
}

export function ResultsSection({
  locale,
  query,
  isToday,
  basePath = '/search',
}: {
  locale: Locale;
  query: ResultsQuery;
  isToday: boolean;
  basePath?: string;
}) {
  const ar = locale === 'ar';
  const response = searchTrips({
    from: query.from,
    to: query.to,
    date: query.date,
    directOnly: query.direct,
    classes: query.classes,
    sort: query.sort,
  });

  const beforeFiltered = query.before
    ? response.trips.filter((trip) => {
        if (trip.arriveDayOffset > trip.departDayOffset) return false;
        const normalized = ((trip.arriveMinutes % 1440) + 1440) % 1440;
        return normalized <= query.before!;
      })
    : response.trips;

  const priceFiltered = query.maxFare
    ? beforeFiltered.filter((trip) => lowestFare(trip) <= query.maxFare!)
    : beforeFiltered;

  const upcoming = isToday ? priceFiltered.filter((trip) => trip.status.kind !== 'arrived') : priceFiltered;
  const finished = isToday ? priceFiltered.filter((trip) => trip.status.kind === 'arrived') : [];
  const summary = summariseTrips(priceFiltered);
  const fastestId =
    upcoming.length > 0
      ? [...upcoming].sort((a, b) => a.durationMinutes - b.durationMinutes)[0].tripId
      : undefined;
  const cheapestId =
    upcoming.length > 1
      ? [...upcoming].sort((a, b) => lowestFare(a) - lowestFare(b))[0].tripId
      : undefined;

  const extraParams: Record<string, string> = {};
  if (query.direct) extraParams.direct = '1';
  if (query.classes.length) extraParams.classes = query.classes.join(',');
  if (query.before) extraParams.before = String(query.before);
  if (query.maxFare) extraParams.maxFare = String(query.maxFare);
  if (query.sort !== 'departure') extraParams.sort = query.sort;
  if (query.before) extraParams.before = String(query.before);

  const nextDateLinks = (response.nextDates.length > 0
    ? response.nextDates
    : Array.from({ length: 3 }, (_, index) => addDays(query.date, index + 1))
  ).slice(0, 3);

  return (
    <div className="space-y-3">
      {summary ? (
        <div className="panel grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:grid-cols-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              {ar ? 'عدد الرحلات' : 'Trips'}
            </p>
            <p className="num mt-0.5 text-xl font-semibold text-ink dark:text-white">{summary.tripCount}</p>
            <p className="text-[10px] text-slate-400">
              {ar ? 'مباشرة على هذا المسار' : 'direct on this route'}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              {ar ? 'أول تحرك / آخر تحرك' : 'First / last'}
            </p>
            <p className="num mt-0.5 text-xl font-semibold text-ink dark:text-white">
              {formatClock(summary.firstDepartureMinutes)}–{formatClock(summary.lastDepartureMinutes)}
            </p>
            <p className="text-[10px] text-slate-400">{ar ? 'بتوقيت القاهرة' : 'Cairo time'}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              {ar ? 'مدة الرحلة' : 'Duration'}
            </p>
            <p className="num mt-0.5 text-xl font-semibold text-ink dark:text-white">
              {formatDuration(summary.minDurationMinutes, locale)}
            </p>
            <p className="text-[10px] text-slate-400">
              {ar ? 'حتى' : 'up to'} {formatDuration(summary.maxDurationMinutes, locale)}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              {ar ? 'نطاق السعر' : 'Fare range'}
            </p>
            <p className="num mt-0.5 text-xl font-semibold text-ink dark:text-white">
              {summary.minFare !== null && summary.maxFare !== null
                ? ar
                  ? `${summary.minFare}–${summary.maxFare} ج.م`
                  : `EGP ${summary.minFare}–${summary.maxFare}`
                : '—'}
            </p>
            <p className="text-[10px] text-slate-400">{ar ? 'تقديري لكل الدرجات' : 'estimated, all classes'}</p>
          </div>
        </div>
      ) : null}

      <SearchFilters locale={locale} selectedClasses={query.classes} total={priceFiltered.length} basePath={basePath} />

      <div className="panel p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-slate-400">
            {ar ? 'غيّر التاريخ' : 'Change date'}
          </p>
          {query.before || query.maxFare ? (
            <p className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 dark:text-brand-300">
              <CalendarClock className="h-3 w-3" aria-hidden />
              {query.before ? (
                <>
                  {ar ? 'وصول قبل ' : 'Arrive before '}
                  <span className="num">{formatClock(query.before)}</span>
                </>
              ) : null}
              {query.before && query.maxFare ? <span className="text-slate-300"> · </span> : null}
              {query.maxFare ? (
                <>
                  {ar ? 'أعلى سعر ' : 'Up to '}
                  <span className="num">{formatFare(query.maxFare, locale)}</span>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        <DateStrip
          locale={locale}
          fromId={query.from}
          toId={query.to}
          date={query.date}
          extraParams={extraParams}
          basePath={basePath}
        />
      </div>

      {priceFiltered.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-6 w-6" aria-hidden />}
          title={
            response.trips.length > 0
              ? ar
                ? 'مفيش رحلة تطابق الفلاتر'
                : 'No trip matches these filters'
              : ar
                ? 'مفيش رحلات مباشرة في اليوم ده'
                : 'No direct trips on this day'
          }
          description={
            response.trips.length > 0
              ? ar
                ? `فيه ${response.trips.length} رحلة على المسار، لكنها مش مطابقة لدرجة أو فلتر الوصول اللي اخترته. جرّب إزالة بعض الفلاتر.`
                : `${response.trips.length} trips exist on this route but do not match your class or arrival filter. Try clearing a filter.`
              : ar
                ? 'قد يكون الخط موسميًا أو لا يعمل في هذا اليوم. جرّب تاريخًا قريبًا، أو اعرض أقرب الرحلات المتاحة.'
                : 'The line may be seasonal or not operating that day. Try a nearby date or view the closest available services.'
          }
        >
          <Link href={`/search?from=${query.from}&to=${query.to}&date=${query.date}`} className={buttonClasses({ size: 'sm' })}>
            {ar ? 'إزالة الفلاتر' : 'Clear filters'}
          </Link>
          <Link
            href={`/search?from=${query.to}&to=${query.from}&date=${query.date}`}
            className={buttonClasses({ size: 'sm', variant: 'secondary' })}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
            {ar ? 'عكس الاتجاه' : 'Swap direction'}
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-ink dark:text-white">
                {countLabel(priceFiltered.length, locale, 'trips')}
              </span>{' '}
              {ar ? '— مرتبة حسب' : '— sorted by'}{' '}
              {ar
                ? { departure: 'وقت التحرك', arrival: 'وقت الوصول', duration: 'المدة', price: 'السعر' }[query.sort]
                : query.sort}
              {isToday ? (ar ? ' · الرحلات المنتهية تحت' : ' · finished trips below') : ''}
            </p>
            <p className="inline-flex items-center gap-1 text-[10px] text-slate-400">
              <Info className="h-3 w-3" aria-hidden />
              {ar ? 'الأسعار والأوقات تقديرية' : 'Times and fares are estimates'}
            </p>
          </div>

          {upcoming.length > 0 ? (
            <TripList
              locale={locale}
              trips={upcoming}
              fastestId={upcoming.length > 1 ? fastestId : undefined}
              cheapestId={upcoming.length > 1 && cheapestId !== fastestId ? cheapestId : undefined}
            />
          ) : null}

          {finished.length > 0 ? (
            <details className="group panel overflow-hidden" open={upcoming.length === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-400" aria-hidden />
                  {ar
                    ? `${finished.length} رحلة انتهت اليوم`
                    : `${finished.length} completed trips today`}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {ar ? 'اعرض التفاصيل' : 'Show details'}
                </span>
              </summary>
              <div className="border-t border-slate-100 p-2 dark:border-white/10">
                <TripList locale={locale} trips={finished} />
              </div>
            </details>
          ) : null}

          {priceFiltered.length === 0 ? null : (
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-[11px] leading-6 text-slate-500 dark:border-white/10 dark:bg-night-800 dark:text-slate-400">
              <Sparkles className="me-1 inline h-3 w-3 text-signal" aria-hidden />
              {ar
                ? 'نصيحة: لو موعدك مرن، جرّب "الأسرع" أو "الأرخص" من الترتيب. الرحلات المباشرة تكون أسرع لكن قد تكون أغلى.'
                : 'Tip: if your time is flexible, sort by fastest or cheapest. Direct trips are quicker but can cost more.'}
            </div>
          )}
        </>
      )}

      {priceFiltered.length === 0 && nextDateLinks.length > 0 ? (
        <div className="panel p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
            <TrainFront className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" aria-hidden />
            {ar ? 'أقرب تواريخ بها رحلات' : 'Nearest dates with trips'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {nextDateLinks.map((date) => {
              const params = new URLSearchParams({
                from: query.from,
                to: query.to,
                date,
              });
              if (query.direct) params.set('direct', '1');
              if (query.classes.length) params.set('classes', query.classes.join(','));
              return (
                <Link
                  key={date}
                  href={`/search?${params.toString()}`}
                  className="num inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:border-brand-300 dark:border-white/10 dark:text-brand-300"
                >
                  <Clock3 className="h-3 w-3" aria-hidden />
                  {date}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
