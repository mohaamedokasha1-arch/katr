import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarClock, Snowflake, TrainFront } from 'lucide-react';
import type { Locale } from '@/types/rail';
import type { PopularRouteCard } from '@/lib/search';
import { formatClock, formatDateShort, formatSeason } from '@/lib/time';
import { LINE_MAP } from '@/lib/data/lines';
import { formatFare } from '@/lib/display';
import { routePairPath } from '@/lib/data/station-slugs';
import { SectionHeading } from '@/components/ui/SectionHeading';

function RouteCard({ route, locale }: { route: PopularRouteCard; locale: Locale }) {
  const ar = locale === 'ar';
  const line = route.trip ? LINE_MAP[route.trip.lineId] : null;
  const seasonalNote =
    route.seasonal && route.trip?.lineId === 'matrouh'
      ? formatSeason({ startMonth: 6, startDay: 1, endMonth: 9, endDay: 30 }, locale)
      : null;

  return (
    <Link
      href={routePairPath(route.from.id, route.to.id)}
      className="group panel relative flex flex-col overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift dark:hover:border-brand-400/30"
    >
      <div
        className="absolute inset-y-0 start-0 w-1 opacity-80"
        style={{ backgroundColor: line?.color ?? '#1565C0' }}
        aria-hidden
      />
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300">
          <TrainFront className="h-2.5 w-2.5" aria-hidden />
          {ar ? `${route.tripCountToday} رحلة اليوم` : `${route.tripCountToday} trips today`}
        </span>
        {seasonalNote ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
            <Snowflake className="h-2.5 w-2.5" aria-hidden />
            {ar ? 'موسمي' : 'Seasonal'}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[15px] font-bold text-ink dark:text-white">
        <span className="truncate">{ar ? route.from.nameAr : route.from.nameEn}</span>
        {ar ? (
          <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden />
        ) : (
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden />
        )}
        <span className="truncate">{ar ? route.to.nameAr : route.to.nameEn}</span>
      </div>

      {route.trip ? (
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              {ar ? 'أقرب رحلة' : 'Next trip'}
            </p>
            <p className="num mt-0.5 text-2xl font-semibold leading-none text-ink dark:text-white">
              {formatClock(route.trip.departMinutes + route.trip.status.delayMinutes)}
            </p>
            <p className="num mt-1 text-[10px] text-slate-400">
              {formatDateShort(route.date, locale)} · {ar ? 'قطار' : 'train'}{' '}
              {route.trip.serviceNumber}
            </p>
          </div>
          {route.minFare !== null ? (
            <div className="text-end">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">{ar ? 'من' : 'from'}</p>
              <p className="num text-sm font-bold text-brand-700 dark:text-brand-300">
                {formatFare(route.minFare, locale)}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[10px] text-slate-500 dark:bg-white/5 dark:text-slate-400">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          {seasonalNote
            ? ar
              ? `يعمل في الموسم ${seasonalNote}`
              : `Operates ${seasonalNote}`
            : ar
              ? 'لا توجد رحلات مطابقة حاليًا — شوف التواريخ القادمة'
              : 'No trips right now — check upcoming dates'}
        </div>
      )}

      <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 opacity-0 transition group-hover:opacity-100 dark:text-brand-300">
        {ar ? 'اعرض المواعيد' : 'View timetables'}
        {ar ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
      </span>
    </Link>
  );
}

export function PopularRoutes({
  locale,
  routes,
}: {
  locale: Locale;
  routes: PopularRouteCard[];
}) {
  const ar = locale === 'ar';
  return (
    <section className="page-shell py-10 sm:py-12">
      <SectionHeading
        locale={locale}
        eyebrow={ar ? 'أكثر المسارات طلبًا' : 'Most searched'}
        title={ar ? 'رحلات يبحث عنها المصريون كل يوم' : 'Routes Egyptians search every day'}
        description={
          ar
            ? 'أقرب رحلة متاحة لكل مسار، وأقل سعر تقديري. اضغط على المسار لعرض كل المواعيد والدرجات.'
            : 'The next available trip on each route with the lowest estimated fare. Open a route for every departure and class.'
        }
        action={{ label: ar ? 'كل المسارات' : 'All routes', href: '/search' }}
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => (
          <RouteCard key={`${route.from.id}-${route.to.id}`} route={route} locale={locale} />
        ))}
      </div>
    </section>
  );
}
