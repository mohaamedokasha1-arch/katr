import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BellRing,
  Building2,
  ClipboardList,
  Database,
  ExternalLink,
  LogOut,
  Radio,
  RefreshCw,
  Scale,
  ShieldCheck,
  TrainFront,
  Users,
} from 'lucide-react';
import { getSession, roleLabel } from '@/lib/auth';
import { adminOverview, overrideTypeLabel } from '@/lib/admin';
import { STATION_MAP } from '@/lib/data/stations';
import { SERVICE_BY_NUMBER } from '@/lib/data/services';
import { LINE_MAP } from '@/lib/data/lines';
import { formatClock, formatDateFull, formatDateTime, todayCairo } from '@/lib/time';
import { getStationStatus } from '@/lib/store';
import { logoutAction, moderateReportAction, reviewOverrideAction, stationStatusAction, syncAction } from '@/app/admin/actions';
import { OverrideComposer } from '@/components/admin/OverrideComposer';
import { SubmitButton } from '@/components/admin/SubmitButton';
import { Brand } from '@/components/layout/Brand';
import { getLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ flash?: string; tone?: string }>;

const reportKindLabel: Record<string, { ar: string; en: string }> = {
  still_waiting: { ar: 'مستني', en: 'Waiting' },
  delayed: { ar: 'متأخر', en: 'Delayed' },
  moving: { ar: 'تحرك', en: 'Moving' },
  arrived: { ar: 'وصل', en: 'Arrived' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
};

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const session = await getSession();
  const { flash, tone } = await searchParams;
  const { stats, overrides, reports, audit, syncRuns } = adminOverview();
  const pending = overrides.filter((item) => item.status === 'pending');
  const reviewed = overrides.filter((item) => item.status !== 'pending');
  const pendingReports = reports.filter((item) => item.status === 'pending');
  const hubs = Object.values(STATION_MAP).filter((station) => station.tier === 1);

  const statCards = [
    { labelAr: 'بانتظار الاعتماد', labelEn: 'Awaiting approval', value: stats.pendingOverrides, icon: Scale, accent: 'text-signal' },
    { labelAr: 'تعديلات منشورة', labelEn: 'Published changes', value: stats.publishedOverrides, icon: BadgeCheck, accent: 'text-emerald-400' },
    { labelAr: 'بلاغات اليوم', labelEn: 'Reports today', value: stats.reportsToday, icon: Users, accent: 'text-brand-300' },
    { labelAr: 'بلاغات معلّقة', labelEn: 'Pending reports', value: stats.pendingReports, icon: Radio, accent: 'text-orange-300' },
    { labelAr: 'اشتراكات تنبيه', labelEn: 'Alert subscriptions', value: stats.notifications, icon: BellRing, accent: 'text-brand-200' },
  ];

  if (!session) return null;

  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060e1d]/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Brand locale={locale} light />
            <span className="hidden rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-200 sm:inline">
              {ar ? 'لوحة البيانات' : 'Data console'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-medium text-brand-100/70 transition hover:border-white/25 hover:text-white sm:flex"
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
              {ar ? 'الموقع' : 'Website'}
            </Link>
            <div className="hidden text-end sm:block">
              <p className="text-[11px] font-semibold text-white">{session.name}</p>
              <p className="text-[9px] text-brand-100/50">
                {roleLabel(locale, session.role)} · {session.email}
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-medium text-brand-100/70 transition hover:border-danger/40 hover:text-danger"
              >
                <LogOut className="h-3 w-3" aria-hidden />
                {ar ? 'خروج' : 'Sign out'}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300/60">
              {formatDateFull(todayCairo(), locale)}
            </p>
            <h1 className="mt-1 text-xl font-bold text-white">
              {ar ? 'غرفة بيانات راكب' : 'Rakeb data room'}
            </h1>
            <p className="mt-0.5 max-w-2xl text-[11px] leading-6 text-brand-100/50">
              {ar
                ? 'كل تعديل بيمر بمراجعة بشرية. المحرر ينشئ، والمدير يعتمد وينشر، والبلاغات المؤكدة تتحول لدرجة ثقة أعلى.'
                : 'Every change gets human review. Editors draft, managers publish, and confirmed reports raise the confidence level.'}
            </p>
          </div>
          <form action={syncAction}>
            <SubmitButton variant="secondary" pendingLabel={ar ? 'بيزامن…' : 'Syncing…'}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              {ar ? 'مزامنة يدوية' : 'Run sync now'}
            </SubmitButton>
          </form>
        </div>

        {flash ? (
          <p
            className={cn(
              'mt-4 rounded-lg border px-3 py-2 text-[11px] font-medium',
              tone === 'err'
                ? 'border-danger/30 bg-danger/10 text-red-300'
                : 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
            )}
          >
            {flash}
          </p>
        ) : null}

        <section className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.labelEn} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-medium text-brand-100/50">{ar ? card.labelAr : card.labelEn}</p>
                  <Icon className={cn('h-3.5 w-3.5', card.accent)} aria-hidden />
                </div>
                <p className="num mt-1 text-2xl font-semibold text-white">{card.value}</p>
              </div>
            );
          })}
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                <div>
                  <h2 className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Scale className="h-3.5 w-3.5 text-orange-300" aria-hidden />
                    {ar ? 'بانتظار الاعتماد' : 'Awaiting approval'}
                    <span className="num rounded-full bg-orange-400/15 px-1.5 text-[9px] text-orange-300">{pending.length}</span>
                  </h2>
                  <p className="mt-0.5 text-[10px] text-brand-100/40">
                    {ar
                      ? 'الاعتماد من صلاحيات مدير البيانات فقط، ولا يظهر التعديل للركاب قبل النشر.'
                      : 'Only a data manager can approve, and nothing reaches riders before publication.'}
                  </p>
                </div>
              </div>

              {pending.length === 0 ? (
                <p className="px-4 py-8 text-center text-[11px] text-brand-100/40">
                  {ar ? 'مفيش تعديلات معلّقة. ضيف طلب من اليمين.' : 'No pending changes. Draft one on the right.'}
                </p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {pending.map((override) => {
                    const service = override.serviceNumber ? SERVICE_BY_NUMBER[override.serviceNumber] : undefined;
                    const line = override.lineId ? LINE_MAP[override.lineId] : undefined;
                    return (
                      <li key={override.id} className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-orange-400/15 px-1.5 py-0.5 text-[9px] font-bold text-orange-300">
                            {overrideTypeLabel(override.type, locale)}
                          </span>
                          <p className="text-[11px] font-semibold text-white">
                            {service ? `${service.number} · ${ar ? service.titleAr : service.titleEn}` : line ? (ar ? line.nameAr : line.nameEn) : override.id}
                          </p>
                          <span className="num ms-auto text-[9px] text-brand-100/40">
                            {formatDateFull(override.fromDate, locale)} → {formatDateFull(override.toDate, locale)}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-brand-100/55">
                          {ar ? override.reasonAr : override.reasonEn}
                          {override.delayMinutes ? (
                            <span className="num ms-1.5 font-bold text-orange-300">+{override.delayMinutes}m</span>
                          ) : null}
                          {override.newDepartureMinutes !== undefined ? (
                            <span className="num ms-1.5 font-bold text-brand-300">
                              {ar ? 'مغادرة' : 'dep'} {formatClock(override.newDepartureMinutes)}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[9px] text-brand-100/30">
                          {override.createdBy} · {formatDateTime(override.createdAt, locale)}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <form action={reviewOverrideAction} className="flex flex-wrap items-center gap-1.5">
                            <input type="hidden" name="id" value={override.id} />
                            <input type="hidden" name="reviewAction" value="publish" />
                            <input
                              name="note"
                              placeholder={ar ? 'ملاحظة المراجعة (اختياري)' : 'Review note (optional)'}
                              className="h-7 w-44 rounded-md border border-white/10 bg-white/5 px-2 text-[10px] text-white placeholder:text-brand-100/25 focus:border-brand-400/50 focus:outline-none"
                            />
                            <SubmitButton pendingLabel={ar ? 'بينشر…' : 'Publishing…'}>
                              <BadgeCheck className="h-3 w-3" aria-hidden />
                              {ar ? 'اعتماد ونشر' : 'Approve & publish'}
                            </SubmitButton>
                          </form>
                          <form action={reviewOverrideAction}>
                            <input type="hidden" name="id" value={override.id} />
                            <input type="hidden" name="reviewAction" value="reject" />
                            <SubmitButton variant="ghost" className="text-red-300 hover:bg-danger/10 hover:text-red-200">
                              {ar ? 'رفض' : 'Reject'}
                            </SubmitButton>
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <h2 className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Users className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                  {ar ? 'بلاغات الركاب' : 'Rider reports'}
                  <span className="num rounded-full bg-white/10 px-1.5 text-[9px] text-brand-100/60">{pendingReports.length} {ar ? 'معلّق' : 'pending'}</span>
                </h2>
                <span className="text-[9px] text-brand-100/35">
                  {ar ? '3 بلاغات مستقلة = تأكيد' : '3 independent reports = confirmed'}
                </span>
              </div>
              {reports.length === 0 ? (
                <p className="px-4 py-8 text-center text-[11px] text-brand-100/40">
                  {ar ? 'لا توجد بلاغات بعد. البلاغات تظهر من صفحة الرحلة.' : 'No reports yet. They arrive from trip pages.'}
                </p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {reports.slice(0, 14).map((report) => {
                    const station = STATION_MAP[report.stationId];
                    return (
                      <li key={report.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                        <span className="num rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-brand-200">
                          {report.serviceNumber}
                        </span>
                        <span className="text-[10px] text-white">
                          {reportKindLabel[report.kind] ? (ar ? reportKindLabel[report.kind].ar : reportKindLabel[report.kind].en) : report.kind}
                          {report.delayMinutes ? <span className="num text-orange-300"> +{report.delayMinutes}m</span> : null}
                        </span>
                        <span className="text-[9px] text-brand-100/40">
                          {station ? (ar ? station.nameAr : station.nameEn) : report.stationId} · {report.date}
                        </span>
                        <span
                          className={cn(
                            'rounded px-1 py-0.5 text-[8px] font-bold',
                            report.status === 'confirmed'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : report.status === 'rejected'
                                ? 'bg-danger/15 text-red-300'
                                : 'bg-orange-400/15 text-orange-300',
                          )}
                        >
                          {report.status}
                        </span>
                        {report.status === 'pending' ? (
                          <div className="ms-auto flex gap-1.5">
                            <form action={moderateReportAction}>
                              <input type="hidden" name="id" value={report.id} />
                              <input type="hidden" name="moderation" value="confirm" />
                              <SubmitButton variant="secondary" className="h-6 border-white/10 bg-white/5 px-2 text-[9px] text-white hover:bg-white/10">
                                {ar ? 'تأكيد' : 'Confirm'}
                              </SubmitButton>
                            </form>
                            <form action={moderateReportAction}>
                              <input type="hidden" name="id" value={report.id} />
                              <input type="hidden" name="moderation" value="reject" />
                              <SubmitButton variant="ghost" className="h-6 px-2 text-[9px] text-red-300 hover:bg-danger/10">
                                {ar ? 'رفض' : 'Reject'}
                              </SubmitButton>
                            </form>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <h2 className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <ClipboardList className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                  {ar ? 'سجل التدقيق' : 'Audit trail'}
                </h2>
                <span className="num text-[9px] text-brand-100/35">{audit.length}</span>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {audit.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[11px] text-brand-100/40">
                    {ar ? 'السجل فاضي لحد أول إجراء.' : 'The log is empty until the first action.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {audit.map((entry) => (
                      <li key={entry.id} className="px-4 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[8px] text-brand-300">{entry.action}</span>
                          <span className="text-[9px] text-brand-100/35">{formatDateTime(entry.at, locale)}</span>
                          <span className="ms-auto text-[9px] text-brand-100/40">{entry.actor}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-brand-100/60">{ar ? entry.summaryAr : entry.summaryEn}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <OverrideComposer locale={locale} />

            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h2 className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Building2 className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                {ar ? 'حالة المحطات' : 'Station status'}
              </h2>
              <p className="mt-0.5 text-[10px] text-brand-100/40">
                {ar ? 'محطات الشركات الرئيسية. وضع الصيانة يظهر كتحذير على صفحة المحطة.' : 'Main hub stations. Maintenance shows a warning on the station page.'}
              </p>
              <ul className="mt-2 space-y-1.5">
                {hubs.map((hub) => {
                  const maintenance = getStationStatus(hub.id) === 'maintenance';
                  return (
                    <li key={hub.id} className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[10px] text-brand-100/70">
                        {ar ? hub.nameAr : hub.nameEn}
                      </span>
                      <span
                        className={cn(
                          'rounded px-1 py-0.5 text-[8px] font-bold',
                          maintenance
                            ? 'bg-orange-400/15 text-orange-300'
                            : 'bg-emerald-500/10 text-emerald-300/80',
                        )}
                      >
                        {maintenance ? (ar ? 'صيانة' : 'maintenance') : ar ? 'تشغيل' : 'active'}
                      </span>
                      <form action={stationStatusAction} className="flex items-center gap-1">
                        <input type="hidden" name="stationId" value={hub.id} />
                        <input type="hidden" name="status" value={maintenance ? 'active' : 'maintenance'} />
                        <SubmitButton
                          variant="ghost"
                          className="h-6 px-1.5 text-[8px] text-brand-100/50 hover:bg-white/5 hover:text-white"
                        >
                          {maintenance ? (ar ? 'إرجاع للتشغيل' : 'Set active') : ar ? 'صيانة' : 'Set maintenance'}
                        </SubmitButton>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h2 className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Database className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                {ar ? 'آخر عمليات المزامنة' : 'Recent sync runs'}
              </h2>
              {syncRuns.length === 0 ? (
                <p className="mt-2 text-[10px] leading-5 text-brand-100/40">
                  {ar ? 'لا يوجد تشغيل مسجل. استخدم زر المزامنة فوق.' : 'No runs recorded. Use the sync button above.'}
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {syncRuns.slice(0, 5).map((run) => (
                    <li key={run.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            run.status === 'ok' ? 'bg-emerald-400' : run.status === 'warning' ? 'bg-orange-400' : 'bg-red-400',
                          )}
                          aria-hidden
                        />
                        <span className="font-mono text-[9px] text-brand-200">{run.source}</span>
                        <span className="num ms-auto text-[8px] text-brand-100/35">{run.durationMs}ms</span>
                      </div>
                      <p className="mt-1 text-[9px] leading-4 text-brand-100/45">{ar ? run.messageAr : run.messageEn}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h2 className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Activity className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                {ar ? 'آخر التعديلات المراجَعة' : 'Recently reviewed'}
              </h2>
              {reviewed.length === 0 ? (
                <p className="mt-2 text-[10px] text-brand-100/40">{ar ? 'لا يوجد بعد.' : 'Nothing yet.'}</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {reviewed.slice(0, 5).map((item) => (
                    <li key={item.id} className="text-[9px] leading-4 text-brand-100/50">
                      <span
                        className={cn(
                          'me-1 rounded px-1 py-0.5 font-bold',
                          item.status === 'published' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-danger/15 text-red-300',
                        )}
                      >
                        {item.status === 'published' ? (ar ? 'منشور' : 'published') : ar ? 'مرفوض' : 'rejected'}
                      </span>
                      {overrideTypeLabel(item.type, locale)} · {item.serviceNumber ?? item.lineId} ·{' '}
                      {item.reviewedBy ?? '—'}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="flex items-start gap-2 rounded-xl border border-brand-400/20 bg-brand-500/10 p-3 text-[9px] leading-5 text-brand-100/60">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-300" aria-hidden />
              {ar
                ? 'الجلسة موقّعة HMAC وتنتهي بعد 8 ساعات. كل إجراء كتابة يُسجَّل باسم الحساب ودوره.'
                : 'Sessions are HMAC-signed and expire after 8 hours. Every write is logged with account and role.'}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-[9px] leading-5 text-brand-100/40">
                {ar
                  ? 'نسخة تجريبية: الحالة في ‎.data/state.json‎ وتتصفّر بمتغير RAKEB_RESET_STATE=1. الشاشة تعرض آخر 30 إجراءً و40 تعديلًا.'
                  : 'Demo note: state lives in .data/state.json and resets with RAKEB_RESET_STATE=1. The console shows the latest 30 audit entries and 40 overrides.'}
              </p>
              <Link
                href="/status"
                className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-semibold text-brand-300 hover:text-white"
              >
                <TrainFront className="h-3 w-3" aria-hidden />
                {ar ? 'شوف صفحة الحالة العامة' : 'View the public status page'}
                <ArrowRight className="h-2.5 w-2.5 rtl:rotate-180" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
