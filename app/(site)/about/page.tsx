import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BadgeCheck,
  Building2,
  Code2,
  Gauge,
  HeartHandshake,
  Layers,
  MessageCircleQuestion,
  ShieldCheck,
  TrainFront,
  Users,
} from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/content';
import { STATIONS } from '@/lib/data/stations';
import { LINES } from '@/lib/data/lines';
import { SERVICES } from '@/lib/data/services';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionHeading } from '@/components/ui/SectionHeading';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ar = locale === 'ar';
  return buildMetadata({
    locale,
    title: ar ? 'عن راكب — من إحنا وبنشتغل إزاي' : 'About Rakeb — who we are and how we work',
    description: ar
      ? 'راكب منصة مستقلة لمواعيد القطار في مصر. نعرض بياناتنا بدرجة ثقة صريحة، ومصادرنا وأساليب التحقق.'
      : 'Rakeb is an independent Egyptian rail timetable platform. We show an explicit confidence level, our sources and our verification method.',
    path: '/about',
  });
}

const dataTiers = [
  {
    icon: BadgeCheck,
    ar: 'بيانات رسمية',
    en: 'Official data',
    bodyAr: 'جداول منشورة من الهيئة أو شريك رسمي، درجة الثقة الأعلى ووسم أخضر.',
    bodyEn: 'Timetables published by ENR or an official partner. Highest confidence and a green badge.',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    icon: Gauge,
    ar: 'جدول قياسي',
    en: 'Standard schedule',
    bodyAr: 'الجدول المعتمد للخط، ونشتغل عليه لحد ما يصله تحديث مؤكد. وسم أزرق.',
    bodyEn: 'The line’s standard timetable, used until a verified update arrives. Blue badge.',
    color: 'text-brand-700 dark:text-brand-300',
    bg: 'bg-brand-50 dark:bg-brand-500/10',
  },
  {
    icon: Users,
    ar: 'تأكيد الركاب',
    en: 'Crowd-confirmed',
    bodyAr: 'ثلاثة بلاغات مستقلة على الأقل في نافذة 45 دقيقة، بدون تكرار من نفس الجهاز. وسم برتقالي.',
    bodyEn: 'At least three independent reports within 45 minutes, no duplicates from one device. Orange badge.',
    color: 'text-signal-ink dark:text-orange-300',
    bg: 'bg-signal-soft dark:bg-signal/10',
  },
  {
    icon: Layers,
    ar: 'بيانات قديمة',
    en: 'Stale data',
    bodyAr: 'مرّ وقت طويل على آخر تحقق. بنقولها بصراحة بدل ما نوهمك بدقة مش موجودة. وسم رمادي.',
    bodyEn: 'A long time since the last verification. We say so rather than fake precision. Grey badge.',
    color: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-white/10',
  },
];

const principles = [
  {
    icon: ShieldCheck,
    ar: 'الصدق قبل الكمال',
    en: 'Honesty before polish',
    bodyAr: 'لو مش متأكدين، بنقول. وسم الثقة ظاهر على كل رحلة مش مخبّى في صفحة تانية.',
    bodyEn: 'If we are unsure, we say it. The confidence badge sits on every trip, not buried on another page.',
  },
  {
    icon: HeartHandshake,
    ar: 'مبني للراكب المصري',
    en: 'Built for Egyptian riders',
    bodyAr: 'عربي مصري طبيعي، أسماء محطات شائعة، وأرقام واضحة. المحطة اسمها "رمسيس" مش "Cairo Station".',
    bodyEn: 'Natural Egyptian Arabic, colloquial station names and legible numbers. It is Ramses, not just “Cairo Station”.',
  },
  {
    icon: TrainFront,
    ar: 'سريع على شبكة بطيئة',
    en: 'Fast on a slow network',
    bodyAr: 'صفحات خفيفة، واجهة تشتغل أوفلاين، ولوحة محطة تقرأ بلمحة واحدة من بعيد.',
    bodyEn: 'Light pages, an offline shell and a station board you can read at a glance from a distance.',
  },
  {
    icon: Code2,
    ar: 'مفتوح للمساءلة',
    en: 'Accountable by design',
    bodyAr: 'كل تغيير إداري له سجل تدقيق، وبلاغات الركاب تتحوّل لبيانات قابلة للتتبع بعد التأكيد.',
    bodyEn: 'Every admin change lands in an audit log, and confirmed rider reports become traceable data.',
  },
];

