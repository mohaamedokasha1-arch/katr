import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarRange, MapPin, Route, Snowflake, TrainFront } from 'lucide-react';
import type { Locale } from '@/types/rail';
import { LINES } from '@/lib/data/lines';
import { STATIONS } from '@/lib/data/stations';
import { SERVICES } from '@/lib/data/services';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { unique } from '@/lib/utils';

export function CoverageSection({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const governorates = unique(STATIONS.map((station) => station.governorateAr)).length;
  const stats = [
    { value: STATIONS.length, labelAr: 'محطة', labelEn: 'stations', icon: MapPin },
    { value: LINES.length, labelAr: 'خط', labelEn: 'lines', icon: Route },
    { value: SERVICES.length, labelAr: 'رحلة يومية', labelEn: 'daily services', icon: TrainFront },
    { value: governorates, labelAr: 'محافظة', labelEn: 'governorates', icon: CalendarRange },
  ];

  return (
    <section className="page-shell py-10 sm:py-12">
      <SectionHeading
        locale={locale}
        eyebrow={ar ? 'تغطية الشبكة' : 'Network coverage'}
        title={ar ? 'من رمسيس لأسوان… ومن الإسكندرية للسويس' : 'From Ramses to Aswan, Alexandria to Suez'}
        description={
          ar
            ? 'كل الخطوط الرئيسية في مكان واحد، مع تمييز واضح للخطوط الموسمية مثل الساحل الشمالي.'
            : 'Every main corridor in one place, with seasonal lines such as the North Coast clearly marked.'
        }
        action={{ label: ar ? 'كل الخطوط' : 'All lines', href: '/lines' }}
      />

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.labelEn} className="panel flex items-center gap-3 p-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <div className="num text-xl font-semibold leading-none text-ink dark:text-white">
                  {stat.value}
                </div>
                <div className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {ar ? stat.labelAr : stat.labelEn}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {LINES.map((line) => (
          <Link
            key={line.id}
            href={`/line/${line.slug}`}
            className="group panel relative overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span
              className="absolute inset-y-3 start-0 w-1 rounded-e-full"
              style={{ backgroundColor: line.color }}
              aria-hidden
            />
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold text-slate-400">
                  {ar ? line.regionAr : line.regionEn}
                </p>
                <h3 className="mt-0.5 text-[13px] font-bold leading-5 text-ink dark:text-white">
                  {ar ? line.nameAr : line.nameEn}
                </h3>
              </div>
              {line.seasonal ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  <Snowflake className="h-2.5 w-2.5" aria-hidden />
                  {ar ? 'موسمي' : 'Seasonal'}
                </span>
              ) : null}
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="num text-[10px] text-slate-400">
                {line.stationIds.length} {ar ? 'محطة' : 'stations'}
              </span>
              {ar ? (
                <ArrowLeft className="h-3.5 w-3.5 text-slate-300 transition group-hover:-translate-x-0.5 group-hover:text-brand-500" aria-hidden />
              ) : (
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden />
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
