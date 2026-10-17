import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { adminConfigured } from '@/lib/auth';
import { LoginForm } from '@/components/admin/LoginForm';
import { Brand } from '@/components/layout/Brand';

export const metadata: Metadata = {
  title: 'Admin sign in — Rakeb',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ next?: string }>;

export default async function AdminLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const { next } = await searchParams;
  const configured = adminConfigured();

  return (
    <div className="relative min-h-screen overflow-hidden bg-night text-white">
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-30" aria-hidden />
      <div className="pointer-events-none absolute -top-24 start-1/3 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-10">
        <div className="mb-5 flex items-center justify-between">
          <Brand locale={locale} light />
          <Link href="/" className="flex items-center gap-1 text-[11px] font-medium text-brand-100/70 transition hover:text-white">
            {ar ? 'رجوع للموقع' : 'Back to site'}
            <ArrowRight className="h-3 w-3 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
        <div className="rounded-2xl bg-mist p-2">
          <LoginForm locale={locale} next={next ?? '/admin'} configured={configured} />
        </div>
        <p className="mt-4 text-center text-[10px] text-brand-100/40">
          {ar
            ? 'لوحة إدارة بيانات راكب — الوصول مسجّل بالكامل في سجل التدقيق.'
            : 'Rakeb data administration — every access is recorded in the audit trail.'}
        </p>
      </div>
    </div>
  );
}
