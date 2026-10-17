'use client';

import { useActionState, useState } from 'react';
import { AlertCircle, PlusCircle } from 'lucide-react';
import { createOverrideAction, type ActionResult } from '@/app/admin/actions';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { LINES } from '@/lib/data/lines';
import { SERVICES } from '@/lib/data/services';
import { todayCairo } from '@/lib/time';

const TYPES = [
  { value: 'delay', ar: 'تأخير', en: 'Delay' },
  { value: 'cancellation', ar: 'إلغاء', en: 'Cancellation' },
  { value: 'schedule_change', ar: 'تغيير موعد', en: 'Schedule change' },
  { value: 'extra_run', ar: 'رحلة إضافية', en: 'Extra run' },
  { value: 'maintenance', ar: 'صيانة خط', en: 'Line maintenance' },
] as const;

export function OverrideComposer({ locale }: { locale: 'ar' | 'en' }) {
  const ar = locale === 'ar';
  const [state, formAction] = useActionState<ActionResult | null, FormData>(createOverrideAction, null);
  const [type, setType] = useState<(typeof TYPES)[number]['value']>('delay');
  const today = todayCairo();

  const needsService = type !== 'maintenance';
  const needsShift = type === 'delay' || type === 'schedule_change';

  return (
    <form action={formAction} className="panel p-4">
      <h2 className="flex items-center gap-1.5 text-xs font-bold text-ink dark:text-white">
        <PlusCircle className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden />
        {ar ? 'طلب تعديل جديد' : 'New change request'}
      </h2>
      <p className="mt-0.5 text-[10px] leading-5 text-slate-400">
        {ar
          ? 'ينشئ طلبًا بحالة "معلّق". لا يظهر للركاب إلا بعد اعتماد مدير البيانات.'
          : 'Creates a pending request. Riders never see it until a data manager publishes it.'}
      </p>

      {state && !state.ok ? (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-danger-soft px-2.5 py-2 text-[10px] font-medium text-danger dark:bg-danger/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">{ar ? 'نوع التعديل' : 'Change type'}</span>
          <select
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as typeof type)}
            className="field-input mt-1 h-9 text-[11px]"
          >
            {TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {ar ? item.ar : item.en}
              </option>
            ))}
          </select>
        </label>

        {needsService ? (
          <label className="block">
            <span className="field-label">{ar ? 'رقم القطار' : 'Service number'}</span>
            <select name="serviceNumber" className="field-input mt-1 h-9 text-[11px]" defaultValue={SERVICES[0]?.number}>
              {SERVICES.slice(0, 60).map((service) => (
                <option key={service.number} value={service.number}>
                  {service.number} — {ar ? service.titleAr : service.titleEn}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block">
            <span className="field-label">{ar ? 'الخط' : 'Line'}</span>
            <select name="lineId" className="field-input mt-1 h-9 text-[11px]">
              {LINES.map((line) => (
                <option key={line.id} value={line.id}>
                  {ar ? line.nameAr : line.nameEn}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="field-label">{ar ? 'من تاريخ' : 'From date'}</span>
          <input type="date" name="fromDate" defaultValue={today} className="field-input mt-1 h-9 text-[11px]" />
        </label>
        <label className="block">
          <span className="field-label">{ar ? 'إلى تاريخ' : 'To date'}</span>
          <input type="date" name="toDate" defaultValue={today} className="field-input mt-1 h-9 text-[11px]" />
        </label>

        {needsShift ? (
          <>
            <label className="block">
              <span className="field-label">{ar ? 'التأخير (دقائق)' : 'Delay (minutes)'}</span>
              <input
                type="number"
                name="delayMinutes"
                min={0}
                max={600}
                step={5}
                defaultValue={type === 'delay' ? 20 : 0}
                className="field-input mt-1 h-9 text-[11px]"
              />
            </label>
            <label className="block">
              <span className="field-label">{ar ? 'أو موعد مغادرة جديد' : 'Or new departure time'}</span>
              <input type="time" name="newDeparture" className="field-input mt-1 h-9 text-[11px]" />
            </label>
          </>
        ) : null}

        <label className="block">
          <span className="field-label">{ar ? 'المصدر' : 'Source'}</span>
          <select name="source" className="field-input mt-1 h-9 text-[11px]" defaultValue="ops">
            <option value="official">{ar ? 'رسمي' : 'Official'}</option>
            <option value="ops">{ar ? 'غرفة تشغيل' : 'Operations'}</option>
            <option value="partner">{ar ? 'شريك' : 'Partner'}</option>
            <option value="community">{ar ? 'بلاغات ركاب' : 'Community'}</option>
          </select>
        </label>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">{ar ? 'السبب بالعربي' : 'Reason (Arabic)'}</span>
          <textarea
            name="reasonAr"
            rows={2}
            required
            minLength={3}
            maxLength={240}
            className="field-input mt-1 text-[11px]"
            placeholder={ar ? 'مثال: أعمال صيانة على خط طنطا' : 'e.g. maintenance works near Tanta'}
          />
        </label>
        <label className="block">
          <span className="field-label">{ar ? 'السبب بالإنجليزي' : 'Reason (English)'}</span>
          <textarea
            name="reasonEn"
            rows={2}
            required
            minLength={3}
            maxLength={240}
            className="field-input mt-1 text-[11px]"
            placeholder="e.g. maintenance works near Tanta"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SubmitButton pendingLabel={ar ? 'بيسجّل…' : 'Saving…'}>
          {ar ? 'إرسال للمراجعة' : 'Submit for review'}
        </SubmitButton>
        <span className="text-[9px] text-slate-400">
          {ar ? 'هيظهر في قائمة "بانتظار الاعتماد".' : 'It appears under “Awaiting approval”.'}
        </span>
      </div>
    </form>
  );
}
