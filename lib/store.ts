import fs from 'node:fs';
import path from 'node:path';
import type {
  AuditEntry,
  CrowdReport,
  NotificationSubscription,
  Override,
  SyncRun,
  UserRole,
} from '@/types/rail';
import { buildSeedState, type RuntimeState } from '@/lib/data/seed-runtime';
import { todayCairo } from '@/lib/time';

/**
 * File-backed runtime store.
 *
 * This is the demo substitute for the PostgreSQL + Redis layer described in
 * the architecture. The public API is deliberately repository-shaped so it can
 * be swapped for a real database without touching the UI.
 *
 * - State survives dev-server restarts within the same Cairo day.
 * - On a new day the seed is refreshed so demo announcements stay relevant.
 * - Writes are best-effort on read-only/serverless file systems.
 */

const stateFile = process.env.RAKEB_STATE_FILE
  ? path.resolve(process.env.RAKEB_STATE_FILE)
  : path.join(process.cwd(), '.data', 'state.json');

const globalStore = globalThis as typeof globalThis & {
  __rakebRuntimeState?: RuntimeState;
};

let persistWarningShown = false;

function normaliseState(raw: unknown, today: string): RuntimeState | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<RuntimeState>;
  if (candidate.version !== 1 || candidate.seedDay !== today) return null;
  if (!Array.isArray(candidate.overrides) || !Array.isArray(candidate.reports)) return null;
  return {
    version: 1,
    seedDay: today,
    overrides: candidate.overrides,
    reports: candidate.reports,
    audit: Array.isArray(candidate.audit) ? candidate.audit : [],
    notifications: Array.isArray(candidate.notifications) ? candidate.notifications : [],
    syncRuns: Array.isArray(candidate.syncRuns) ? candidate.syncRuns : [],
    stationStatus:
      candidate.stationStatus && typeof candidate.stationStatus === 'object'
        ? candidate.stationStatus
        : {},
  };
}

function readPersisted(today: string): RuntimeState | null {
  if (process.env.RAKEB_RESET_STATE === '1') return null;
  try {
    const raw = fs.readFileSync(stateFile, 'utf8');
    return normaliseState(JSON.parse(raw), today);
  } catch {
    return null;
  }
}

function persist(state: RuntimeState): void {
  try {
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    if (!persistWarningShown) {
      persistWarningShown = true;
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[rakeb] Runtime state is in-memory only (filesystem not writable).');
      }
    }
  }
}

export function getRuntimeState(): RuntimeState {
  if (!globalStore.__rakebRuntimeState) {
    const today = todayCairo();
    globalStore.__rakebRuntimeState = readPersisted(today) ?? buildSeedState();
  }
  return globalStore.__rakebRuntimeState;
}

function commit(state: RuntimeState): void {
  globalStore.__rakebRuntimeState = state;
  persist(state);
}

export function resetRuntimeState(): RuntimeState {
  const fresh = buildSeedState();
  commit(fresh);
  return fresh;
}

export function newId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}

// ── Overrides ─────────────────────────────────────────────────────────────

export function listOverrides(): Override[] {
  return getRuntimeState().overrides;
}

export function getOverride(id: string): Override | undefined {
  return getRuntimeState().overrides.find((item) => item.id === id);
}

