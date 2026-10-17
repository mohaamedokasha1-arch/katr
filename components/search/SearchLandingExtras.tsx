import Link from 'next/link';
import { BellRing, MonitorPlay, Search, ShieldCheck, WifiOff } from 'lucide-react';
import type { Locale } from '@/types/rail';

export function SearchLandingExtras({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const items = [
    {
      icon: ShieldCheck,
      titleAr: 'درجة ثقة لكل معلومة',
      titleEn: 'Confidence on every fact',
      bodyAr: 'تعرف هل الموعد رسمي، قياسي، مؤكد من الركاب، أم يحتاج تحققًا قبل السفر.',
      bodyEn: 'See whether a time is official, standard, rider-confirmed or needs a check before travelling.',
      href: '/faq#confidence',
      ctaAr: 'كيف تُحسب',
      ctaEn: 'How it works',
    },
    {
      icon: MonitorPlay,
      titleAr: 'لوحة محطة من بيتك',
      titleEn: 'A station board from home',
      bodyAr: 'شوف المغادرة والوصول لأي محطة رئيسية قبل ما تتحرك للمحطة.',
      bodyEn: 'Check departures and arrivals at any major station before leaving home.',
      href: '/board',
      ctaAr: 'افتح اللوحة',
      ctaEn: 'Open the board',
    },
    {
      icon: WifiOff,
      titleAr: 'يعمل والشبكة ضعيفة',
      titleEn: 'Works on weak signal',
      bodyAr: 'ثبّت التطبيق واحفظ رحلتك، وتقدر تفتحها حتى بدون إنترنت.',
      bodyEn: 'Install the app and save your trip so you can open it even offline.',
      href: '/about#offline',
      ctaAr: 'اعرف أكثر',
      ctaEn: 'Learn more',
    },
  ];

  return (
    <section className="page-shell pb-12">
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.titleEn} className="panel p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <h2 className="mt-2.5 text-sm font-bold text-ink dark:text-white">
                {ar ? item.titleAr : item.titleEn}
              </h2>
              <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                {ar ? item.bodyAr : item.bodyEn}
              </p>
              <Link href={item.href} className="mt-2 inline-block text-[10px] font-semibold text-brand-700 dark:text-brand-300">
                {ar ? item.ctaAr : item.ctaEn} ←
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-400/20 dark:bg-brand-500/10">
        <div className="flex items-start gap-2">
          <Search className="mt-0.5 h-4 w-4 text-brand-700 dark:text-brand-300" aria-hidden />
          <div>
            <p className="text-xs font-bold text-brand-900 dark:text-brand-100">
              {ar ? 'معاك رقم القطار؟' : 'Know your train number?'}
            </p>
            <p className="mt-0.5 text-[11px] text-brand-800/70 dark:text-brand-200/70">
              {ar
                ? 'استخدم البحث برقم القطار في أعلى الصفحة، أو افتح صفحة الخط لمشاهدة كل رحلاته.'
                : 'Use train-number search at the top of the page, or open a line page for all its services.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/lines" className="rounded-lg border border-brand-300 px-3 py-1.5 text-[11px] font-semibold text-brand-800 transition hover:bg-white/50 dark:border-brand-400/30 dark:text-brand-200">
            {ar ? 'الخطوط' : 'Lines'}
          </Link>
          <Link href="/alerts" className="inline-flex items-center gap-1 rounded-lg bg-brand-700 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-800 dark:bg-brand-500">
            <BellRing className="h-3 w-3" aria-hidden />
            {ar ? 'تنبيهاتي' : 'My alerts'}
          </Link>
        </div>
      </div>
    </section>
  );
}
