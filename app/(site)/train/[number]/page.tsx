import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getLocale } from '@/lib/locale';
import { getService } from '@/lib/data/services';
import { LINE_MAP } from '@/lib/data/lines';
import { getRunDecision, nextOperatingDates } from '@/lib/schedule';
import { getPublishedOverrides } from '@/lib/store';
import { todayCairo } from '@/lib/time';
import { buildMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Params = Promise<{ number: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const locale = await getLocale();
  const { number } = await params;
  const service = getService(number);
  const ar = locale === 'ar';
  return buildMetadata({
    locale,
    title: service
      ? ar
        ? `القطار ${service.number} اليوم`
        : `Train ${service.number} today`
      : ar
        ? 'قطار غير موجود'
        : 'Train not found',
    description: ar
      ? 'افتح صفحة الرحلة الكاملة لأي قطار برقمه، مع المواعيد والدرجات ودرجة الثقة.'
      : 'Open the full trip page for any train by number, with times, classes and confidence.',
    path: `/train/${number}`,
    noindex: true,
  });
}

export default async function TrainRedirectPage({ params }: { params: Params }) {
  const { number } = await params;
  const service = getService(number.replace(/[^\d]/g, ''));
  if (!service) notFound();

  const today = todayCairo();
  const overrides = getPublishedOverrides();
  if (getRunDecision(service, today, overrides).runs) {
    redirect(`/trip/${service.number}-${today}`);
  }

  const [nextDate] = nextOperatingDates(service, today, 1, overrides);
  if (nextDate) redirect(`/trip/${service.number}-${nextDate}`);

  const line = LINE_MAP[service.lineId];
  redirect(line ? `/line/${line.slug}` : '/lines');
}
