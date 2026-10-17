import Link from 'next/link';
import { getLocale } from '@/lib/locale';
import { BrandMark } from '@/components/layout/Brand';
import { buttonClasses } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, MapPinned, Search } from 'lucide-react';

export default async function NotFound() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#051838] text-white">
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-50" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden />
      <div className="page-shell relative flex flex-1 flex-col justify-center py-20">
        <Link href="/" className="mb-14 inline-flex items-center gap-3">
          <BrandMark />
          <div>
            <div className="text-xl font-bold">راكب</div>
            <div className="num text-[9px] tracking-[0.34em] text-brand-300/70">RAKEB</div>
          </div>
        </Link>

        <div className="max-w-2xl">
          <p className="num text-sm font-semibold tracking-[0.2em] text-signal">404 — OUT OF SERVICE</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {ar ? 'الرحلة اللي بتدور عليها مش هنا.' : 'This trip is not on this platform.'}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-brand-200/80">
            {ar
              ? 'يمكن الرابط قديم، أو المحطة اتغيّر اسمها، أو الرحلة اتلغت. جرّب البحث أو ارجع للوحة الرئيسية.'
              : 'The link may be old, the station may have been renamed, or the service was cancelled. Try a search or head back to the homepage.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/search" className={buttonClasses({ size: 'lg', className: 'bg-white text-brand-900 hover:bg-brand-50' })}>
              <Search className="h-4 w-4" aria-hidden />
              {ar ? 'ابحث عن قطار' : 'Find a train'}
            </Link>
            <Link href="/" className={buttonClasses({ size: 'lg', variant: 'secondary', className: 'border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white' })}>
              {ar ? 'الصفحة الرئيسية' : 'Homepage'}
              {ar ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </Link>
            <Link href="/board" className={buttonClasses({ size: 'lg', variant: 'secondary', className: 'border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white' })}>
              <MapPinned className="h-4 w-4" aria-hidden />
              {ar ? 'لوحة المحطة' : 'Station board'}
            </Link>
          </div>
        </div>

        <div className="mt-16 flex items-center gap-3 text-xs text-brand-300/60">
          <span className="h-px w-16 bg-gradient-to-r from-brand-400/60 to-transparent" />
          <span>{ar ? 'راكب لا يبيع تذاكر ولا يتقاضى رسوم حجز.' : 'Rakeb does not sell tickets or charge booking fees.'}</span>
        </div>
      </div>
    </div>
  );
}
