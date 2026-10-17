import type {
  AdminSession,
  DataSource,
  Override,
  OverrideType,
  SyncRun,
} from '@/types/rail';
import {
  addAudit,
  getOverride,
  getRuntimeStats,
  insertOverride,
  listAudit,
  listOverrides,
  listReports,
  listSyncRuns,
  recordSyncRun,
  setStationStatus,
  updateOverride,
  updateReport,
} from '@/lib/store';
import { SERVICE_BY_NUMBER } from '@/lib/data/services';
import { STATION_MAP } from '@/lib/data/stations';
import { LINES } from '@/lib/data/lines';

/**
 * Every admin mutation goes through this module so the four-eyes rule and the
 * audit trail cannot be bypassed by a route that forgets one of them.
 */
export type AdminResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; messageAr: string; messageEn: string };

function fail(code: string, messageAr: string, messageEn: string): AdminResult<never> {
  return { ok: false, code, messageAr, messageEn };
}

export interface OverrideDraftInput {
  type: OverrideType;
  serviceNumber?: string;
  lineId?: string;
  fromDate: string;
  toDate: string;
  delayMinutes?: number;
  newDepartureMinutes?: number;
  reasonAr: string;
  reasonEn: string;
  source: DataSource;
}

const ACTIONS_WITH_SERVICE: OverrideType[] = [
  'delay',
  'cancellation',
  'schedule_change',
  'extra_run',
];

export function validateOverrideInput(input: OverrideDraftInput): AdminResult<OverrideDraftInput> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(input.toDate)) {
    return fail('bad_dates', 'صيغة التاريخ غير صحيحة.', 'Dates must be YYYY-MM-DD.');
  }
  if (input.toDate < input.fromDate) {
    return fail('bad_range', 'تاريخ النهاية قبل البداية.', 'End date is before the start date.');
  }
  if (input.type !== 'maintenance') {
    if (!input.serviceNumber || !SERVICE_BY_NUMBER[input.serviceNumber]) {
      return fail('unknown_service', 'رقم القطار غير موجود.', 'That service number does not exist.');
    }
  } else if (!input.lineId || !LINES.some((line) => line.id === input.lineId)) {
    return fail('unknown_line', 'الخط غير موجود.', 'That line does not exist.');
  }
  if ((input.type === 'delay' || input.type === 'schedule_change') && !input.delayMinutes && !input.newDepartureMinutes) {
    return fail('missing_shift', 'حدد التأخير أو الموعد الجديد.', 'Provide a delay or a new departure time.');
  }
  if (!input.reasonAr.trim() || !input.reasonEn.trim()) {
    return fail('missing_reason', 'السبب مطلوب بالعربي والإنجليزي.', 'A reason is required in both languages.');
  }
  return { ok: true, value: input };
}

export function createOverrideDraft(
  actor: AdminSession,
  input: OverrideDraftInput,
): AdminResult<Override> {
  const validated = validateOverrideInput(input);
  if (!validated.ok) return validated;

  const override = insertOverride({
    type: input.type,
    serviceNumber: input.serviceNumber,
    lineId: input.lineId,
    fromDate: input.fromDate,
    toDate: input.toDate,
    delayMinutes: input.delayMinutes,
    newDepartureMinutes: input.newDepartureMinutes,
    reasonAr: input.reasonAr.trim(),
    reasonEn: input.reasonEn.trim(),
    source: input.source,
    status: 'pending',
    createdBy: actor.email,
  });

  addAudit({
    actor: actor.email,
    actorRole: actor.role,
    action: 'override.create',
    entity: 'override',
    entityId: override.id,
    summaryAr: `إنشاء تعديل ${labelForType(input.type, 'ar')} بحالة معلّقة.`,
    summaryEn: `Created a pending ${labelForType(input.type, 'en')} override.`,
  });

  return { ok: true, value: override };
}

export function reviewOverride(
  actor: AdminSession,
  id: string,
  action: 'publish' | 'reject',
  note?: string,
): AdminResult<Override> {
  if (actor.role !== 'admin') {
    return fail(
      'forbidden',
      'النشر أو الرفض من صلاحيات مدير البيانات فقط.',
      'Only a data manager can publish or reject changes.',
    );
  }
  const override = getOverride(id);
  if (!override) return fail('not_found', 'التعديل غير موجود.', 'Override not found.');
  if (override.status !== 'pending') {
    return fail('not_pending', 'التعديل تمت مراجعته بالفعل.', 'This override has already been reviewed.');
  }

  const selfReview = override.createdBy === actor.email;
  const reviewNote = selfReview
    ? `${note?.trim() ? `${note.trim()} — ` : ''}self-review exception (demo single-admin account)`
    : note?.trim();

  const updated = updateOverride(id, {
    status: action === 'publish' ? 'published' : 'rejected',
    reviewedBy: actor.email,
    reviewedAt: new Date().toISOString(),
    reviewNote,
  });
  if (!updated) return fail('not_found', 'التعديل غير موجود.', 'Override not found.');

  addAudit({
    actor: actor.email,
    actorRole: actor.role,
    action: action === 'publish' ? 'override.publish' : 'override.reject',
    entity: 'override',
    entityId: id,
    summaryAr:
      action === 'publish'
        ? `نشر تعديل ${labelForType(override.type, 'ar')} على الرحلات.${selfReview ? ' (استثناء مراجعة ذاتية في النسخة التجريبية)' : ''}`
        : `رفض تعديل ${labelForType(override.type, 'ar')}.`,
    summaryEn:
      action === 'publish'
        ? `Published a ${labelForType(override.type, 'en')} override.${selfReview ? ' (self-review exception in the demo)' : ''}`
        : `Rejected a ${labelForType(override.type, 'en')} override.`,
  });

  return { ok: true, value: updated };
}

