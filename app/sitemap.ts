import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/content';
import { GUIDE_ARTICLES } from '@/lib/content';
import { LINES } from '@/lib/data/lines';
import { STATIONS } from '@/lib/data/stations';
import { routePairPath } from '@/lib/data/station-slugs';
import { getAllRoutePairs } from '@/lib/search';
import { todayCairo } from '@/lib/time';

const BASE = SITE.url.replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(`${todayCairo()}T06:00:00.000Z`);

  const staticPages: MetadataRoute.Sitemap = [
    { path: '/', priority: 1, changeFrequency: 'hourly' as const },
    { path: '/lines', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/stations', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/guide', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/about', priority: 0.4, changeFrequency: 'yearly' as const },
  ].map((page) => ({
    url: `${BASE}${page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const lines: MetadataRoute.Sitemap = LINES.map((line) => ({
    url: `${BASE}/line/${line.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const stations: MetadataRoute.Sitemap = STATIONS.filter((station) => station.searchable).map((station) => ({
    url: `${BASE}/station/${station.id}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: station.tier === 1 ? 0.7 : 0.5,
  }));

  const routes: MetadataRoute.Sitemap = getAllRoutePairs().map((pair) => ({
    url: `${BASE}${routePairPath(pair.fromId, pair.toId)}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const guides: MetadataRoute.Sitemap = GUIDE_ARTICLES.map((guide) => ({
    url: `${BASE}/guide/${guide.slug}`,
    lastModified: new Date(`${guide.updatedAt}T06:00:00.000Z`),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...lines, ...stations, ...guides, ...routes];
}
