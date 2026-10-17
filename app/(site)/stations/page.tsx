import type { Metadata } from 'next';
import { MapPinned, TrainFront } from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import { STATIONS } from '@/lib/data/stations';
import { countLabel } from '@/lib/display';
import { PageHeader } from '@/components/layout/PageHeader';
import { StationDirectory } from '@/components/stations/StationDirectory';
import { JsonLd } from '@/components/seo/JsonLd';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ar = locale === 'ar';
  return buildMetadata({
    locale,
    title: ar ? 'دليل محطات القطارات في مصر' : 'Egyptian train station directory',
    description: ar
      ? 'كل محطات القطارات الرئيسية والفرعية في مصر، مع المحافظة والخطوط والمرافق وروابط لوحة الحركة المباشرة لكل محطة.'
      : 'Every major and district train station in Egypt, with governorate, lines, facilities and a live board link for each station.',
    path: '/stations',
  });
}

export default async function StationsPage() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const searchable = STATIONS.filter((station) => station.searchable);
  const governorates = new Set(searchable.map((station) => station.governorateAr));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: ar ? 'الرئيسية' : 'Home', path: '/' },
          { name: ar ? 'المحطات' : 'Stations', path: '/stations' },
        ])}
      />
      <PageHeader
        locale={locale}
        eyebrow={ar ? 'دليل المحطات' : 'Station directory'}
        title={ar ? 'محطات القطارات في مصر' : 'Egyptian train stations'}
        description={
          ar
            ? 'ابحث عن محطتك بالاسم الشائع أو الكود، وافتح صفحتها لمعرفة الخطوط والمرافق ولوحة الحركة المباشرة. المحطات الصغيرة جدًا تظهر داخل مسار الرحلة فقط.'
            : 'Find your station by common name or code, then open its page for lines, facilities and a live board. Tiny request stops only appear inside trip routes.'
        }
        breadcrumbs={[{ label: ar ? 'المحطات' : 'Stations' }]}
        meta={
          <>
            <span className="num inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <TrainFront className="h-3 w-3" aria-hidden />
              {countLabel(searchable.length, locale, 'stations')}
            </span>
            <span className="num inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <MapPinned className="h-3 w-3" aria-hidden />
              {governorates.size} {ar ? 'محافظة' : 'governorates'}
            </span>
          </>
        }
      />
      <div className="page-shell py-6">
        <StationDirectory locale={locale} />
      </div>
    </>
  );
}
