import { cookies } from 'next/headers';
import { cache } from 'react';
import type { Locale } from '@/types/rail';

export const LOCALE_COOKIE = 'rakeb_locale';
export const DEFAULT_LOCALE: Locale = 'ar';

function isLocale(value: string | undefined): value is Locale {
  return value === 'ar' || value === 'en';
}

/**
 * Locale is stored in a cookie for this demo so that every route stays clean
 * and Arabic-first by default. Production can move to URL-prefixed locales.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

export function direction(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'ar' ? 'en' : 'ar';
}

export { isLocale };
