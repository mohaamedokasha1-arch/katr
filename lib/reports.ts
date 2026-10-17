import type { CrowdReport, ReportKind } from '@/types/rail';
import {
  addAudit,
  getReportsForService,
  insertReport,
  updateReport,
} from '@/lib/store';

export const CONFIRMATION_THRESHOLD = 3;
export const CONSENSUS_WINDOW_MINUTES = 45;

export interface ReportConsensus {
  total: number;
  uniqueReporters: number;
  confirmed: boolean;
  delayMinutes: number;
  latestAtIso: string | null;
  dominantKind: ReportKind | null;
  needed: number;
  reports: CrowdReport[];
}

function groupOf(kind: ReportKind): 'delay' | 'movement' | 'cancelled' {
  if (kind === 'delayed' || kind === 'still_waiting') return 'delay';
  if (kind === 'cancelled') return 'cancelled';
  return 'movement';
}

/**
 * Crowd consensus requires at least three distinct reporters inside a rolling
 * 45-minute window. We deliberately pick the largest matching group so two
 * unrelated claims cannot be combined into a false confirmation.
 */
export function computeConsensus(reports: CrowdReport[]): ReportConsensus {
  const valid = reports
    .filter((report) => report.status !== 'rejected')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const latest = valid[0] ?? null;
  const windowMs = CONSENSUS_WINDOW_MINUTES * 60_000;
  const latestMs = latest ? new Date(latest.createdAt).getTime() : 0;

  const inWindow = valid.filter((report) => {
    if (!latest) return false;
    const diff = Math.abs(new Date(report.createdAt).getTime() - latestMs);
    return diff <= windowMs;
  });

  const groups: Record<'delay' | 'movement' | 'cancelled', CrowdReport[]> = {
    delay: [],
    movement: [],
    cancelled: [],
  };
  for (const report of inWindow) groups[groupOf(report.kind)].push(report);

  let dominant: 'delay' | 'movement' | 'cancelled' = 'delay';
  for (const key of ['delay', 'movement', 'cancelled'] as const) {
    if (groups[key].length > groups[dominant].length) dominant = key;
  }
  const chosen = groups[dominant];
  const uniqueReporters = new Set(chosen.map((report) => report.reporterHash)).size;
  const confirmed = uniqueReporters >= CONFIRMATION_THRESHOLD;

  const delays = chosen
    .map((report) => report.delayMinutes ?? (report.kind === 'still_waiting' ? 10 : 0))
    .filter((value) => value > 0);
  const delayMinutes =
    delays.length > 0
      ? Math.round(delays.reduce((sum, value) => sum + value, 0) / delays.length)
      : 0;

  return {
    total: valid.length,
    uniqueReporters,
    confirmed,
    delayMinutes,
    latestAtIso: latest?.createdAt ?? null,
    dominantKind: chosen[chosen.length - 1]?.kind ?? null,
    needed: Math.max(0, CONFIRMATION_THRESHOLD - uniqueReporters),
    reports: valid,
  };
}

export function getConsensus(serviceNumber: string, date: string): ReportConsensus {
  return computeConsensus(getReportsForService(serviceNumber, date));
}

export interface SubmitReportInput {
  serviceNumber: string;
  date: string;
  stationId: string;
  kind: ReportKind;
  delayMinutes?: number;
  note?: string;
  reporterHash: string;
}

export interface SubmitReportResult {
  report: CrowdReport;
  consensus: ReportConsensus;
  duplicate: boolean;
}

export function submitCrowdReport(input: SubmitReportInput): SubmitReportResult {
  const existing = getReportsForService(input.serviceNumber, input.date);
  const recentDuplicate = existing.find((report) => {
    if (report.reporterHash !== input.reporterHash) return false;
    const age = Date.now() - new Date(report.createdAt).getTime();
    return age < 10 * 60_000;
  });

  if (recentDuplicate) {
    return {
      report: recentDuplicate,
      consensus: computeConsensus(existing),
      duplicate: true,
    };
  }

  const report = insertReport({
    serviceNumber: input.serviceNumber,
    date: input.date,
    stationId: input.stationId,
    kind: input.kind,
    delayMinutes: input.delayMinutes,
    note: input.note,
    status: 'pending',
    reporterHash: input.reporterHash,
  });

  const reports = getReportsForService(input.serviceNumber, input.date);
  const consensus = computeConsensus(reports);

  if (consensus.confirmed) {
    const participants = new Set(consensus.reports.map((item) => item.reporterHash));
    if (participants.size >= CONFIRMATION_THRESHOLD) {
      for (const item of consensus.reports) {
        if (item.status === 'pending') {
          updateReport(item.id, {
            status: 'confirmed',
            verifiedAt: new Date().toISOString(),
            verifiedBy: 'system',
          });
        }
      }
      addAudit({
        actor: 'نظام التحقق المجتمعي',
        actorRole: 'system',
        action: 'report.auto_confirm',
        entity: 'report_batch',
        entityId: `${input.serviceNumber}-${input.date}`,
        summaryAr: `تأكيد مجتمعي تلقائي لبلاغات القطار ${input.serviceNumber} بعد بلوغ النصاب.`,
        summaryEn: `Automatic community confirmation for train ${input.serviceNumber} reports after reaching the threshold.`,
      });
    }
  }

  return {
    report,
    consensus: computeConsensus(getReportsForService(input.serviceNumber, input.date)),
    duplicate: false,
  };
}
