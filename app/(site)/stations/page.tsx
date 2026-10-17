import type { Metadata } from 'next';
import { MapPinned, TrainFront } from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import { GOVERNORATES, STATIONS } from '@/lib/data/stations';
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
  const governorates = new Set(GOVERNORATES.filter((g) => g.railStatus !== 'none').map((g) => g.nameAr));

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
        <section className="panel mb-4 p-4">
          <h2 className="text-sm font-bold text-ink dark:text-white">{ar ? 'كل محافظات مصر (27) وحالة خدمة القطارات' : 'All 27 Egyptian governorates & rail status'}</h2>
          <p className="mt-1 text-[10px] leading-5 text-slate-400">
            {ar
              ? '24 محافظة تخدمها محطات مسجلة هنا. المحافظات دون خدمة ركاب موثقة موضحة كما هي — لن تجد لها محطات أو مواعيد مخترعة.'
              : '24 governorates are served by registered stations. Governorates with no documented passenger service are stated as-is — you will not find invented stations or times for them.'}
          </p>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {GOVERNORATES.map((g) => (
              <li key={g.nameEn} className="flex items-baseline gap-2 rounded-lg border border-slate-100 px-2.5 py-2 text-[11px] dark:border-white/5">
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${g.railStatus === 'served' ? 'bg-emerald-500' : g.railStatus === 'limited' ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`} aria-hidden />
                <span>
                  <span className="font-semibold text-ink dark:text-white">{ar ? g.nameAr : g.nameEn}</span>
                  <span className="block text-[10px] text-slate-400">{ar ? g.noteAr : g.noteEn}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <StationDirectory locale={locale} />
      </div>
    </>
  );
}
