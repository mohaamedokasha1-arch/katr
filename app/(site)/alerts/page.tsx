import type { Metadata } from 'next';
import { BellRing } from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata } from '@/lib/seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { AlertsCenter } from '@/components/alerts/AlertsCenter';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ar = locale === 'ar';
  return buildMetadata({
    locale,
    title: ar ? 'تنبيهاتي وتذكيرات الرحلات' : 'My alerts and trip reminders',
    description: ar
      ? 'كل تذكيرات القطارات المحفوظة على جهازك، مع حالة الإشعارات وروابط الرحلات.'
      : 'Every train reminder saved on your device, with notification status and trip links.',
    path: '/alerts',
    noindex: true,
  });
}

export default async function AlertsPage() {
  const locale = await getLocale();
  const ar = locale === 'ar';

  return (
    <>
      <PageHeader
        locale={locale}
        eyebrow={ar ? 'تنبيهاتي' : 'My alerts'}
        title={ar ? 'متنساش ميعادك' : 'Never miss your departure'}
        description={
          ar
            ? 'تذكيراتك محفوظة على جهازك بدون حساب. فعّل إشعارات المتصفح وهنبهك قبل تحرك القطر.'
            : 'Your reminders are saved on this device without an account. Turn on browser notifications and we will nudge you before the train.'
        }
        breadcrumbs={[{ label: ar ? 'تنبيهاتي' : 'My alerts' }]}
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
            <BellRing className="h-3 w-3" aria-hidden />
            {ar ? 'بدون حساب' : 'No account needed'}
          </span>
        }
      />
      <div className="page-shell py-6">
        <AlertsCenter locale={locale} />
      </div>
    </>
  );
}
