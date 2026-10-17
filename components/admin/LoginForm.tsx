'use client';

import { useActionState, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { loginAction, type ActionResult } from '@/app/admin/actions';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { cn } from '@/lib/utils';

export function LoginForm({
  locale,
  next,
  configured = true,
}: {
  locale: 'ar' | 'en';
  next: string;
  configured?: boolean;
}) {
  const ar = locale === 'ar';
  const [state, formAction] = useActionState<ActionResult | null, FormData>(loginAction, null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <form action={formAction} className="panel p-5 sm:p-6">
        <input type="hidden" name="next" value={next} />
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white dark:bg-brand-500">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h1 className="text-sm font-bold text-ink dark:text-white">
              {ar ? 'دخول لوحة الإدارة' : 'Admin sign in'}
            </h1>
            <p className="text-[10px] text-slate-400">
              {ar ? 'جلسة موقّعة HMAC، صالحة 8 ساعات' : 'HMAC-signed session, valid for 8 hours'}
            </p>
          </div>
        </div>

        {state && !state.ok ? (
          <p className="mt-4 flex items-start gap-1.5 rounded-lg bg-danger-soft px-3 py-2 text-[11px] font-medium text-danger dark:bg-danger/10 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {state.message ?? 'Sign in failed.'}
          </p>
        ) : null}

        <label className="mt-4 block">
          <span className="field-label">{ar ? 'البريد الإلكتروني' : 'Email'}</span>
          <span className="relative mt-1 block">
            <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field-input h-11 ps-9 text-xs"
              placeholder="admin@rakeb.app"
            />
          </span>
        </label>

        <label className="mt-3 block">
          <span className="field-label">{ar ? 'كلمة المرور' : 'Password'}</span>
          <span className="relative mt-1 block">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field-input h-11 ps-9 pe-10 text-xs"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? (ar ? 'اخفِ كلمة المرور' : 'Hide password') : ar ? 'أظهر كلمة المرور' : 'Show password'}
              className="absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
            </button>
          </span>
        </label>

        <SubmitButton className="mt-4 w-full" size="md" pendingLabel={ar ? 'بنتحقق…' : 'Signing in…'}>
          {ar ? 'دخول' : 'Sign in'}
        </SubmitButton>

        {!configured ? (
          <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-[10px] leading-5 text-danger dark:bg-danger/10 dark:text-red-300">
            {ar
              ? 'تسجيل دخول الإدارة غير مُهيأ على الخادم بعد (متغيرات البيئة ناقصة). عمليات الإدارة معطّلة حتى يكمل صاحب المشروع الإعداد الآمن.'
              : 'Admin sign-in is not configured on the server yet (missing environment variables). Admin operations stay disabled until the owner completes the secure setup.'}
          </p>
        ) : null}
      </form>

    </div>
  );
}
