import type { Metadata } from 'next';
import Link from 'next/link';
import { LifeBuoy, MessageCircleQuestion } from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata, breadcrumbJsonLd, faqJsonLd } from '@/lib/seo';
import { FAQ_ITEMS, SITE } from '@/lib/content';
import { PageHeader } from '@/components/layout/PageHeader';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqAccordion } from '@/components/content/FaqAccordion';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ar = locale === 'ar';
  return buildMetadata({
    locale,
    title: ar ? 'الأسئلة الشائعة عن مواعيد القطارات' : 'Frequently asked questions',
    description: ar
      ? 'إجابات مباشرة عن درجة الثقة ومواعيد القطارات والحجز والتأخيرات وإشعارات راكب على الموبايل.'
      : 'Direct answers on confidence scores, train times, booking, delays and Rakeb mobile alerts.',
    path: '/faq',
  });
}

export default async function FaqPage() {
  const locale = await getLocale();
  const ar = locale === 'ar';

  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(FAQ_ITEMS, locale),
          breadcrumbJsonLd([
            { name: ar ? 'الرئيسية' : 'Home', path: '/' },
            { name: ar ? 'الأسئلة الشائعة' : 'FAQ', path: '/faq' },
          ]),
        ]}
      />
      <PageHeader
        locale={locale}
        eyebrow={ar ? 'أسئلة شائعة' : 'FAQ'}
        title={ar ? 'أسئلة بتتكرر كتير' : 'Questions riders ask'}
        description={
          ar
            ? 'كل حاجة عن مصدر البيانات ودرجة الثقة والرحلات والتنبيهات. لو سؤالك مش هنا، ابعتلنا.'
            : 'Everything about data sources, confidence levels, trips and alerts. If your question is missing, write to us.'
        }
        breadcrumbs={[{ label: ar ? 'الأسئلة الشائعة' : 'FAQ' }]}
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
            <MessageCircleQuestion className="h-3 w-3" aria-hidden />
            {FAQ_ITEMS.length} {ar ? 'سؤال' : 'questions'}
          </span>
        }
      />
      <div className="page-shell grid gap-4 py-6 lg:grid-cols-[1fr_280px]">
        <FaqAccordion items={FAQ_ITEMS} locale={locale} />

        <aside className="space-y-3">
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-400/20 dark:bg-brand-500/10">
            <h2 className="flex items-center gap-1.5 text-xs font-bold text-brand-900 dark:text-brand-100">
              <LifeBuoy className="h-3.5 w-3.5" aria-hidden />
              {ar ? 'محتاج مساعدة أكتر؟' : 'Need more help?'}
            </h2>
            <p className="mt-1.5 text-[11px] leading-6 text-brand-900/75 dark:text-brand-100/75">
              {ar
                ? 'ابعتلنا عالـبريد وهنرد عليك، أو راجع دليل السفر للتفاصيل العملية.'
                : 'Email us and we will reply, or check the travel guide for practical detail.'}
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-2 inline-block text-[11px] font-semibold text-brand-800 underline underline-offset-4 dark:text-brand-200"
            >
              {SITE.email}
            </a>
          </div>

          <div className="panel p-4">
            <h2 className="text-xs font-bold text-ink dark:text-white">
              {ar ? 'روابط سريعة' : 'Quick links'}
            </h2>
            <ul className="mt-2 space-y-1.5 text-[11px]">
              {[
                { href: '/guide', ar: 'دليل السفر', en: 'Travel guide' },
                { href: '/status', ar: 'حالة الشبكة', en: 'Network status' },
                { href: '/lines', ar: 'الخطوط والمسارات', en: 'Lines & routes' },
                { href: '/stations', ar: 'دليل المحطات', en: 'Station directory' },
                { href: '/about', ar: 'عن راكب', en: 'About Rakeb' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-md px-1.5 py-1 text-slate-500 transition hover:bg-slate-50 hover:text-brand-700 dark:text-slate-400 dark:hover:bg-white/5"
                  >
                    {ar ? link.ar : link.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <p className="px-1 text-[9px] leading-5 text-slate-400">
            {ar
              ? 'راكب منصة مستقلة وغير تابعة للهيئة القومية لسكك حديد مصر. المواعيد الرسمية هي المرجع النهائي عند التعارض.'
              : 'Rakeb is independent and not affiliated with Egyptian National Railways. Official timetables prevail in any conflict.'}
          </p>
        </aside>
      </div>
    </>
  );
}
