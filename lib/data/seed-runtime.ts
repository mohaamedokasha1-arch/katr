import type {
  AuditEntry,
  CrowdReport,
  NotificationSubscription,
  Override,
  SyncRun,
} from '@/types/rail';
import { addDays, dayOfWeek, todayCairo } from '@/lib/time';

export interface RuntimeState {
  version: 1;
  seedDay: string;
  overrides: Override[];
  reports: CrowdReport[];
  audit: AuditEntry[];
  notifications: NotificationSubscription[];
  syncRuns: SyncRun[];
  stationStatus: Record<string, 'active' | 'maintenance'>;
}

const ADMIN = 'admin@rakeb.app';
const EDITOR = 'editor@rakeb.app';

function minutesAgoIso(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

function hoursAgoIso(now: Date, hours: number): string {
  return minutesAgoIso(now, hours * 60);
}

/**
 * Seed state is rebuilt on every server cold start, anchored to "today" in
 * Cairo. This keeps the demo alive: there is always an approved delay today,
 * a maintenance cancellation tomorrow, and a pending change waiting for a
 * reviewer in the admin console.
 */
export function demoSeedEnabled(): boolean {
  return process.env.RAKEB_ENABLE_DEMO_SEED === '1';
}

/**
 * Production default: EMPTY state. Fabricated delays, cancellations,
 * rider reports and sync runs must never be presented as real operations.
 * They exist only for explicit local review with RAKEB_ENABLE_DEMO_SEED=1.
 */
export function buildSeedState(now: Date = new Date()): RuntimeState {
  const today = todayCairo(now);
  if (!demoSeedEnabled()) {
    return {
      version: 1,
      seedDay: today,
      overrides: [],
      reports: [],
      audit: [],
      notifications: [],
      syncRuns: [],
      stationStatus: {},
    };
  }
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);

  const delayOverride: Override = {
    id: `seed-delay-907-${today}`,
    type: 'delay',
    serviceNumber: '907',
    lineId: 'delta-main',
    fromDate: today,
    toDate: today,
    delayMinutes: 20,
    reasonAr: 'تأخير تشغيلي بسبب أعمال صيانة على السكة بين طنطا ودمنهور.',
    reasonEn: 'Operational delay due to track maintenance between Tanta and Damanhour.',
    source: 'ops',
    status: 'published',
    createdBy: EDITOR,
    createdAt: hoursAgoIso(now, 3),
    reviewedBy: ADMIN,
    reviewedAt: hoursAgoIso(now, 2.5),
    reviewNote: 'تم التحقق من إخطار غرفة التحكم.',
  };

  const cancellationOverride: Override = {
    id: `seed-cancel-1806-${today}`,
    type: 'cancellation',
    serviceNumber: '1806',
    lineId: 'canal-port-said',
    fromDate: tomorrow,
    toDate: dayAfter,
    reasonAr: 'إلغاء مؤقت لأعمال صيانة مخططة على خط القناة الشرقي.',
    reasonEn: 'Temporary cancellation for planned maintenance on the eastern Canal line.',
    source: 'ops',
    status: 'published',
    createdBy: EDITOR,
    createdAt: hoursAgoIso(now, 26),
    reviewedBy: ADMIN,
    reviewedAt: hoursAgoIso(now, 25),
    reviewNote: 'نُشر بعد مطابقة بيان الصيانة.',
  };

  // Make sure the extra-run demo lands on a day when 1632 normally does not run.
  let extraDate = today;
  for (let i = 0; i < 7; i += 1) {
    const candidate = addDays(today, i);
    if (!([0, 2, 4] as number[]).includes(dayOfWeek(candidate))) {
      extraDate = candidate;
      break;
    }
  }

  const extraRunOverride: Override = {
    id: `seed-extra-1632-${extraDate}`,
    type: 'extra_run',
    serviceNumber: '1632',
    lineId: 'upper-egypt',
    fromDate: extraDate,
    toDate: extraDate,
    reasonAr: 'رحلة إضافية لاستيعاب الطلب المرتفع على خط الصعيد.',
    reasonEn: 'Extra service to absorb high demand on the Upper Egypt line.',
    source: 'ops',
    status: 'published',
    createdBy: 'ops-team@rakeb.app',
    createdAt: hoursAgoIso(now, 40),
    reviewedBy: ADMIN,
    reviewedAt: hoursAgoIso(now, 39),
  };

  const pendingOverride: Override = {
    id: `seed-pending-1603-${today}`,
    type: 'delay',
    serviceNumber: '1603',
    lineId: 'delta-main',
    fromDate: tomorrow,
    toDate: tomorrow,
    delayMinutes: 15,
    reasonAr: 'بلاغ ميداني عن ازدحام على الرصيف قد يتسبب في تأخير التحرك.',
    reasonEn: 'Field report of platform congestion that may delay departure.',
    source: 'community',
    status: 'pending',
    createdBy: EDITOR,
    createdAt: minutesAgoIso(now, 52),
  };

  const reports: CrowdReport[] = [
    {
      id: `seed-report-1605-a-${today}`,
      serviceNumber: '1605',
      date: today,
      stationId: 'cairo-ramses',
      kind: 'still_waiting',
      delayMinutes: 20,
      status: 'confirmed',
      createdAt: minutesAgoIso(now, 28),
      verifiedAt: minutesAgoIso(now, 10),
      reporterHash: 'rider-7c1a',
    },
    {
      id: `seed-report-1605-b-${today}`,
      serviceNumber: '1605',
      date: today,
      stationId: 'cairo-ramses',
      kind: 'delayed',
      delayMinutes: 25,
      status: 'confirmed',
      createdAt: minutesAgoIso(now, 21),
      verifiedAt: minutesAgoIso(now, 10),
      reporterHash: 'rider-2fe9',
    },
    {
      id: `seed-report-1605-c-${today}`,
      serviceNumber: '1605',
      date: today,
      stationId: 'cairo-ramses',
      kind: 'delayed',
      delayMinutes: 20,
      note: 'الإعلان في المحطة بيقول 20 دقيقة.',
      status: 'confirmed',
      createdAt: minutesAgoIso(now, 14),
      verifiedAt: minutesAgoIso(now, 10),
      reporterHash: 'rider-91b0',
    },
    {
      id: `seed-report-1603-a-${today}`,
      serviceNumber: '1603',
      date: today,
      stationId: 'cairo-ramses',
      kind: 'delayed',
      delayMinutes: 15,
      status: 'pending',
      createdAt: minutesAgoIso(now, 19),
      reporterHash: 'rider-33ad',
    },
    {
      id: `seed-report-1603-b-${today}`,
      serviceNumber: '1603',
      date: today,
      stationId: 'cairo-ramses',
      kind: 'still_waiting',
      delayMinutes: 10,
      status: 'pending',
      createdAt: minutesAgoIso(now, 7),
      reporterHash: 'rider-c402',
    },
    {
      id: `seed-report-86-x-${today}`,
      serviceNumber: '86',
      date: today,
      stationId: 'cairo-ramses',
      kind: 'delayed',
      delayMinutes: 45,
      status: 'rejected',
      createdAt: minutesAgoIso(now, 120),
      verifiedAt: hoursAgoIso(now, 1.8),
      verifiedBy: ADMIN,
      reporterHash: 'rider-spam1',
    },
  ];

  const audit: AuditEntry[] = [
    {
      id: `seed-audit-1-${today}`,
      at: hoursAgoIso(now, 3),
      actor: EDITOR,
      actorRole: 'editor',
      action: 'override.create',
      entity: 'override',
      entityId: delayOverride.id,
      summaryAr: 'إنشاء طلب تأخير 20 دقيقة للقطار 907 اليوم.',
      summaryEn: 'Created a 20-minute delay request for train 907 today.',
    },
    {
      id: `seed-audit-2-${today}`,
      at: hoursAgoIso(now, 2.5),
      actor: ADMIN,
      actorRole: 'admin',
      action: 'override.publish',
      entity: 'override',
      entityId: delayOverride.id,
      summaryAr: 'اعتماد ونشر تأخير القطار 907 بعد مراجعة ثانية.',
      summaryEn: 'Approved and published train 907 delay after second review.',
    },
    {
      id: `seed-audit-3-${today}`,
      at: hoursAgoIso(now, 26),
      actor: EDITOR,
      actorRole: 'editor',
      action: 'override.create',
      entity: 'override',
      entityId: cancellationOverride.id,
      summaryAr: 'إنشاء طلب إلغاء القطار 1806 ليومي الغد وما بعده.',
      summaryEn: 'Created a cancellation request for train 1806 starting tomorrow.',
    },
    {
      id: `seed-audit-4-${today}`,
      at: hoursAgoIso(now, 25),
      actor: ADMIN,
      actorRole: 'admin',
      action: 'override.publish',
      entity: 'override',
      entityId: cancellationOverride.id,
      summaryAr: 'اعتماد إلغاء القطار 1806 ونشره للجمهور.',
      summaryEn: 'Approved and published the cancellation of train 1806.',
    },
    {
      id: `seed-audit-5-${today}`,
      at: minutesAgoIso(now, 52),
      actor: EDITOR,
      actorRole: 'editor',
      action: 'override.create',
      entity: 'override',
      entityId: pendingOverride.id,
      summaryAr: 'إرسال تعديل تأخير القطار 1603 للمراجعة.',
      summaryEn: 'Submitted a delay change for train 1603 for review.',
    },
    {
      id: `seed-audit-6-${today}`,
      at: minutesAgoIso(now, 10),
      actor: 'النظام الآلي',
      actorRole: 'system',
      action: 'report.auto_confirm',
      entity: 'report_batch',
      entityId: `1605-${today}`,
      summaryAr: 'تأكيد مجتمعي تلقائي لثلاثة بلاغات متطابقة على القطار 1605.',
      summaryEn: 'Automatically confirmed three matching rider reports for train 1605.',
    },
  ];

  const syncRuns: SyncRun[] = [
    {
      id: `seed-sync-1-${today}`,
      source: 'enr-portal',
      startedAt: minutesAgoIso(now, 12),
      durationMs: 1840,
      fetched: 59,
      accepted: 59,
      rejected: 0,
      status: 'ok',
      messageAr: 'تم التحقق من جدول اليوم بالكامل دون تعارضات.',
      messageEn: 'Full daily timetable verified with no conflicts.',
    },
    {
      id: `seed-sync-2-${today}`,
      source: 'station-board-feed',
      startedAt: minutesAgoIso(now, 47),
      durationMs: 930,
      fetched: 24,
      accepted: 22,
      rejected: 2,
      status: 'warning',
      messageAr: 'بلاغان برصيف غير صحيح تم تحويلهما للمراجعة اليدوية.',
      messageEn: 'Two incorrect platform observations were routed to manual review.',
    },
    {
      id: `seed-sync-3-${today}`,
      source: 'booking-availability',
      startedAt: hoursAgoIso(now, 2),
      durationMs: 2210,
      fetched: 31,
      accepted: 31,
      rejected: 0,
      status: 'ok',
      messageAr: 'تم تحديث نطاقات الأسعار التقديرية للدرجات المتاحة.',
      messageEn: 'Estimated fare ranges refreshed for available classes.',
    },
    {
      id: `seed-sync-4-${today}`,
      source: 'enr-portal',
      startedAt: hoursAgoIso(now, 6),
      durationMs: 4120,
      fetched: 59,
      accepted: 58,
      rejected: 1,
      status: 'warning',
      messageAr: 'وقت وصول غير منطقي لقطار 2011 تم استبعاده من النشر.',
      messageEn: 'An implausible arrival time for train 2011 was excluded from publication.',
    },
    {
      id: `seed-sync-5-${today}`,
      source: 'community-reports',
      startedAt: hoursAgoIso(now, 9),
      durationMs: 310,
      fetched: 11,
      accepted: 9,
      rejected: 2,
      status: 'ok',
      messageAr: 'تجميع بلاغات الركاب وتحديث درجات الثقة.',
      messageEn: 'Rider reports aggregated and confidence scores refreshed.',
    },
  ];

  return {
    version: 1,
    seedDay: today,
    overrides: [delayOverride, cancellationOverride, extraRunOverride, pendingOverride],
    reports,
    audit,
    notifications: [],
    syncRuns,
    stationStatus: {},
  };
}
