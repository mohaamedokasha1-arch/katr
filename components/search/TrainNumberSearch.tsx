'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hash, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export function TrainNumberSearch({
  locale,
  variant = 'light',
}: {
  locale: 'ar' | 'en';
  variant?: 'light' | 'dark';
}) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const ar = locale === 'ar';

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const number = value.replace(/[^\d]/g, '');
    if (!number) {
      toast(ar ? 'اكتب رقم القطار أولًا، مثل 907.' : 'Enter a train number first, e.g. 907.', 'error');
      return;
    }
    setLoading(true);
    router.push(`/train/${number}`);
  }

  return (
    <form onSubmit={submit} className="inline-flex items-center gap-1.5">
      <div className="relative">
        <Hash
          className={cn(
            'pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2',
            variant === 'dark' ? 'text-brand-300/70' : 'text-slate-400',
          )}
          aria-hidden
        />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value.replace(/[^\d]/g, '').slice(0, 4))}
          inputMode="numeric"
          placeholder={ar ? 'رقم القطار' : 'Train number'}
          aria-label={ar ? 'البحث برقم القطار' : 'Search by train number'}
          className={cn(
            'num h-9 w-32 rounded-lg border ps-8 pe-2 text-xs font-semibold outline-none transition',
            variant === 'dark'
              ? 'border-white/15 bg-white/5 text-white placeholder:text-brand-200/50 focus:border-brand-300'
              : 'border-slate-200 bg-white text-ink placeholder:text-slate-400 focus:border-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-white',
          )}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className={cn(
          'inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition disabled:opacity-60',
          variant === 'dark'
            ? 'bg-white/10 text-white hover:bg-white/20'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200',
        )}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
        {ar ? 'ابحث' : 'Find'}
      </button>
    </form>
  );
}
