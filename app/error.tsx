'use client';

import { useEffect } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is where Sentry would capture the error.
    console.error('[rakeb] route error', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-mist px-4 dark:bg-night">
      <div className="panel w-full max-w-lg p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-signal-soft text-signal-ink dark:bg-signal/10 dark:text-orange-300">
          <TriangleAlert className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="mt-5 text-xl font-bold text-ink dark:text-white">حدث خطأ غير متوقع</h1>
        <p className="mt-1 num text-xs tracking-widest text-slate-400" dir="ltr">
          SOMETHING WENT OFF THE RAILS
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">
          حصلت مشكلة أثناء تحميل الصفحة. جرّب مرة أخرى، وإذا استمرت المشكلة ارجع للصفحة الرئيسية.
          <br />
          <span className="text-xs">Something went wrong while loading this page. Please try again.</span>
        </p>
        {error.digest ? (
          <p className="num mt-3 text-[10px] uppercase tracking-widest text-slate-400" dir="ltr">
            ref {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition hover:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            حاول مرة أخرى
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-ink transition hover:border-brand-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
          >
            الصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
