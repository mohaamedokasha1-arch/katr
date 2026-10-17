import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarRange, MapPin, Snowflake, TrainFront } from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import { LINES } from '@/lib/data/lines';
import { STATION_MAP } from '@/lib/data/stations';
import { SERVICES } from '@/lib/data/services';
import { getRunDecision } from '@/lib/schedule';
import { getPublishedOverrides } from '@/lib/store';
import { countLabel } from '@/lib/display';
import { formatSeason } from '@/lib/time';
import { todayCairo } from '@/lib/time';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ar = locale === 'ar';
  return buildMetadata({
    locale,
    title: ar ? 'خطوط السكك الحديدية المصرية' : 'Egyptian railway lines',
    description: ar
      ? 'كل خطوط قطارات مصر في مكان واحد: الدلتا والصعيد والقناة والفيوم والساحل الشمالي، مع المحطات وعدد الرحلات اليومية.'
      : 'Every Egyptian rail corridor in one place: Delta, Upper Egypt, Canal, Fayoum and the North Coast, with stations and daily service counts.',
    path: '/lines',
  });
}

export default async function LinesPage() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const today = todayCairo();
  const overrides = getPublishedOverrides();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: ar ? 'الرئيسية' : 'Home', path: '/' },
          { name: ar ? 'الخطوط' : 'Lines', path: '/lines' },
        ])}
      />
      <PageHeader
        locale={locale}
        eyebrow={ar ? 'شبكة السكك الحديدية' : 'The network'}
        title={ar ? 'خطوط قطارات مصر' : 'Egyptian railway lines'}
        description={
          ar
            ? 'تسعة خطوط رئيسية تغطي الدلتا والصعيد والقناة والساحل الشمالي. افتح أي خط لمشاهدة محطاته ومواعيد قطاراته ودرجة الثقة في بياناتها.'
            : 'Nine main corridors covering the Delta, Upper Egypt, the Canal and the North Coast. Open any line for its stations, timetables and data confidence.'
        }
        breadcrumbs={[{ label: ar ? 'الخطوط' : 'Lines' }]}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <TrainFront className="h-3 w-3" aria-hidden />
              {countLabel(LINES.length, locale, 'lines')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <MapPin className="h-3 w-3" aria-hidden />
              {countLabel(Object.keys(STATION_MAP).length, locale, 'stations')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <CalendarRange className="h-3 w-3" aria-hidden />
              {SERVICES.length} {ar ? 'رحلة مجدولة' : 'scheduled services'}
            </span>
          </>
        }
      />

      <div className="page-shell py-6">
        <div className="grid gap-3 lg:grid-cols-2">
          {LINES.map((line) => {
            const stations = line.stationIds.map((id) => STATION_MAP[id]).filter(Boolean);
            const services = SERVICES.filter((service) => service.lineId === line.id);
            const runningToday = services.filter(
              (service) => getRunDecision(service, today, overrides).runs,
            ).length;
            return (
              <Link
                key={line.id}
                href={`/line/${line.slug}`}
                className="group panel relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="absolute inset-y-4 start-0 w-1 rounded-e-full" style={{ backgroundColor: line.color }} aria-hidden />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {ar ? line.regionAr : line.regionEn}
                    </p>
                    <h2 className="mt-0.5 text-base font-bold text-ink dark:text-white">
                      {ar ? line.nameAr : line.nameEn}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {line.seasonal ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                        <Snowflake className="h-2.5 w-2.5" aria-hidden />
                        {ar ? 'موسمي' : 'Seasonal'}
                      </span>
                    ) : null}
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                      {runningToday} {ar ? 'رحلة اليوم' : 'today'}
                    </span>
                  </div>
                </div>

                <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  {ar ? line.descriptionAr : line.descriptionEn}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                  {stations.map((station, index) => (
                    <span key={station.id} className="inline-flex items-center gap-1">
                      {index > 0 ? <span className="text-slate-300 dark:text-slate-600">·</span> : null}
                      <span className="font-medium">{ar ? station.nameAr : station.nameEn}</span>
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="num text-[10px] text-slate-400">
                    {line.stationIds.length} {ar ? 'محطة' : 'stations'} · {services.length}{' '}
                    {ar ? 'رحلة' : 'services'}
                  </span>
                  {ar ? (
                    <ArrowLeft className="h-4 w-4 text-slate-300 transition group-hover:-translate-x-0.5 group-hover:text-brand-500" aria-hidden />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden />
                  )}
                </div>

                {line.seasonal && line.season ? (
                  <p className="mt-2 text-[10px] font-medium text-sky-700 dark:text-sky-300">
                    {formatSeason(line.season, locale)}
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-white/10 dark:bg-night-800">
          <p className="text-sm font-semibold text-ink dark:text-white">
            {ar ? 'محتاج تشوف الحركة الآن؟' : 'Need live movement now?'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {ar
              ? 'لوحة المحطة المباشرة تعرض المغادرة والوصول خلال الساعات القادمة.'
              : 'The live station board shows departures and arrivals for the next hours.'}
          </p>
          <Link
            href="/board"
            className="mt-3 inline-flex h-9 items-center rounded-xl bg-brand-700 px-4 text-xs font-semibold text-white transition hover:bg-brand-800 dark:bg-brand-500"
          >
            {ar ? 'افتح اللوحة المباشرة' : 'Open the live board'}
          </Link>
        </div>
      </div>
    </>
  );
}