export default async function AboutPage() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const searchable = STATIONS.filter((station) => station.searchable).length;

  return (
    <>
      <PageHeader
        locale={locale}
        eyebrow={ar ? 'عن راكب' : 'About Rakeb'}
        title={ar ? 'راكِب: ميعادك قبل ما تفوت' : 'Rakeb: know your train before it leaves'}
        description={
          ar
            ? 'منصة مستقلة تجمع مواعيد القطارات في مصر، وتوضح لكل معلومة مصدرها ودرجة ثقتها، من غير ما تبيع تذاكر أو تدّعي الرسمية.'
            : 'An independent platform collecting Egyptian train times, showing the source and confidence behind every fact — without selling tickets or claiming to be official.'
        }
        breadcrumbs={[{ label: ar ? 'عن راكب' : 'About Rakeb' }]}
      />

      <div className="page-shell py-6">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { value: `${LINES.length}`, ar: 'خط رئيسي', en: 'line groups' },
            { value: `${searchable}`, ar: 'محطة قابلة للبحث', en: 'searchable stations' },
            { value: `${SERVICES.length}`, ar: 'خدمة قطار', en: 'train services' },
            { value: '4', ar: 'مستويات ثقة', en: 'confidence levels' },
          ].map((stat) => (
            <div key={stat.en} className="panel p-4">
              <p className="num text-3xl font-semibold text-brand-700 dark:text-brand-300">{stat.value}</p>
              <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {ar ? stat.ar : stat.en}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <SectionHeading
            locale={locale}
            eyebrow={ar ? 'مصادر البيانات' : 'Data sources'}
            title={ar ? 'أربع طبقات، أربع درجات ثقة' : 'Four tiers, four confidence levels'}
            description={
              ar
                ? 'مش كل معلومة بتتولد بنفس الطريقة. كل طبقة لها مصدر ووسم بيظهر لك على الشاشة.'
                : 'Not every fact is born the same way. Each tier has a source and a badge you can see on screen.'
            }
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {dataTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div key={tier.en} className="panel p-4">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${tier.bg} ${tier.color}`}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <h3 className="mt-2 text-sm font-bold text-ink dark:text-white">
                    {ar ? tier.ar : tier.en}
                  </h3>
                  <p className="mt-1 text-[11px] leading-6 text-slate-500 dark:text-slate-400">
                    {ar ? tier.bodyAr : tier.bodyEn}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <SectionHeading
            locale={locale}
            eyebrow={ar ? 'مبادئنا' : 'Principles'}
            title={ar ? 'قواعد بنشتغل بيها' : 'Rules we work by'}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {principles.map((principle) => {
              const Icon = principle.icon;
              return (
                <div key={principle.en} className="panel p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden />
                    <h3 className="text-xs font-bold text-ink dark:text-white">
                      {ar ? principle.ar : principle.en}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-6 text-slate-500 dark:text-slate-400">
                    {ar ? principle.bodyAr : principle.bodyEn}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
          <div className="panel p-5">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink dark:text-white">
              <Building2 className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden />
              {ar ? 'إيه اللي راكب بيعمله ومش بيعمله' : 'What Rakeb does and does not do'}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {ar ? 'بنعمله' : 'We do'}
                </p>
                <ul className="mt-1.5 space-y-1 text-[11px] leading-6 text-slate-600 dark:text-slate-300">
                  <li>• {ar ? 'نجمع ونعرض المواعيد بدرجة ثقة' : 'Collect and display times with confidence'}</li>
                  <li>• {ar ? 'نعرض نطاقات سعرية تقديرية' : 'Show estimated fare ranges'}</li>
                  <li>• {ar ? 'نستقبل بلاغات الركاب ونتحقق منها' : 'Accept and verify rider reports'}</li>
                  <li>• {ar ? 'ننبّهك قبل ميعاد القطر' : 'Remind you before departure'}</li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {ar ? 'مش بنعمله' : 'We don’t'}
                </p>
                <ul className="mt-1.5 space-y-1 text-[11px] leading-6 text-slate-600 dark:text-slate-300">
                  <li>• {ar ? 'مش بنبيع تذاكر ولا بنحصل فلوس حجز' : 'Sell tickets or take booking money'}</li>
                  <li>• {ar ? 'مش جهة رسمية ولا بنتكلم باسم الهيئة' : 'Claim to be official or speak for ENR'}</li>
                  <li>• {ar ? 'مش بنخمّن سعر نهائي' : 'Invent a final fare'}</li>
                  <li>• {ar ? 'مش بنشارك بيانات شخصية بدون موافقة' : 'Share personal data without consent'}</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-[10px] leading-5 text-slate-500 dark:bg-white/5 dark:text-slate-400">
              {ar
                ? 'عند أي تعارض، الجدول الرسمي المنشور في المحطة هو المرجع. راكب أداة مساعدة للتخطيط، وليست بديلًا عن الإعلان الرسمي.'
                : 'In any conflict the official timetable posted at the station wins. Rakeb is a planning aid, not a substitute for official announcements.'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-400/20 dark:bg-brand-500/10">
              <h2 className="text-xs font-bold text-brand-900 dark:text-brand-100">
                {ar ? 'المصادر والتحديثات' : 'Sources and updates'}
              </h2>
              <p className="mt-1.5 text-[11px] leading-6 text-brand-900/75 dark:text-brand-100/75">
                {ar
                  ? 'بنراجع الجداول دوريًا، ونعتمد على تحديثات رسمية عند توفرها وبلاغات ركاب مؤكدة في باقي الأوقات. النتائج تُخزَّن مع تاريخ آخر تحقق.'
                  : 'We review timetables on a schedule, prefer official updates when available and rely on confirmed rider reports otherwise. Every result carries a last-verified date.'}
              </p>
            </div>
            <div className="panel p-4">
              <h2 className="text-xs font-bold text-ink dark:text-white">
                {ar ? 'تواصل معانا' : 'Talk to us'}
              </h2>
              <p className="mt-1 text-[11px] leading-6 text-slate-500 dark:text-slate-400">
                {ar
                  ? 'خطأ في ميعاد؟ محطة ناقصة؟ ابعتلنا.' : 'A wrong time? A missing station? Tell us.'}
              </p>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-1.5 inline-block text-[11px] font-semibold text-brand-700 underline underline-offset-4 dark:text-brand-300"
              >
                {SITE.email}
              </a>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/faq" className="text-[10px] font-semibold text-slate-500 underline underline-offset-4 dark:text-slate-400">
                  {ar ? 'الأسئلة الشائعة' : 'FAQ'}
                </Link>
                <Link href="/guide" className="text-[10px] font-semibold text-slate-500 underline underline-offset-4 dark:text-slate-400">
                  {ar ? 'دليل السفر' : 'Travel guide'}
                </Link>
              </div>
            </div>
            <div className="panel flex items-start gap-2 p-4 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
              <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              {ar
                ? 'إصدار ' + SITE.version + ' — نسخة عرض تجريبي. أسماء الخطوط والمحطات تعكس الاستخدام الشائع بين الركاب.'
                : `Version ${SITE.version} — demo release. Line and station names follow common rider usage.`}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
