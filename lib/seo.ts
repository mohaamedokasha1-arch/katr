import type { Metadata } from 'next';
import type { FaqItem, Locale, TripResult } from '@/types/rail';
import { SITE } from '@/lib/content';
import { toIso } from '@/lib/time';

export function absoluteUrl(path: string): string {
  const base = SITE.url.endsWith('/') ? SITE.url.slice(0, -1) : SITE.url;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildMetadata(args: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  type?: 'website' | 'article';
}): Metadata {
  const { locale, title, description, path, noindex, type = 'website' } = args;
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: locale === 'ar' ? SITE.nameAr : SITE.nameEn,
      locale: locale === 'ar' ? 'ar_EG' : 'en_GB',
      type,
      images: [
        {
          url: '/og.png',
          width: 1200,
          height: 630,
          alt: locale === 'ar' ? 'راكب — مواعيد قطارات مصر' : 'Rakeb — Egyptian rail timetables',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og.png'],
    },
  };
}

export function websiteJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: locale === 'ar' ? SITE.nameAr : SITE.nameEn,
    url: absoluteUrl('/'),
    description: locale === 'ar' ? SITE.descriptionAr : SITE.descriptionEn,
    inLanguage: locale === 'ar' ? 'ar-EG' : 'en-GB',
    publisher: {
      '@type': 'Organization',
      name: locale === 'ar' ? SITE.nameAr : SITE.nameEn,
      logo: absoluteUrl('/logo.svg'),
    },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: FaqItem[], locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: locale === 'ar' ? item.qAr : item.qEn,
      acceptedAnswer: {
        '@type': 'Answer',
        text: locale === 'ar' ? item.aAr : item.aEn,
      },
    })),
  };
}

export function tripJsonLd(trip: TripResult, locale: Locale) {
  const lowest = trip.fares.length ? Math.min(...trip.fares.map((fare) => fare.min)) : null;
  const highest = trip.fares.length ? Math.max(...trip.fares.map((fare) => fare.max)) : null;
  return {
    '@context': 'https://schema.org',
    '@type': 'TrainTrip',
    name:
      locale === 'ar'
        ? `قطار ${trip.serviceNumber} من ${trip.from.nameAr} إلى ${trip.to.nameAr}`
        : `Train ${trip.serviceNumber} from ${trip.from.nameEn} to ${trip.to.nameEn}`,
    trainNumber: trip.serviceNumber,
    trainName: locale === 'ar' ? trip.titleAr : trip.titleEn,
    departureTime: toIso(trip.date, trip.departMinutes),
    arrivalTime: toIso(trip.date, trip.arriveMinutes),
    departureStation: {
      '@type': 'TrainStation',
      name: locale === 'ar' ? trip.from.nameAr : trip.from.nameEn,
    },
    arrivalStation: {
      '@type': 'TrainStation',
      name: locale === 'ar' ? trip.to.nameAr : trip.to.nameEn,
    },
    provider: {
      '@type': 'Organization',
      name: locale === 'ar' ? SITE.nameAr : SITE.nameEn,
      url: absoluteUrl('/'),
    },
    ...(lowest && highest
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'EGP',
            lowPrice: lowest,
            highPrice: highest,
            availability: 'https://schema.org/InStock',
            description:
              locale === 'ar'
                ? 'نطاق سعر تقديري — يُرجى التأكيد عند الحجز'
                : 'Estimated fare range — confirm at booking',
          },
        }
      : {}),
  };
}

export function stationJsonLd(args: {
  locale: Locale;
  name: string;
  code: string;
  lat: number;
  lng: number;
  description: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TrainStation',
    name: args.name,
    identifier: args.code,
    description: args.description,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: args.lat,
      longitude: args.lng,
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'EG',
    },
  };
}
