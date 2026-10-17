import Link from 'next/link';
import { Compass, Search } from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';

export default async function SiteNotFound() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  return (
    <div className="page-shell flex min-h-[60vh] items-center justify-center py-16">
      <EmptyState
        icon={<Compass className="h-6 w-6" aria-hidden />}
        title={ar ? 'الصفحة غير موجودة' : 'Page not found'}
        description={
          ar
            ? 'الرابط الذي فتحته لا يشير إلى صفحة متاحة. جرّب البحث عن رحلتك أو استكشف الخطوط والمحطات.'
            : 'The link you opened does not point to an available page. Try searching for your trip or explore lines and stations.'
        }
        className="w-full max-w-xl"
      >
        <ButtonLink href="/search" size="md">
          <Search className="h-4 w-4" aria-hidden />
          {ar ? 'ابحث عن قطار' : 'Find a train'}
        </ButtonLink>
        <ButtonLink href="/" variant="secondary" size="md">
          {ar ? 'الصفحة الرئيسية' : 'Homepage'}
        </ButtonLink>
        <Link href="/line/cairo-alexandria" className="text-xs font-semibold text-brand-700 dark:text-brand-300">
          {ar ? 'خط القاهرة – الإسكندرية' : 'Cairo – Alexandria line'}
        </Link>
      </EmptyState>
    </div>
  );
}
