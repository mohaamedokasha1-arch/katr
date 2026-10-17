import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, ListTree } from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata, breadcrumbJsonLd, absoluteUrl } from '@/lib/seo';
import { GUIDE_ARTICLES } from '@/lib/content';
import { STATION_MAP } from '@/lib/data/stations';
import { routePairPath } from '@/lib/data/station-slugs';
import { formatDateFull } from '@/lib/time';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { GuideBlocks, guideSections } from '@/components/content/GuideBlocks';
import { buttonClasses } from '@/components/ui/Button';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return GUIDE_ARTICLES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const guide = GUIDE_ARTICLES.find((item) => item.slug === slug);
  const ar = locale === 'ar';
  if (!guide) {
    return buildMetadata({
      locale,
      title: ar ? 'دليل غير موجود' : 'Guide not found',
      description: '',
      path: `/guide/${slug}`,
      noindex: true,
    });
  }
  return buildMetadata({
    locale,
    title: ar ? guide.titleAr : guide.titleEn,
    description: ar ? guide.excerptAr : guide.excerptEn,
    path: `/guide/${guide.slug}`,
    type: 'article',
  });
}

export default async function GuideArticlePage({ params }: { params: Params }) {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const { slug } = await params;
  const guide = GUIDE_ARTICLES.find((item) => item.slug === slug);
  if (!guide) notFound();

  const sections = guideSections(guide, locale);
  const index = GUIDE_ARTICLES.findIndex((item) => item.slug === guide.slug);
  const next = GUIDE_ARTICLES[(index + 1) % GUIDE_ARTICLES.length];
  const related = guide.relatedRoutes
    .map((route) => ({
      ...route,
      from: STATION_MAP[route.fromId],
      to: STATION_MAP[route.toId],
    }))
    .filter((route) => route.from && route.to);

  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: ar ? guide.titleAr : guide.titleEn,
            description: ar ? guide.excerptAr : guide.excerptEn,
            dateModified: guide.updatedAt,
            inLanguage: ar ? 'ar-EG' : 'en',
            author: { '@type': 'Organization', name: ar ? 'راكب' : 'Rakeb' },
            publisher: { '@type': 'Organization', name: ar ? 'راكب' : 'Rakeb' },
            mainEntityOfPage: absoluteUrl(`/guide/${guide.slug}`),
          },
          breadcrumbJsonLd([
            { name: ar ? 'الرئيسية' : 'Home', path: '/' },
            { name: ar ? 'دليل السفر' : 'Travel guide', path: '/guide' },
            { name: ar ? guide.titleAr : guide.titleEn, path: `/guide/${guide.slug}` },
          ]),
        ]}
      />
      <PageHeader
        locale={locale}
        eyebrow={ar ? guide.categoryAr : guide.categoryEn}
        title={ar ? guide.titleAr : guide.titleEn}
        description={ar ? guide.excerptAr : guide.excerptEn}
        accentColor={guide.heroAccent}
        breadcrumbs={[
          { label: ar ? 'دليل السفر' : 'Travel guide', href: '/guide' },
          { label: ar ? guide.categoryAr : guide.categoryEn },
        ]}
        meta={
          <>
            <span className="num inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <Clock3 className="h-3 w-3" aria-hidden />
              {guide.readingMinutes} {ar ? 'دقائق قراءة' : 'min read'}
            </span>
            <span className="num inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <CalendarDays className="h-3 w-3" aria-hidden />
              {formatDateFull(guide.updatedAt, locale)}
            </span>
          </>
        }
      />

      <div className="page-shell grid gap-6 py-6 lg:grid-cols-[1fr_260px]">
        <article className="panel p-5 sm:p-7">
          <GuideBlocks article={guide} locale={locale} />

          {related.length > 0 ? (
            <div className="mt-7 border-t border-slate-100 pt-5 dark:border-white/5">
              <h2 className="text-sm font-bold text-ink dark:text-white">
                {ar ? 'طبّق الكلام ده على خط' : 'Apply this to a line'}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {related.map((route) => (
                  <Link
                    key={`${route.fromId}-${route.toId}`}
                    href={routePairPath(route.fromId, route.toId)}
                    className={buttonClasses({ size: 'sm', variant: 'secondary' })}
                  >
                    {ar ? route.from.nameAr : route.from.nameEn}
                    <span aria-hidden> → </span>
                    {ar ? route.to.nameAr : route.to.nameEn}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3.5 dark:bg-white/5">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {ar ? 'الدليل ده جزء من دليل راكب للسفر.' : 'This piece is part of the Rakeb travel guide.'}
            </p>
            <Link href="/search" className={buttonClasses({ size: 'sm' })}>
              {ar ? 'دوّر على رحلتك' : 'Find your trip'}
            </Link>
          </div>
        </article>

        <aside className="space-y-3">
          {sections.length > 0 ? (
            <nav className="panel p-4 lg:sticky lg:top-20">
              <h2 className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
                <ListTree className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" aria-hidden />
                {ar ? 'محتويات الدليل' : 'In this guide'}
              </h2>
              <ol className="mt-2 space-y-1.5">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block rounded-md px-1.5 py-1 text-[11px] leading-5 text-slate-500 transition hover:bg-slate-50 hover:text-brand-700 dark:text-slate-400 dark:hover:bg-white/5"
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <div className="panel p-4">
            <h2 className="text-xs font-bold text-ink dark:text-white">
              {ar ? 'الدليل التالي' : 'Read next'}
            </h2>
            <Link href={`/guide/${next.slug}`} className="group mt-2 block">
              <p className="text-[11px] font-semibold leading-6 text-ink transition group-hover:text-brand-700 dark:text-slate-200 dark:group-hover:text-brand-300">
                {ar ? next.titleAr : next.titleEn}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                {next.readingMinutes} {ar ? 'دقائق' : 'min'}
              </p>
            </Link>
            <Link
              href="/guide"
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 dark:text-brand-300"
            >
              {ar ? (
                <ArrowRight className="h-3 w-3 rotate-180" aria-hidden />
              ) : (
                <ArrowLeft className="h-3 w-3" aria-hidden />
              )}
              {ar ? 'كل الأدلة' : 'All guides'}
            </Link>
          </div>

          <p className="px-1 text-[9px] leading-5 text-slate-400">
            {ar
              ? 'آخر تحديث للدليل: ' + formatDateFull(guide.updatedAt, locale) + '. الأسعار نطاقات تقديرية وليست عرضًا للحجز.'
              : `Last updated ${formatDateFull(guide.updatedAt, locale)}. Fares are estimates, not a booking offer.`}
          </p>
        </aside>
      </div>
    </>
  );
}
