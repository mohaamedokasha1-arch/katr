import type { ReactNode } from 'react';
import { getSession } from '@/lib/auth';

export const metadata = {
  title: 'Rakeb admin',
  robots: { index: false, follow: false },
};

/**
 * The login screen shares this segment, so the shell renders only once a
 * session exists. The middleware already redirects unauthenticated visits.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) return <>{children}</>;
  return <div className="min-h-screen bg-[#060e1d] text-slate-100">{children}</div>;
}
