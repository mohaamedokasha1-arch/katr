import type { Metadata, Viewport } from 'next';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import './globals.css';
import { getLocale, direction } from '@/lib/locale';
import { SITE } from '@/lib/content';
import { ToastProvider } from '@/components/ui/Toast';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'راكب — مواعيد قطارات مصر بدرجة ثقة واضحة',
    template: '%s · راكب',
  },
  description: SITE.descriptionAr,
  applicationName: 'راكب | Rakeb',
  category: 'travel',
  keywords: [
    'مواعيد القطارات',
    'قطارات مصر',
    'السكك الحديدية المصرية',
    'مواعيد قطارات القاهرة الإسكندرية',
    'قطار أسوان',
    'قطار الأقصر',
    'Egypt train timetable',
    'Egyptian National Railways',
  ],
  authors: [{ name: 'Rakeb' }],
  creator: 'Rakeb',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    title: 'راكب',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: 'website',
    siteName: 'راكب | Rakeb',
    locale: 'ar_EG',
    title: 'راكب — مواعيد قطارات مصر بدرجة ثقة واضحة',
    description: SITE.descriptionAr,
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'راكب — مواعيد قطارات مصر',
    description: SITE.descriptionAr,
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F9FC' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1117' },
  ],
};

const themeScript = `(function(){try{var stored=localStorage.getItem('rakeb-theme');var dark=stored==='dark'||(!stored&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={direction(locale)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans">
        <a
          href="#main"
          className="sr-only z-[100] rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-3"
        >
          {locale === 'ar' ? 'تخطَّ إلى المحتوى' : 'Skip to content'}
        </a>
        <ToastProvider>
          {children}
          <ServiceWorkerRegister />
        </ToastProvider>
      </body>
    </html>
  );
}
