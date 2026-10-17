import Link from 'next/link';
import { ArrowLeft, ArrowRight, BellRing, FileCheck2, WifiOff } from 'lucide-react';
import type { Locale } from '@/types/rail';

export function CtaBand({ locale }: { locale: Locale }) {
  const ar = locale === 'ar';
  const features = [
    {
      icon: WifiOff,
      ar: 'يعمل بدون إنترنت',
      en: 'Works offline',
      descAr: 'ثبّته كتطبيق، وافتح رحلتك المحفوظة حتى لو الشبكة ضعيفة داخل المحطة.',
      descEn: 'Install it and open saved trips even when the station signal drops.',
    },
    {
      icon: BellRing,
      ar: 'تنبيهات قبل الموعد',
      en: 'Pre-departure alerts',
      descAr: 'اختر 30 أو 60 أو 120 دقيقة قبل التحرك، وتابع أي تغيير منشور.',
      descEn: 'Choose 30, 60 or 120 minutes before departure and follow published changes.',
    },
    {
      icon: FileCheck2,
      ar: 'شارك بمعلومة',
      en: 'Contribute a report',
      descAr: 'بلاغك من المحطة يساعد غيرك — بعد تأكيد مستقل من عدة ركاب.',
      descEn: 'Your report from the station helps others — after independent confirmation.',
    },
  ];

  return (
    <section className="page-shell pb-12 pt-2">
      <div className="relative overflow-hidden rounded-3xl bg-[#0B3D91] p-6 text-white sm:p-8 lg:p-10 dark:bg-brand-900">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-40" aria-hidden />
        <div className="pointer-events-none absolute -end-20 -top-24 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 start-1/3 h-64 w-64 rounded-full bg-signal/10 blur-3xl" aria-hidden />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow text-brand-200">{ar ? 'ركّب راكب' : 'Install Rakeb'}</p>
            <h2 className="mt-2 text-2xl font-bold leading-snug sm:text-3xl">
              {ar ? 'خلي ميعادك في جيبك، مش في بحث فيسبوك.' : 'Keep your departure in your pocket, not in a Facebook search.'}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-brand-100/80">
              {ar
                ? 'ثبّت المنصة على شاشتك الرئيسية، احفظ الرحلات، واضبط تنبيهًا قبل التحرك — كل ذلك بدون حساب أو تسجيل.'
                : 'Install the platform on your home screen, save trips and set a reminder before departure — with no account required.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/search"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-brand-900 transition hover:bg-brand-50"
              >
                {ar ? 'ابدأ البحث' : 'Start searching'}
                {ar ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </Link>
              <Link
                href="/alerts"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <BellRing className="h-4 w-4" aria-hidden />
                {ar ? 'تنبيهاتي' : 'My alerts'}
              </Link>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.en}
                  className="rounded-xl border border-white/10 bg-white/[0.055] p-3.5 backdrop-blur-sm"
                >
                  <Icon className="h-4 w-4 text-brand-200" aria-hidden />
                  <h3 className="mt-2 text-[12px] font-bold">{ar ? feature.ar : feature.en}</h3>
                  <p className="mt-1 text-[10px] leading-5 text-brand-100/65">
                    {ar ? feature.descAr : feature.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
