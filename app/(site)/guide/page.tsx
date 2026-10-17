import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Clock3 } from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import { GUIDE_ARTICLES } from '@/lib/content';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { formatDateFull } from '@/lib/time';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ar = locale === 'ar';
  return buildMetadata({
    locale,
    title: ar ? 'دليل السفر بالقطار في مصر' : 'The Egyptian rail travel guide',
    description: ar
      ? 'أدلة عملية للحجز واختيار الدرجة ومعرفة فرق Talgo عن الروسي والاقتصادي في الصيف، بدون حشو.'
      : 'Practical guides to booking, choosing a class and understanding Talgo versus Russian AC and summer trains, without the filler.',
    path: '/guide',
  });
}

export default async function GuideIndexPage() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const categories = Array.from(new Set(GUIDE_ARTICLES.map((guide) => (ar ? guide.categoryAr : guide.categoryEn))));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: ar ? 'الرئيسية' : 'Home', path: '/' },
          { name: ar ? 'دليل السفر' : 'Travel guide', path: '/guide' },
        ])}
      />
      <PageHeader
        locale={locale}
        eyebrow={ar ? 'دليل السفر' : 'Travel guide'}
        title={ar ? 'سافر وانت عارف' : 'Travel informed'}
        description={
          ar
            ? 'مش مجرد جداول. هنا نشرح الدرجات والأسعار والتوقيتات وأخطاء الرحلات الشائعة، بلغة واضحة ومبنية على بيانات راكب.'
            : 'More than timetables. Clear explanations of classes, fares, timing and common travel mistakes, grounded in Rakeb data.'
        }
        breadcrumbs={[{ label: ar ? 'دليل السفر' : 'Travel guide' }]}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <BookOpen className="h-3 w-3" aria-hidden />
              {GUIDE_ARTICLES.length} {ar ? 'دليل' : 'guides'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <Clock3 className="h-3 w-3" aria-hidden />
              {GUIDE_ARTICLES.reduce((sum, guide) => sum + guide.readingMinutes, 0)} {ar ? 'دقيقة قراءة' : 'min total'}
            </span>
          </>
        }
      />
      <div className="page-shell py-6">
        <div className="grid gap-3 md:grid-cols-2">
          {GUIDE_ARTICLES.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guide/${guide.slug}`}
              className="group panel relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift dark:hover:border-brand-400/30"
            >
              <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: guide.heroAccent }} aria-hidden />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: guide.heroAccent }}>
                {ar ? guide.categoryAr : guide.categoryEn}
              </p>
              <h2 className="mt-2 text-base font-bold leading-7 text-ink dark:text-white">
                {ar ? guide.titleAr : guide.titleEn}
              </h2>
              <p className="mt-1.5 line-clamp-3 text-[12px] leading-6 text-slate-500 dark:text-slate-400">
                {ar ? guide.excerptAr : guide.excerptEn}
              </p>
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                <span className="num flex items-center gap-1">
                  <Clock3 className="h-3 w-3" aria-hidden />
                  {guide.readingMinutes} {ar ? 'دقائق' : 'min'}
                  {' · '}
                  {formatDateFull(guide.updatedAt, locale)}
                </span>
                {ar ? (
                  <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" aria-hidden />
                ) : (
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <span key={category} className="chip cursor-default">
              {category}
            </span>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-400/20 dark:bg-brand-500/10">
          <h2 className="text-sm font-bold text-brand-900 dark:text-brand-100">
            {ar ? 'عندك سؤال مش هنا؟' : 'Question not covered?'}
          </h2>
          <p className="mt-1 text-[12px] leading-6 text-brand-900/75 dark:text-brand-100/75">
            {ar
              ? 'جرب صفحة الأسئلة الشائعة، أو ابعتلنا سؤالك وهنضيفه لو مفيد لكل الركاب.'
              : 'Try the FAQ page, or send us your question and we will add it if it helps other riders.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/faq" className="text-[11px] font-semibold text-brand-800 underline underline-offset-4 dark:text-brand-200">
              {ar ? 'الأسئلة الشائعة' : 'Read the FAQ'}
            </Link>
            <Link href="/about" className="text-[11px] font-semibold text-brand-800 underline underline-offset-4 dark:text-brand-200">
              {ar ? 'عن راكب' : 'About Rakeb'}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
