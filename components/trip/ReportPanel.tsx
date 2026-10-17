'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ban,
  CheckCircle2,
  Clock,
  Megaphone,
  TrainFront,
  Users,
  Loader2,
} from 'lucide-react';
import type { ReportKind } from '@/types/rail';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface ConsensusPayload {
  total: number;
  uniqueReporters: number;
  confirmed: boolean;
  delayMinutes: number;
  needed: number;
}

const OPTIONS: Array<{
  kind: ReportKind;
  ar: string;
  en: string;
  icon: typeof Clock;
  tone: string;
}> = [
  {
    kind: 'still_waiting',
    ar: 'لسه مستني',
    en: 'Still waiting',
    icon: Clock,
    tone: 'text-brand-600 bg-brand-50 dark:bg-brand-500/10 dark:text-brand-300',
  },
  {
    kind: 'delayed',
    ar: 'متأخر',
    en: 'Delayed',
    icon: Clock,
    tone: 'text-signal bg-signal-soft dark:bg-signal/10 dark:text-orange-300',
  },
  {
    kind: 'moving',
    ar: 'القطار اتحرك',
    en: 'Train left',
    icon: TrainFront,
    tone: 'text-success bg-success-soft dark:bg-success/10 dark:text-emerald-300',
  },
  {
    kind: 'arrived',
    ar: 'وصل',
    en: 'Arrived',
    icon: CheckCircle2,
    tone: 'text-slate-600 bg-slate-100 dark:bg-white/10 dark:text-slate-300',
  },
  {
    kind: 'cancelled',
    ar: 'ملغي',
    en: 'Cancelled',
    icon: Ban,
    tone: 'text-danger bg-danger-soft dark:bg-danger/10 dark:text-red-300',
  },
];

export function ReportPanel({
  locale,
  serviceNumber,
  date,
  stationId,
  stationNameAr,
  stationNameEn,
  canReport,
  initialConsensus,
}: {
  locale: 'ar' | 'en';
  serviceNumber: string;
  date: string;
  stationId: string;
  stationNameAr: string;
  stationNameEn: string;
  canReport: boolean;
  initialConsensus: ConsensusPayload;
}) {
  const ar = locale === 'ar';
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ReportKind | null>(null);
  const [delay, setDelay] = useState('15');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ConsensusPayload | null>(null);
  const [duplicate, setDuplicate] = useState(false);

  const consensus = result ?? initialConsensus;

  async function submit() {
    if (!kind) {
      toast(ar ? 'اختر حالة القطار أولًا.' : 'Choose the train status first.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceNumber,
          date,
          stationId,
          kind,
          delayMinutes: kind === 'delayed' || kind === 'still_waiting' ? Number(delay) || 0 : undefined,
          note: note.trim() || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? 'request failed');
      }
      setResult(payload.consensus);
      setDuplicate(Boolean(payload.duplicate));
      toast(
        payload.duplicate
          ? ar
            ? 'سجّلنا بلاغك بالفعل من نفس الجهاز خلال آخر 10 دقائق.'
            : 'We already have a report from this device in the last 10 minutes.'
          : ar
            ? 'تم تسجيل بلاغك. شكرًا لمساعدتك الركاب التانيين.'
            : 'Report recorded. Thanks for helping other riders.',
        payload.duplicate ? 'info' : 'success',
      );
      setOpen(false);
      setKind(null);
      setNote('');
      router.refresh();
    } catch (error) {
      toast(
        ar
          ? 'تعذر إرسال البلاغ. جرّب مرة أخرى بعد قليل.'
          : 'Could not send the report. Please try again shortly.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink dark:text-white">
            <Megaphone className="h-4 w-4 text-signal" aria-hidden />
            {ar ? 'بلّغ عن حالة القطار' : 'Report the train status'}
          </h2>
          <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            {ar
              ? 'أنت في المحطة؟ بلاغك يساعد الركاب التانيين. نحتاج 3 بلاغات مستقلة خلال 45 دقيقة قبل عرض التأخير كتأكيد مجتمعي.'
              : 'At the station? Your report helps other riders. We need 3 independent reports within 45 minutes before showing a community confirmation.'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
          <Users className="h-3 w-3" aria-hidden />
          {ar
            ? `${consensus.uniqueReporters} من ${Math.max(consensus.uniqueReporters, consensus.uniqueReporters + consensus.needed)}`
            : `${consensus.uniqueReporters} / ${Math.max(consensus.uniqueReporters, consensus.uniqueReporters + consensus.needed)}`}
        </span>
      </div>

      {!canReport ? (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:bg-white/5 dark:text-slate-400">
          {ar
            ? 'البلاغات الميدانية متاحة يوم الرحلة فقط (اليوم أو أمس)، حتى تبقى المعلومات مرتبطة بالواقع.'
            : 'Field reports are available on the travel day only (today or yesterday) so information stays grounded in reality.'}
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
            {OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = kind === option.kind;
              return (
                <button
                  key={option.kind}
                  type="button"
                  onClick={() => setKind(option.kind)}
                  aria-pressed={active}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition',
                    active
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/30 dark:border-brand-400 dark:bg-brand-500/10'
                      : 'border-slate-200 hover:border-brand-300 dark:border-white/10 dark:hover:border-brand-400/40',
                  )}
                >
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', option.tone)}>
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    {ar ? option.ar : option.en}
                  </span>
                </button>
              );
            })}
          </div>

          {kind === 'delayed' || kind === 'still_waiting' ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label htmlFor="delay-minutes" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {ar ? 'مدة التأخير بالدقائق' : 'Delay in minutes'}
              </label>
              <select
                id="delay-minutes"
                value={delay}
                onChange={(event) => setDelay(event.target.value)}
                className="field-input h-9 w-28 px-2 text-xs"
              >
                {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 140))}
              placeholder={
                ar ? 'ملاحظة اختيارية (مثال: الإعلان في المحطة بيقول 20 دقيقة)' : 'Optional note (e.g. the station announcement says 20 min)'
              }
              className="field-input h-9 flex-1 text-xs"
              aria-label={ar ? 'ملاحظة' : 'Note'}
            />
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !kind}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-700 px-4 text-xs font-bold text-white transition hover:bg-brand-800 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-400"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Megaphone className="h-3.5 w-3.5" />}
              {ar ? 'أرسل البلاغ' : 'Send report'}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            {ar ? 'محطة البلاغ: ' : 'Reporting from: '}
            {ar ? stationNameAr : stationNameEn}
            {' · '}
            {ar
              ? 'نحفظ بصمة تقريبية فقط لمنع التكرار، بدون عنوان IP.'
              : 'We store a coarse fingerprint to prevent duplicates, never your IP.'}
          </p>
        </>
      )}

      {duplicate ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          {ar ? 'تم تجاهل التكرار: لدينا بلاغ حديث من نفس الجهاز.' : 'Duplicate ignored: a recent report from this device exists.'}
        </p>
      ) : null}

      {consensus.confirmed ? (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-success-soft px-3 py-2 text-[11px] font-semibold text-success-ink dark:bg-success/10 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          {ar
            ? `تأكيد مجتمعي مكتمل: ${consensus.uniqueReporters} ركاب متطابقين.`
            : `Community confirmed: ${consensus.uniqueReporters} matching riders.`}
        </p>
      ) : consensus.total > 0 ? (
        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          {ar
            ? `${consensus.total} بلاغ اليوم، ومحتاجين ${consensus.needed} بلاغ مستقل كمان للتأكيد.`
            : `${consensus.total} reports today; ${consensus.needed} more independent reports needed to confirm.`}
        </p>
      ) : null}
    </section>
  );
}
