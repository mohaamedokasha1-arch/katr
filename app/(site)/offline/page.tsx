import type { Metadata } from 'next';
import Link from 'next/link';
import { CloudOff, Clock3, ListChecks, RefreshCw, WifiOff } from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata } from '@/lib/seo';
import { PageHeader } from '@/components/layout/PageHeader';
import { buttonClasses } from '@/components/ui/Button';
import { OfflineChecklist } from '@/components/layout/OfflineChecklist';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ar = locale === 'ar';
  return buildMetadata({
    locale,
    title: ar ? 'أنت أوفلاين' : 'You are offline',
    description: ar
      ? 'الصفحة اللي بتظهر لما النت يقطع. راجع الرحلات المحفوظة والتذكيرات المحلية.'
      : 'Shown when your connection drops. Check saved trips and local reminders.',
    path: '/offline',
    noindex: true,
  });
}

export default async function OfflinePage() {
  const locale = await getLocale();
  const ar = locale === 'ar';

  return (
    <>
      <PageHeader
        locale={locale}
        eyebrow={ar ? 'بدون اتصال' : 'Offline'}
        title={ar ? 'النت فصل؟ متقلقش' : 'No connection? You’re still covered'}
        description={
          ar
            ? 'الصفحات اللي زرتها والرحلات المحفوظة بتتخزن على جهازك. افتحها من تحت، ولو محتاج حاجة جديدة استنى النت يرجع.'
            : 'Pages you visited and trips you saved are cached on your device. Open them below, or wait for the connection to return for anything new.'
        }
        breadcrumbs={[{ label: ar ? 'أوفلاين' : 'Offline' }]}
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
            <WifiOff className="h-3 w-3" aria-hidden />
            {ar ? 'وضع أوفلاين' : 'Offline mode'}
          </span>
        }
      />

      <div className="page-shell grid gap-4 py-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="panel flex items-start gap-3 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
              <CloudOff className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink dark:text-white">
                {ar ? 'إيه اللي لسه شغال؟' : 'What still works?'}
              </h2>
              <p className="mt-1 text-[12px] leading-7 text-slate-600 dark:text-slate-300">
                {ar
                  ? 'الرحلات المحفوظة، التذكيرات، وأي صفحة زرتها قبل كده. البحث الجديد ولوحة الحركة المباشرة محتاجين اتصال، لأنهم بيرجعوا لبيانات السيرفر.'
                  : 'Saved trips, reminders and any page you opened before. New searches and the live board need a connection because they read server data.'}
              </p>
            </div>
          </div>

          <OfflineChecklist locale={locale} />

          <div className="panel p-5">
            <h2 className="text-sm font-bold text-ink dark:text-white">
              {ar ? 'إزاي ترجع تتصل؟' : 'Reconnecting'}
            </h2>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-6 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-1.5">
                <ListChecks className="mt-1 h-3 w-3 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
                {ar ? 'جرّب تقفل وتفتح وضع الطيران.' : 'Toggle airplane mode off and on.'}
              </li>
              <li className="flex items-start gap-1.5">
                <ListChecks className="mt-1 h-3 w-3 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
                {ar ? 'لو على واي فاي، جرّب شبكة الموبايل.' : 'On Wi-Fi? Try mobile data.'}
              </li>
              <li className="flex items-start gap-1.5">
                <ListChecks className="mt-1 h-3 w-3 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
                {ar ? 'افتح صفحة جديدة — متخليش التاب القديم يعلق في الذاكرة.' : 'Open a fresh tab rather than reviving the old one.'}
              </li>
            </ul>
            <p className="mt-2 text-[10px] leading-5 text-slate-400">
              {ar
                ? 'النماذج مش هتتبعت وانت أوفلاين. لو بعت بلاغ أو حجزت تذكير، أعد المحاولة بعد رجوع الاتصال.'
                : 'Forms do not queue while offline. If you submitted a report or reminder, retry once you are back online.'}
            </p>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="panel p-4">
            <h2 className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
              <Clock3 className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" aria-hidden />
              {ar ? 'قبل ما تتحرك' : 'Before you head out'}
            </h2>
            <p className="mt-1.5 text-[11px] leading-6 text-slate-500 dark:text-slate-400">
              {ar
                ? 'لو محتاج معلومة محدثة عن ميعاد قطر، الأفضل تتصل بالمحطة أو تسأل في الشباك. الصفحة المحفوظة قد تكون قديمة.'
                : 'If you need a current departure time, call the station or ask at the counter. Cached pages can be stale.'}
            </p>
          </div>
          <Link href="/alerts" className={buttonClasses({ className: 'w-full' })}>
            {ar ? 'تذكيراتي' : 'My alerts'}
          </Link>
          <Link href="/" className={buttonClasses({ variant: 'secondary', className: 'w-full' })}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            {ar ? 'حاول تاني' : 'Try again'}
          </Link>
          <p className="px-1 text-[9px] leading-5 text-slate-400">
            {ar
              ? 'الصفحة دي بتظهر تلقائيًا من الـservice worker لما الطلب يفشل وانت أوفلاين.'
              : 'This page is served by the service worker when a navigation fails while offline.'}
          </p>
        </aside>
      </div>
    </>
  );
}
