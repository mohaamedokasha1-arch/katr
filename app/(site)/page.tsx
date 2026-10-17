import type { Metadata } from 'next';
import { getLocale } from '@/lib/locale';
import { buildMetadata, websiteJsonLd, faqJsonLd } from '@/lib/seo';
import { FAQ_ITEMS, POPULAR_PAIRS } from '@/lib/content';
import { getHomeLiveData, findConfidenceExamples } from '@/lib/home';
import { getPopularRouteCards, searchTrips } from '@/lib/search';
import { getStationBoard } from '@/lib/live';
import { todayCairo } from '@/lib/time';
import { JsonLd } from '@/components/seo/JsonLd';
import { Hero } from '@/components/home/Hero';
import { LiveTicker } from '@/components/home/LiveTicker';
import { HomeAlertBanner } from '@/components/home/HomeAlertBanner';
import { PopularRoutes } from '@/components/home/PopularRoutes';
import { LiveBoardPreview } from '@/components/home/LiveBoardPreview';
import { ConfidenceSection } from '@/components/home/ConfidenceSection';
import { CoverageSection } from '@/components/home/CoverageSection';
import { GuidesPreview } from '@/components/home/GuidesPreview';
import { CtaBand } from '@/components/home/CtaBand';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ar = locale === 'ar';
  return buildMetadata({
    locale,
    title: ar ? 'مواعيد قطارات مصر ولوحة الحركة المباشرة' : 'Egyptian train times & live boards',
    description: ar
      ? 'اعرف ميعادك قبل ما يفوتك: مواعيد القطارات في مصر، أسعار تقديرية، لوحة محطة مباشرة، وتنبيهات قبل المغادرة — بدرجة ثقة واضحة لكل معلومة.'
      : 'Know your train before it leaves: Egyptian rail timetables, estimated fares, live station boards and pre-departure alerts — each with a visible confidence level.',
    path: '/',
  });
}

export default async function HomePage() {
  const locale = await getLocale();
  const now = new Date();
  const today = todayCairo(now);
  const live = getHomeLiveData(now);

  const exampleSearch = searchTrips({
    from: 'cairo-ramses',
    to: 'alexandria-misr',
    date: today,
    directOnly: false,
    classes: [],
    sort: 'departure',
  });
  const examples = findConfidenceExamples(exampleSearch.trips);
  const board = getStationBoard({
    stationId: 'cairo-ramses',
    direction: 'departure',
    limit: 6,
    now,
  });
  const routes = getPopularRouteCards(POPULAR_PAIRS.slice(0, 6));

  return (
    <>
      <JsonLd
        data={[
          websiteJsonLd(locale),
          faqJsonLd(
            FAQ_ITEMS.filter((item) => item.category === 'trust' || item.category === 'search').slice(0, 4),
            locale,
          ),
        ]}
      />
      <Hero locale={locale} data={live} alert={live.alerts[0] ?? null} />
      <LiveTicker locale={locale} data={live} />
      <HomeAlertBanner locale={locale} alerts={live.alerts} />
      <PopularRoutes locale={locale} routes={routes} />
      <LiveBoardPreview locale={locale} board={board} />
      <ConfidenceSection locale={locale} examples={examples} />
      <CoverageSection locale={locale} />
      <GuidesPreview locale={locale} />
      <CtaBand locale={locale} />
    </>
  );
}
