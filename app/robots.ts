import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/content';

const BASE = SITE.url.replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/search',
          '/trip/',
          '/alerts',
          '/offline',
          '/train/',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
