'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, Menu, Search, X } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { LocaleSwitch } from '@/components/layout/LocaleSwitch';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { getAlertsCount, subscribeStorage } from '@/lib/client-storage';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  labelAr: string;
  labelEn: string;
  match: (pathname: string) => boolean;
}

const NAV: NavItem[] = [
  { href: '/', labelAr: 'الرئيسية', labelEn: 'Home', match: (path) => path === '/' },
  {
    href: '/lines',
    labelAr: 'الخطوط',
    labelEn: 'Lines',
    match: (path) => path.startsWith('/line'),
  },
  {
    href: '/stations',
    labelAr: 'المحطات',
    labelEn: 'Stations',
    match: (path) => path.startsWith('/station'),
  },
  {
    href: '/board',
    labelAr: 'لوحة مباشرة',
    labelEn: 'Live board',
    match: (path) => path === '/board',
  },
  {
    href: '/guide',
    labelAr: 'دليل السفر',
    labelEn: 'Travel guide',
    match: (path) => path.startsWith('/guide'),
  },
];

export function SiteHeader({ locale }: { locale: 'ar' | 'en' }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(0);

  useEffect(() => {
    const update = () => setAlerts(getAlertsCount());
    update();
    return subscribeStorage(update);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label = (item: NavItem) => (locale === 'ar' ? item.labelAr : item.labelEn);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-night/80">
      <div className="page-shell flex h-16 items-center gap-3">
        <Brand locale={locale} />

        <nav aria-label={locale === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'} className="ms-4 hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors',
                  active
                    ? 'text-brand-800 dark:text-white'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-ink dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white',
                )}
              >
                {label(item)}
                {active ? (
                  <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand-600 dark:bg-brand-300" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
          <Link
            href="/search"
            className="me-1 hidden h-10 items-center gap-2 rounded-xl bg-brand-700 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-800 sm:inline-flex dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            <Search className="h-3.5 w-3.5" aria-hidden />
            {locale === 'ar' ? 'ابحث عن قطار' : 'Find a train'}
          </Link>
          <Link
            href="/search"
            aria-label={locale === 'ar' ? 'بحث' : 'Search'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-ink sm:hidden dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <Search className="h-[18px] w-[18px]" aria-hidden />
          </Link>
          <Link
            href="/alerts"
            aria-label={
              locale === 'ar'
                ? `تنبيهاتي${alerts ? ` (${alerts})` : ''}`
                : `My alerts${alerts ? ` (${alerts})` : ''}`
            }
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-ink dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden />
            {alerts > 0 ? (
              <span className="num absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[9px] font-bold text-white dark:bg-brand-400 dark:text-night">
                {alerts > 9 ? '9+' : alerts}
              </span>
            ) : null}
          </Link>
          <ThemeToggle locale={locale} />
          <LocaleSwitch locale={locale} className="hidden xs:inline-flex" />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? (locale === 'ar' ? 'إغلاق القائمة' : 'Close menu') : locale === 'ar' ? 'فتح القائمة' : 'Open menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-white/5"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" id="mobile-navigation">
          <button
            type="button"
            aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 end-0 flex w-[min(88vw,380px)] flex-col bg-white shadow-2xl dark:bg-night-800">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5 dark:border-white/10">
              <Brand locale={locale} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4" aria-label={locale === 'ar' ? 'قائمة التنقل' : 'Menu'}>
              <ul className="space-y-1">
                {NAV.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition',
                          active
                            ? 'bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-200'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5',
                        )}
                      >
                        {label(item)}
                        {active ? <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> : null}
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <Link
                    href="/alerts"
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    {locale === 'ar' ? 'تنبيهاتي' : 'My alerts'}
                    {alerts > 0 ? (
                      <span className="num rounded-full bg-brand-700 px-2 py-0.5 text-[10px] text-white dark:bg-brand-400 dark:text-night">
                        {alerts}
                      </span>
                    ) : null}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="flex rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    {locale === 'ar' ? 'عن راكب' : 'About Rakeb'}
                  </Link>
                </li>
              </ul>

              <div className="mt-6 rounded-2xl bg-mist p-4 dark:bg-white/[0.04]">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {locale === 'ar' ? 'المظهر واللغة' : 'Theme & language'}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <ThemeToggle locale={locale} />
                  <LocaleSwitch locale={locale} />
                  <span className="text-xs text-slate-400">
                    {locale === 'ar' ? 'عربي / English' : 'Arabic / English'}
                  </span>
                </div>
              </div>

              <Link
                href="/search"
                onClick={() => setOpen(false)}
                className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 text-sm font-semibold text-white dark:bg-brand-500"
              >
                <Search className="h-4 w-4" aria-hidden />
                {locale === 'ar' ? 'ابحث عن قطار' : 'Find a train'}
              </Link>
            </nav>
            <div className="border-t border-slate-100 p-5 text-[11px] leading-5 text-slate-400 dark:border-white/10">
              {locale === 'ar'
                ? 'راكب منصة مستقلة لمواعيد القطارات، غير تابعة لهيئة السكك الحديدية.'
                : 'Rakeb is an independent timetable platform, not affiliated with Egyptian National Railways.'}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