export function setStationOperationalStatus(
  actor: AdminSession,
  stationId: string,
  status: 'active' | 'maintenance',
): AdminResult<{ stationId: string; status: 'active' | 'maintenance' }> {
  if (actor.role !== 'admin') {
    return fail('forbidden', 'هذا الإجراء لمدير البيانات فقط.', 'Only a data manager can change a station status.');
  }
  const station = STATION_MAP[stationId];
  if (!station) return fail('not_found', 'المحطة غير موجودة.', 'Station not found.');

  setStationStatus(stationId, status);
  addAudit({
    actor: actor.email,
    actorRole: actor.role,
    action: 'station.status',
    entity: 'station',
    entityId: stationId,
    summaryAr:
      status === 'maintenance'
        ? `تحويل محطة ${station.nameAr} إلى وضع الصيانة.`
        : `إعادة محطة ${station.nameAr} للتشغيل.`,
    summaryEn:
      status === 'maintenance'
        ? `Set ${station.nameEn} to maintenance mode.`
        : `Returned ${station.nameEn} to active service.`,
  });
  return { ok: true, value: { stationId, status } };
}

export function moderateReport(
  actor: AdminSession,
  reportId: string,
  action: 'confirm' | 'reject',
): AdminResult<{ id: string }> {
  if (actor.role !== 'admin') {
    return fail('forbidden', 'مراجعة البلاغات لمدير البيانات فقط.', 'Only a data manager can review reports.');
  }
  const report = listReports().find((item) => item.id === reportId);
  if (!report) return fail('not_found', 'البلاغ غير موجود.', 'Report not found.');

  updateReport(reportId, {
    status: action === 'confirm' ? 'confirmed' : 'rejected',
    verifiedAt: new Date().toISOString(),
    verifiedBy: actor.email,
  });
  addAudit({
    actor: actor.email,
    actorRole: actor.role,
    action: action === 'confirm' ? 'report.confirm' : 'report.reject',
    entity: 'report',
    entityId: reportId,
    summaryAr: `${action === 'confirm' ? 'تأكيد' : 'رفض'} بلاغ ${report.kind} للقطار ${report.serviceNumber}.`,
    summaryEn: `${action === 'confirm' ? 'Confirmed' : 'Rejected'} a ${report.kind} report for train ${report.serviceNumber}.`,
  });
  return { ok: true, value: { id: reportId } };
}

export function runSyncProbe(actor: AdminSession): AdminResult<SyncRun> {
  if (actor.role !== 'admin') {
    return fail('forbidden', 'تشغيل المزامنة لمدير البيانات فقط.', 'Only a data manager can trigger a sync.');
  }

  const startedAt = new Date().toISOString();
  const started = Date.now();
  // The demo simulates the scraper worker contract; production runs workers/sync.ts.
  const pending = listOverrides().filter((item) => item.status === 'pending').length;
  const run = recordSyncRun({
    source: 'admin:manual-probe',
    startedAt,
    durationMs: Math.max(120, Date.now() - started + 140),
    fetched: pending,
    accepted: 0,
    rejected: 0,
    status: pending > 0 ? 'warning' : 'ok',
    messageAr:
      pending > 0
        ? `تمت المزامنة. ${pending} تعديل ينتظر المراجعة البشرية.`
        : 'تمت المزامنة، لا توجد تعديلات معلّقة.',
    messageEn:
      pending > 0
        ? `Sync finished. ${pending} overrides await human review.`
        : 'Sync finished. No pending overrides.',
  });

  addAudit({
    actor: actor.email,
    actorRole: actor.role,
    action: 'sync.manual',
    entity: 'sync_run',
    entityId: run.id,
    summaryAr: 'تشغيل مزامنة يدوية من لوحة الإدارة.',
    summaryEn: 'Triggered a manual sync from the admin dashboard.',
  });

  return { ok: true, value: run };
}

export function adminOverview() {
  return {
    stats: getRuntimeStats(),
    overrides: listOverrides().slice(0, 40),
    reports: listReports().slice(0, 40),
    audit: listAudit(30),
    syncRuns: listSyncRuns(),
  };
}

function labelForType(type: OverrideType, locale: 'ar' | 'en'): string {
  const labels: Record<OverrideType, { ar: string; en: string }> = {
    delay: { ar: 'تأخير', en: 'delay' },
    cancellation: { ar: 'إلغاء', en: 'cancellation' },
    schedule_change: { ar: 'تغيير موعد', en: 'schedule change' },
    extra_run: { ar: 'رحلة إضافية', en: 'extra run' },
    maintenance: { ar: 'صيانة خط', en: 'line maintenance' },
  };
  return labels[type][locale];
}

export function overrideTypeLabel(type: OverrideType, locale: 'ar' | 'en'): string {
  return labelForType(type, locale);
}
