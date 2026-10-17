import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CircleAlert,
  Clock3,
  Radio,
  TrainFront,
  TriangleAlert,
} from 'lucide-react';
import { getLocale } from '@/lib/locale';
import { buildMetadata } from '@/lib/seo';
import { SERVICES } from '@/lib/data/services';
import { STATION_MAP } from '@/lib/data/stations';
import { LINE_MAP } from '@/lib/data/lines';
import { getTripStatus } from '@/lib/live';
import { getRunDecision, serviceTitle } from '@/lib/schedule';
import { getPublishedOverrides } from '@/lib/store';
import { getHomeLiveData } from '@/lib/home';
import { formatClock, formatDateFull, todayCairo } from '@/lib/time';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { LiveClock, LiveRefresher } from '@/components/trip/LiveBits';
import { cn } from '@/lib/utils';
import { DATA_SOURCES } from '@/lib/data/sources';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ar = locale === 'ar';
  return buildMetadata({
    locale,
    title: ar ? 'حالة الشبكة اليوم' : 'Network status today',
    description: ar
      ? 'التأخيرات والإلغاءات والرحلات الإضافية المنشورة على شبكة السكك الحديدية المصرية اليوم، مع درجة الثقة لكل معلومة.'
      : 'Published delays, cancellations and extra runs across the Egyptian rail network today, with a confidence level for every fact.',
    path: '/status',
    noindex: true,
  });
}

interface StatusRow {
  tripId: string;
  serviceNumber: string;
  titleAr: string;
  titleEn: string;
  lineId: string;
  originId: string;
  originAr: string;
  originEn: string;
  destinationId: string;
  destinationAr: string;
  destinationEn: string;
  departMinutes: number;
  status: ReturnType<typeof getTripStatus>['status'];
  confidence: ReturnType<typeof getTripStatus>['confidence'];
}

