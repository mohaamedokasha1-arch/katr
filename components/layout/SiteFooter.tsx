import Link from 'next/link';
import { ArrowUpRight, Database, Mail, WifiOff } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { PWAInstall } from '@/components/layout/PWAInstall';
import { SITE } from '@/lib/content';

const lineLinks = [
  { href: '/line/cairo-alexandria', ar: 'القاهرة – الإسكندرية', en: 'Cairo – Alexandria' },
  { href: '/line/cairo-aswan', ar: 'القاهرة – أسوان', en: 'Cairo – Aswan' },
  { href: '/line/cairo-mansoura-damietta', ar: 'القاهرة – المنصورة – دمياط', en: 'Cairo – Mansoura – Damietta' },
  { href: '/line/cairo-port-said', ar: 'القاهرة – بورسعيد', en: 'Cairo – Port Said' },
  { href: '/line/alexandria-matrouh', ar: 'الإسكندرية – مطروح (موسمي)', en: 'Alexandria – Matrouh (seasonal)' },
];

const stationLinks = [
  { href: '/station/cairo-ramses', ar: 'القاهرة – رمسيس', en: 'Cairo – Ramses' },
  { href: '/station/alexandria-misr', ar: 'الإسكندرية – محطة مصر', en: 'Alexandria – Misr' },
  { href: '/station/tanta', ar: 'طنطا', en: 'Tanta' },
  { href: '/station/asyut', ar: 'أسيوط', en: 'Asyut' },
  { href: '/station/aswan', ar: 'أسوان', en: 'Aswan' },
];

export function SiteFooter({ locale }: { locale: 'ar' | 'en' }) {
  const ar = locale === 'ar';
  const platformLinks = [
    { href: '/about', ar: 'عن راكب', en: 'About Rakeb' },
    { href: '/faq', ar: 'الأسئلة الشائعة', en: 'FAQ' },
    { href: '/guide', ar: 'دليل السفر', en: 'Travel guide' },
    { href: '/board', ar: 'لوحة المحطة المباشرة', en: 'Live station board' },
    { href: '/alerts', ar: 'تنبيهاتي', en: 'My alerts' },
    { href: '/admin/login', ar: 'لوحة الإدارة', en: 'Admin console' },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#051838] text-brand-100">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60" aria-hidden />
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-40" aria-hidden />
      <div className="page-shell relative">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:grid-cols-12 md:gap-8">
          <div className="col-span-2 md:col-span-4">
            <Brand locale={locale} light />
            <p className="mt-4 max-w-xs text-sm leading-7 text-brand-200/80">
              {ar
                ? 'مواعيد قطارات مصر بدرجة ثقة واضحة. نعرض مصدر كل معلومة حتى تعرف بالضبط ماذا تعرف.'
                : 'Egyptian rail timetables with a clear confidence score. Every data point shows its source, so you know exactly what you know.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <PWAInstall locale={locale} />
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-brand-200/80">
                <WifiOff className="h-3.5 w-3.5" aria-hidden />
                {ar ? 'يعمل دون اتصال' : 'Works offline'}
              </span>
            </div>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-5 inline-flex items-center gap-2 text-xs text-brand-200/70 transition hover:text-white"
            >
              <Mail className="h-4 w-4" aria-hidden />
              <span className="num" dir="ltr">{SITE.email}</span>
            </a>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300/60">
              {ar ? 'الخطوط' : 'Lines'}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {lineLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-brand-100/75 transition hover:text-white">
                    {ar ? link.ar : link.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300/60">
              {ar ? 'المحطات' : 'Stations'}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {stationLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-brand-100/75 transition hover:text-white">
                    {ar ? link.ar : link.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300/60">
              {ar ? 'المنصة' : 'Platform'}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1 text-[13px] text-brand-100/75 transition hover:text-white"
                  >
                    {ar ? link.ar : link.en}
                    {link.href === '/admin/login' ? (
                      <ArrowUpRight className="h-3 w-3 opacity-50 transition group-hover:opacity-100" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/offline" className="text-[13px] text-brand-100/50 transition hover:text-white">
                  {ar ? 'وضع عدم الاتصال' : 'Offline mode'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-[12px] leading-6 text-brand-200/70 sm:flex sm:items-start sm:gap-3">
          <Database className="mt-0.5 hidden h-4 w-4 shrink-0 text-brand-300 sm:block" aria-hidden />
          <p>
            {ar
              ? 'تنبيه مهم: راكب مشروع مستقل وغير تابع لهيئة السكك الحديدية المصرية. البيانات هنا استرشادية وليست بديلًا عن الإعلان الرسمي داخل المحطة. الأسعار تقديرية، والمواعيد قد تتغير دون إشعار.'
              : 'Important: Rakeb is an independent project and is not affiliated with Egyptian National Railways. Data is indicative, not a replacement for on-station announcements. Fares are estimates and timetables may change without notice.'}
          </p>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 py-6 text-[11px] text-brand-300/60 sm:flex-row sm:items-center">
          <p className="num" dir="ltr">
            © {new Date().getFullYear()} Rakeb {SITE.version}
          </p>
          <p>
            {ar ? 'صُنع بعناية لمصر 🇪🇬 — اعرف ميعادك قبل ما يفوتك.' : 'Built with care for Egypt — know your train before it leaves.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
