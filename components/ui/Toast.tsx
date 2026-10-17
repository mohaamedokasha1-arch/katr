'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  push: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastTone = 'info') => {
    toastId += 1;
    const id = toastId;
    setItems((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed bottom-5 end-4 z-[90] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:end-6"
      >
        {items.map((item) => {
          const Icon = item.tone === 'success' ? CheckCircle2 : item.tone === 'error' ? XCircle : Info;
          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 text-sm shadow-lift backdrop-blur',
                item.tone === 'success' &&
                  'border-success/20 bg-white text-ink dark:border-success/30 dark:bg-night-700 dark:text-slate-100',
                item.tone === 'error' &&
                  'border-danger/20 bg-white text-ink dark:border-danger/30 dark:bg-night-700 dark:text-slate-100',
                item.tone === 'info' &&
                  'border-brand-200 bg-white text-ink dark:border-brand-400/25 dark:bg-night-700 dark:text-slate-100',
              )}
            >
              <Icon
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0',
                  item.tone === 'success' && 'text-success dark:text-emerald-400',
                  item.tone === 'error' && 'text-danger dark:text-red-400',
                  item.tone === 'info' && 'text-brand-600 dark:text-brand-300',
                )}
              />
              <p className="flex-1 leading-6">{item.message}</p>
              <button
                type="button"
                aria-label="إغلاق / Close"
                onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                className="rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (message: string, tone?: ToastTone) => void {
  const context = useContext(ToastContext);
  return context?.push ?? (() => undefined);
}
