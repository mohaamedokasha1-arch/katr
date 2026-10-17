/**
 * Rakeb timetable sync worker
 * ===========================
 *
 * A standalone process, deployable separately from the Next.js app. It is the
 * write side of the data pipeline described in docs/ARCHITECTURE.md:
 *
 *   source adapter → normalise → validate → diff → pending override → human review
 *
 * The worker deliberately cannot publish. Every observation it accepts lands
 * as a `pending` override so the four-eyes rule and the audit trail hold even
 * when the source is automated.
 *
 * Run:
 *   npm run worker:sync            # continuous, 5-minute cadence
 *   npm run worker:sync -- --once  # single pass (CI, cron, first run)
 *
 * Environment:
 *   RAKEB_WORKER_INTERVAL_MS   default 300000
 *   RAKEB_WORKER_SOURCE        label recorded in the sync run
 *   RAKEB_STATE_FILE           shared state file with the web app
 */
import { addAudit, getPublishedOverrides, insertOverride, recordSyncRun } from '@/lib/store';
import { SERVICES } from '@/lib/data/services';
import { todayCairo } from '@/lib/time';
import type { DataSource, Override, OverrideType, Service } from '@/types/rail';

interface Observation {
  serviceNumber: string;
  date: string;
  type: Extract<OverrideType, 'delay' | 'cancellation'>;
  delayMinutes?: number;
  reasonAr: string;
  reasonEn: string;
  source: DataSource;
}

const REASONS = {
  signal: {
    ar: 'تأخير بسبب أعمال إشارات على المسار',
    en: 'Delay due to signalling work on the route',
  },
  congestion: {
    ar: 'ازدحام حركة على الخط الرئيسي',
    en: 'Traffic congestion on the main line',
  },
  maintenance: {
    ar: 'صيانة دورية للعربات قبل الانطلاق',
    en: 'Routine rolling-stock maintenance before departure',
  },
} as const;

/** A deterministic stand-in for the real scraper adapter. */
function adapter(service: Service, date: string): Observation[] {
  const seed = hash(`${date}:${service.number}`);
  const bucket = seed % 100;

  // ~6% of services get an automated delay observation, ~1% a cancellation.
  if (bucket < 6) {
    const key = bucket % 2 === 0 ? 'congestion' : 'signal';
    return [
      {
        serviceNumber: service.number,
        date,
        type: 'delay',
        delayMinutes: 10 + (seed % 5) * 5,
        reasonAr: REASONS[key].ar,
        reasonEn: REASONS[key].en,
        source: 'ops',
      },
    ];
  }
  if (bucket === 99) {
    return [
      {
        serviceNumber: service.number,
        date,
        type: 'cancellation',
        reasonAr: 'إلغاء تشغيلي من غرفة التحكم',
        reasonEn: 'Operational cancellation from the control room',
        source: 'ops',
      },
    ];
  }
  return [];
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function dedupe(observations: Observation[], published: Override[]): Observation[] {
  return observations.filter((observation) => {
    const exists = published.some(
      (override) =>
        override.serviceNumber === observation.serviceNumber &&
        override.type === observation.type &&
        override.fromDate <= observation.date &&
        override.toDate >= observation.date,
    );
    return !exists;
  });
}

export function runOnce(sourceLabel = process.env.RAKEB_WORKER_SOURCE ?? 'mock-enr-feed'): {
  fetched: number;
  accepted: number;
  rejected: number;
  status: 'ok' | 'warning' | 'failed';
} {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const date = todayCairo();
  const published = getPublishedOverrides();

  let fetched = 0;
  const accepted: Observation[] = [];

  try {
    for (const service of SERVICES) {
      const observations = adapter(service, date);
      fetched += observations.length;
      accepted.push(...observations);
    }
  } catch (error) {
    const run = recordSyncRun({
      source: sourceLabel,
      startedAt,
      durationMs: Date.now() - started,
      fetched,
      accepted: 0,
      rejected: 0,
      status: 'failed',
      messageAr: 'فشل الاتصال بمصدر الجدول. لم يتم تسجيل أي تعديل.',
      messageEn: 'Could not reach the timetable source. No changes were recorded.',
    });
    addAudit({
      actor: 'عامل المزامنة',
      actorRole: 'system',
      action: 'sync.failed',
      entity: 'sync_run',
      entityId: run.id,
      summaryAr: 'فشل تشغيل المزامنة.',
      summaryEn: `Sync failed: ${(error as Error).message}`,
    });
    return { fetched, accepted: 0, rejected: 0, status: 'failed' };
  }

  const fresh = dedupe(accepted, published);
  for (const observation of fresh) {
    insertOverride({
      type: observation.type,
      serviceNumber: observation.serviceNumber,
      fromDate: observation.date,
      toDate: observation.date,
      delayMinutes: observation.delayMinutes,
      reasonAr: observation.reasonAr,
      reasonEn: observation.reasonEn,
      source: observation.source,
      status: 'pending',
      createdBy: 'worker:sync',
    });
  }

  const run = recordSyncRun({
    source: sourceLabel,
    startedAt,
    durationMs: Math.max(40, Date.now() - started),
    fetched,
    accepted: fresh.length,
    rejected: accepted.length - fresh.length,
    status: fresh.length > 0 ? 'warning' : 'ok',
    messageAr:
      fresh.length > 0
        ? `تم استلام ${fresh.length} ملاحظة جديدة، وهي بانتظار المراجعة البشرية.`
        : 'لا توجد تغييرات جديدة عن الجدول المنشور.',
    messageEn:
      fresh.length > 0
        ? `Collected ${fresh.length} new observations awaiting human review.`
        : 'No changes against the published timetable.',
  });

  addAudit({
    actor: 'عامل المزامنة',
    actorRole: 'system',
    action: 'sync.run',
    entity: 'sync_run',
    entityId: run.id,
    summaryAr: `تشغيل مزامنة: ${fresh.length} تعديل معلّق من ${fetched} ملاحظة.`,
    summaryEn: `Sync run: ${fresh.length} pending overrides from ${fetched} observations.`,
  });

  return { fetched, accepted: fresh.length, rejected: accepted.length - fresh.length, status: run.status };
}

async function main() {
  const once = process.argv.includes('--once');
  const interval = Number(process.env.RAKEB_WORKER_INTERVAL_MS ?? 300_000);
  const source = process.env.RAKEB_WORKER_SOURCE ?? 'mock-enr-feed';

  const log = (message: string) => {
    // eslint-disable-next-line no-console
    console.log(`[rakeb-sync ${new Date().toISOString()}] ${message}`);
  };

  log(`starting (${once ? 'single pass' : `every ${Math.round(interval / 1000)}s`}, source=${source})`);
  log(`state file: ${process.env.RAKEB_STATE_FILE ?? '.data/state.json'}`);

  const pass = () => {
    const result = runOnce(source);
    log(
      `fetched=${result.fetched} accepted=${result.accepted} rejected=${result.rejected} status=${result.status}`,
    );
  };

  pass();
  if (once) return;

  const timer = setInterval(pass, interval);
  const shutdown = (signal: string) => {
    log(`received ${signal}, stopping`);
    clearInterval(timer);
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

const invokedDirectly =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  /workers[\\/]sync\.(ts|js)$/.test(process.argv[1]);

if (invokedDirectly) {
  void main();
}