export function insertOverride(
  input: Omit<Override, 'id' | 'createdAt' | 'status'> & {
    status?: Override['status'];
    createdAt?: string;
  },
): Override {
  const state = getRuntimeState();
  const override: Override = {
    ...input,
    id: newId('ovr'),
    status: input.status ?? 'pending',
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  state.overrides.unshift(override);
  commit(state);
  return override;
}

export function updateOverride(id: string, patch: Partial<Override>): Override | undefined {
  const state = getRuntimeState();
  const index = state.overrides.findIndex((item) => item.id === id);
  if (index === -1) return undefined;
  const updated = { ...state.overrides[index], ...patch, id };
  state.overrides[index] = updated;
  commit(state);
  return updated;
}

export function getPublishedOverrides(): Override[] {
  return getRuntimeState().overrides.filter((item) => item.status === 'published');
}

export function getPendingOverrides(): Override[] {
  return getRuntimeState().overrides.filter((item) => item.status === 'pending');
}

// ── Crowd reports ─────────────────────────────────────────────────────────

export function listReports(): CrowdReport[] {
  return getRuntimeState().reports;
}

export function getReportsForService(serviceNumber: string, date: string): CrowdReport[] {
  return getRuntimeState().reports.filter(
    (item) => item.serviceNumber === serviceNumber && item.date === date,
  );
}

export function insertReport(input: Omit<CrowdReport, 'id' | 'createdAt'>): CrowdReport {
  const state = getRuntimeState();
  const report: CrowdReport = {
    ...input,
    id: newId('rep'),
    createdAt: new Date().toISOString(),
  };
  state.reports.unshift(report);
  commit(state);
  return report;
}

export function updateReport(id: string, patch: Partial<CrowdReport>): CrowdReport | undefined {
  const state = getRuntimeState();
  const index = state.reports.findIndex((item) => item.id === id);
  if (index === -1) return undefined;
  const updated = { ...state.reports[index], ...patch, id };
  state.reports[index] = updated;
  commit(state);
  return updated;
}

// ── Audit log ─────────────────────────────────────────────────────────────

export function listAudit(limit = 100): AuditEntry[] {
  return getRuntimeState().audit.slice(0, limit);
}

export function addAudit(input: {
  actor: string;
  actorRole: UserRole | 'system';
  action: string;
  entity: string;
  entityId: string;
  summaryAr: string;
  summaryEn: string;
}): AuditEntry {
  const state = getRuntimeState();
  const entry: AuditEntry = {
    id: newId('audit'),
    at: new Date().toISOString(),
    ...input,
  };
  state.audit.unshift(entry);
  state.audit = state.audit.slice(0, 300);
  commit(state);
  return entry;
}

// ── Station operational status ────────────────────────────────────────────

export function getStationStatusOverrides(): Record<string, 'active' | 'maintenance'> {
  return getRuntimeState().stationStatus;
}

export function getStationStatus(stationId: string): 'active' | 'maintenance' {
  return getRuntimeState().stationStatus[stationId] ?? 'active';
}

export function setStationStatus(
  stationId: string,
  status: 'active' | 'maintenance',
): void {
  const state = getRuntimeState();
  state.stationStatus[stationId] = status;
  commit(state);
}

// ── Notification subscriptions (demo) ─────────────────────────────────────

export function listNotifications(): NotificationSubscription[] {
  return getRuntimeState().notifications;
}

export function insertNotification(
  input: Omit<NotificationSubscription, 'id' | 'createdAt'>,
): NotificationSubscription {
  const state = getRuntimeState();
  const subscription: NotificationSubscription = {
    ...input,
    id: newId('sub'),
    createdAt: new Date().toISOString(),
  };
  state.notifications.unshift(subscription);
  state.notifications = state.notifications.slice(0, 500);
  commit(state);
  return subscription;
}

// ── Sync runs ─────────────────────────────────────────────────────────────

export function listSyncRuns(): SyncRun[] {
  return getRuntimeState().syncRuns.slice(0, 20);
}

export function recordSyncRun(run: Omit<SyncRun, 'id'>): SyncRun {
  const state = getRuntimeState();
  const entry: SyncRun = { ...run, id: newId('sync') };
  state.syncRuns.unshift(entry);
  state.syncRuns = state.syncRuns.slice(0, 40);
  commit(state);
  return entry;
}

// ── Aggregates used by the admin dashboard ────────────────────────────────

export function getRuntimeStats(): {
  pendingOverrides: number;
  publishedOverrides: number;
  reportsToday: number;
  pendingReports: number;
  notifications: number;
} {
  const state = getRuntimeState();
  const today = todayCairo();
  return {
    pendingOverrides: state.overrides.filter((item) => item.status === 'pending').length,
    publishedOverrides: state.overrides.filter((item) => item.status === 'published').length,
    reportsToday: state.reports.filter((item) => item.date === today).length,
    pendingReports: state.reports.filter((item) => item.status === 'pending').length,
    notifications: state.notifications.length,
  };
}