export default async function StatusPage() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const now = new Date();
  const today = todayCairo(now);
  const overrides = getPublishedOverrides();
  const home = getHomeLiveData(now);

  const rows: StatusRow[] = SERVICES.map((service) => {
    const decision = getRunDecision(service, today, overrides);
    if (!decision.runs) return null;
    const origin = STATION_MAP[service.stops[0].stationId];
    const destination = STATION_MAP[service.stops[service.stops.length - 1].stationId];
    const { status, confidence } = getTripStatus({
      service,
      originDate: today,
      fromIndex: 0,
      toIndex: service.stops.length - 1,
      now,
      overrides,
    });
    return {
      tripId: `${service.number}-${today}`,
      serviceNumber: service.number,
      titleAr: serviceTitle(service, 'ar'),
      titleEn: serviceTitle(service, 'en'),
      lineId: service.lineId,
      originId: origin.id,
      originAr: origin.nameAr,
      originEn: origin.nameEn,
      destinationId: destination.id,
      destinationAr: destination.nameAr,
      destinationEn: destination.nameEn,
      departMinutes: status.expectedDepartureMinutes,
      status,
      confidence,
    };
  })
    .filter((row): row is StatusRow => row !== null)
    .sort((a, b) => a.departMinutes - b.departMinutes);

  const changes = rows.filter(
    (row) => row.status.kind === 'cancelled' || row.status.delayMinutes > 0,
  );
  const active = rows.filter(
    (row) =>
      row.status.kind !== 'cancelled' &&
      row.status.delayMinutes === 0 &&
      (row.status.kind === 'scheduled' ||
        row.status.kind === 'on_time' ||
        row.status.kind === 'boarding' ||
        row.status.kind === 'in_transit'),
  );
  const finished = rows.filter(
    (row) => row.status.kind === 'arrived' && row.status.delayMinutes === 0,
  );

  const summary = [
    { labelAr: 'رحلات اليوم', labelEn: 'Services today', value: rows.length, tone: 'text-ink dark:text-white' },
    { labelAr: 'تغييرات', labelEn: 'Changes', value: changes.length, tone: 'text-signal-ink dark:text-orange-300' },
    { labelAr: 'قادمة', labelEn: 'Upcoming', value: active.length, tone: 'text-brand-700 dark:text-brand-300' },
    { labelAr: 'انتهت', labelEn: 'Completed', value: finished.length, tone: 'text-slate-500 dark:text-slate-400' },
  ];

  function Row({ row }: { row: StatusRow }) {
    const line = LINE_MAP[row.lineId];
    const cancelled = row.status.kind === 'cancelled';
    const delayed = row.status.delayMinutes > 0;
    return (
      <li>
        <Link
          href={`/trip/${row.tripId}`}
          className="grid gap-2 px-4 py-3 transition hover:bg-brand-50/40 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center sm:gap-4 dark:hover:bg-white/[0.03]"
        >
          <div className="flex items-center gap-2">
            <span className="num rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-brand-500">
              {row.serviceNumber}
            </span>
            <span className="h-1 w-4 rounded-full sm:hidden" style={{ backgroundColor: line?.color ?? '#1565C0' }} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink dark:text-white">
              {ar ? row.titleAr : row.titleEn}
            </p>
            <p className="truncate text-[10px] text-slate-400">
              {ar ? row.originAr : row.originEn} → {ar ? row.destinationAr : row.destinationEn}
            </p>
            {cancelled || delayed ? (
              <p
                className={cn(
                  'mt-0.5 line-clamp-1 text-[10px]',
                  cancelled ? 'text-danger dark:text-red-300' : 'text-signal-ink dark:text-orange-300',
                )}
              >
                {ar ? row.status.noteAr : row.status.noteEn}
              </p>
            ) : null}
          </div>
          <div className="num text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {formatClock(row.departMinutes)}
            {delayed ? (
              <span className="ms-1 text-[9px] font-medium text-slate-400">
                ({ar ? 'مجدول' : 'sched.'} {formatClock(row.departMinutes - row.status.delayMinutes)})
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge locale={locale} kind={row.status.kind} delayMinutes={row.status.delayMinutes} />
            <ConfidenceBadge locale={locale} confidence={row.confidence} />
            {ar ? <ArrowLeft className="h-3.5 w-3.5 text-slate-300" aria-hidden /> : <ArrowRight className="h-3.5 w-3.5 text-slate-300" aria-hidden />}
          </div>
        </Link>
      </li>
    );
  }

  return (
    <>
      <PageHeader
        locale={locale}
        eyebrow={ar ? 'حالة الشبكة' : 'Network status'}
        title={ar ? 'حركة القطارات اليوم' : 'Today’s rail movement'}
        description={
          ar
            ? 'كل التغييرات المنشورة على الشبكة، والرحلات القادمة والمنتهية، في شاشة واحدة. كل تغيير يحمل مصدره ودرجة ثقته.'
            : 'Every published change across the network, plus upcoming and completed services, in one screen. Each change carries its source and confidence.'
        }
        breadcrumbs={[
          { label: ar ? 'حالة الشبكة' : 'Network status' },
        ]}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <Radio className="h-3 w-3" aria-hidden />
              {formatDateFull(today, locale)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold dark:border-white/10">
              <Clock3 className="h-3 w-3" aria-hidden />
              {ar ? 'توقيت القاهرة' : 'Cairo time'}
            </span>
          </>
        }
      >
        <div className="flex flex-col items-end gap-2">
          <LiveClock locale={locale} onDark={false} />
          <LiveRefresher locale={locale} intervalMs={45_000} />
        </div>
      </PageHeader>

      <div className="page-shell py-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {summary.map((item) => (
            <div key={item.labelEn} className="panel p-3.5">
              <p className={cn('num text-2xl font-semibold leading-none', item.tone)}>{item.value}</p>
              <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {ar ? item.labelAr : item.labelEn}
              </p>
            </div>
          ))}
        </div>

        {home.alerts.length > 0 ? (
          <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-400/20 dark:bg-amber-500/[0.06]">
            <h2 className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
              <CircleAlert className="h-3.5 w-3.5" aria-hidden />
              {ar ? 'تغييرات منشورة اليوم وغدًا' : 'Published changes today and tomorrow'}
            </h2>
            <ul className="mt-2 space-y-1.5">
              {home.alerts.map((alert) => (
                <li key={alert.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                  <span className="rounded bg-white/70 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 dark:bg-white/10 dark:text-amber-200">
                    {alert.type === 'delay'
                      ? ar
                        ? 'تأخير'
                        : 'Delay'
                      : alert.type === 'cancellation' || alert.type === 'maintenance'
                        ? ar
                          ? 'إلغاء'
                          : 'Cancelled'
                        : alert.type === 'extra_run'
                          ? ar
                            ? 'إضافية'
                            : 'Extra'
                          : ar
                            ? 'تعديل'
                            : 'Change'}
                  </span>
                  <span className="font-semibold text-amber-950 dark:text-amber-100">
                    {ar ? alert.titleAr : alert.titleEn}
                  </span>
                  <span className="text-amber-900/60 dark:text-amber-200/60">
                    {ar ? alert.reasonAr : alert.reasonEn}
                  </span>
                  {alert.delayMinutes ? <span className="num font-bold text-amber-900 dark:text-amber-200">+{alert.delayMinutes}m</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {changes.length > 0 ? (
          <section className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-signal" aria-hidden />
              <h2 className="text-sm font-bold text-ink dark:text-white">
                {ar ? 'تغييرات وتأخيرات' : 'Changes & delays'}
              </h2>
              <span className="num rounded-full bg-signal-soft px-1.5 py-0.5 text-[9px] font-bold text-signal-ink dark:bg-signal/10 dark:text-orange-300">
                {changes.length}
              </span>
            </div>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-night-800">
              {changes.map((row) => (
                <Row key={row.tripId} row={row} />
              ))}
            </ul>
          </section>
        ) : (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-[11px] font-medium text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
            <TrainFront className="h-4 w-4" aria-hidden />
            {ar ? 'لا توجد تأخيرات أو إلغاءات منشورة حتى الآن.' : 'No published delays or cancellations so far.'}
          </div>
        )}

        {active.length > 0 ? (
          <section className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <TrainFront className="h-4 w-4 text-brand-600 dark:text-brand-300" aria-hidden />
              <h2 className="text-sm font-bold text-ink dark:text-white">
                {ar ? 'رحلات قادمة أو في الطريق' : 'Upcoming & in transit'}
              </h2>
              <span className="num rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                {active.length}
              </span>
            </div>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-night-800">
              {active.map((row) => (
                <Row key={row.tripId} row={row} />
              ))}
            </ul>
          </section>
        ) : null}

        {finished.length > 0 ? (
          <details className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-night-800">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Ban className="h-3.5 w-3.5" aria-hidden />
                {ar ? `رحلات انتهت اليوم (${finished.length})` : `Completed today (${finished.length})`}
              </span>
              <span className="text-[10px] font-medium">{ar ? 'اعرض' : 'Show'}</span>
            </summary>
            <ul className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-white/5 dark:border-white/10">
              {finished.map((row) => (
                <Row key={row.tripId} row={row} />
              ))}
            </ul>
          </details>
        ) : null}

        <p className="mt-5 text-center text-[10px] leading-5 text-slate-400">
          {ar
            ? 'الحالة تعتمد على الجدول المنشور وبلاغات الركاب المؤكدة. صلاحية الشاشة تتجدد تلقائيًا، ويمكن أن تختلف عن الإعلان الرسمي داخل المحطة.'
            : 'Status combines the published timetable and confirmed rider reports. The screen refreshes automatically and may differ from the official on-station announcement.'}
        </p>
        <section className="panel mt-4 p-4">
          <h2 className="text-xs font-bold text-ink dark:text-white">{ar ? 'مصادر البيانات وحالتها' : 'Data sources & status'}</h2>
          <p className="mt-1 text-[10px] leading-5 text-slate-400">
            {ar
              ? 'لا توجد مزامنة آلية حية حاليًا: المواعيد المعروضة جدول يدوي يحتاج إعادة تحقق، والتأخير/الإلغاء يظهر فقط بعد مراجعة ونشر إداري أو تأكيد ركاب. آخر تحقق لكل مصدر أدناه.'
              : 'There is no live automated sync yet: displayed times are a manually maintained timetable needing re-verification, and delays/cancellations appear only after admin review or rider confirmation. Per-source verification dates below.'}
          </p>
          <ul className="mt-2 space-y-2">
            {DATA_SOURCES.map((s) => (
              <li key={s.id} className="flex flex-wrap items-baseline gap-x-2 text-[11px]">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline-offset-2 hover:underline dark:text-brand-300">
                  {ar ? s.ownerAr : s.ownerEn} ↗
                </a>
                <span className="text-slate-500 dark:text-slate-400">{ar ? s.dataAr : s.dataEn}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {s.official ? (ar ? 'جهة رسمية' : 'Official body') : ar ? 'إدخال يدوي' : 'Manual'} · {s.access} · {s.status}
                  {s.lastVerifiedIso ? ` · ${ar ? 'تحقق' : 'checked'} ${s.lastVerifiedIso}` : ar ? ' · لم يُتحقق بعد' : ' · not yet verified'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
