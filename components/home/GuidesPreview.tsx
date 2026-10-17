import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import type { Locale } from '@/types/rail';
import { GUIDE_ARTICLES } from '@/lib/content';
import { SectionHeading } from '@/components/ui/SectionHeading';

export function GuidesPreview({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const guides = GUIDE_ARTICLES.slice(0, 3);

  return (
    <section className="page-shell py-10 sm:py-12">
      <SectionHeading
        locale={locale}
        eyebrow={ar ? 'قبل ما تسافر' : 'Before you travel'}
        title={ar ? 'دليل السفر بالقطار في مصر' : 'The Egyptian rail travel guide'}
        description={
          ar
            ? 'محتوى عملي عن الحجز والدرجات والتوفير والموسمية، مكتوب ليريحك من البحث العشوائي.'
            : 'Practical content on booking, classes, saving and seasons — written to replace scattered searching.'
        }
        action={{ label: ar ? 'كل الأدلة' : 'All guides', href: '/guide' }}
      />
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {guides.map((guide, index) => (
          <Link
            key={guide.slug}
            href={`/guide/${guide.slug}`}
            className="group panel flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div
              className="relative h-24 overflow-hidden"
              style={{ backgroundColor: guide.heroAccent }}
            >
              <div className="absolute inset-0 opacity-30 hero-grid" aria-hidden />
              <span className="num absolute end-3 top-3 text-[10px] font-bold uppercase tracking-widest text-white/70">
                0{index + 1}
              </span>
              <span className="absolute bottom-3 start-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur">
                <BookOpen className="h-2.5 w-2.5" aria-hidden />
                {ar ? guide.categoryAr : guide.categoryEn}
              </span>
              <svg className="absolute -bottom-1 end-0 h-16 w-40 opacity-40" viewBox="0 0 160 64" fill="none" aria-hidden>
                <path d="M-5 55 C 40 55, 40 30, 80 30 S 120 8, 165 8" stroke="white" strokeWidth="2" strokeDasharray="4 5" />
              </svg>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-sm font-bold leading-6 text-ink transition group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                {ar ? guide.titleAr : guide.titleEn}
              </h3>
              <p className="mt-1.5 line-clamp-2 flex-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                {ar ? guide.excerptAr : guide.excerptEn}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-white/10">
                <span className="num text-[10px] text-slate-400">
                  {guide.readingMinutes} {ar ? 'دقائق قراءة' : 'min read'}
                </span>
                {ar ? (
                  <ArrowLeft className="h-3.5 w-3.5 text-slate-300 transition group-hover:-translate-x-0.5 group-hover:text-brand-500" aria-hidden />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden />
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
