import { NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import { z } from 'zod';
import type { ReportKind } from '@/types/rail';
import { submitCrowdReport } from '@/lib/reports';
import { SERVICE_BY_NUMBER } from '@/lib/data/services';
import { STATION_MAP } from '@/lib/data/stations';
import { rateLimit, clientFingerprint } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const reportKinds = [
  'still_waiting',
  'delayed',
  'moving',
  'arrived',
  'cancelled',
] as const satisfies readonly ReportKind[];

const bodySchema = z.object({
  serviceNumber: z.string().regex(/^\d{1,5}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stationId: z.string().min(2).max(60),
  kind: z.enum(reportKinds),
  delayMinutes: z.number().int().min(0).max(600).optional(),
  note: z.string().trim().max(240).optional(),
});

/**
 * Reporter identity is a rotating salted hash. We never store an IP or a user
 * id — only this opaque value, so a rider can confirm a change once without
 * creating an account.
 */
function reporterHashFor(request: Request): string {
  const raw = clientFingerprint(request.headers);
  const day = new Date().toISOString().slice(0, 10);
  // No known/default salt: fall back to the server-only auth secret, and in
  // production require an explicit RAKEB_REPORT_SALT (fail closed below).
  const salt =
    process.env.RAKEB_REPORT_SALT ??
    process.env.RAKEB_AUTH_SECRET ??
    (process.env.NODE_ENV === 'production' ? '' : 'rakeb-dev-only-salt');
  if (!salt) throw new Error('RAKEB_REPORT_SALT is required in production.');
  return createHash('sha256').update(`${salt}:${day}:${raw}`).digest('hex').slice(0, 24);
}

export async function POST(request: Request) {
  const limit = rateLimit(`reports:${clientFingerprint(request.headers)}`, 12, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { message: 'Too many reports, try again in a minute.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000))) },
      },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: 'Invalid report payload',
        issues: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      },
      { status: 422 },
    );
  }

  const { serviceNumber, date, stationId, kind, delayMinutes, note } = parsed.data;

  const service = SERVICE_BY_NUMBER[serviceNumber];
  if (!service) {
    return NextResponse.json({ message: 'Unknown service number' }, { status: 404 });
  }
  if (!STATION_MAP[stationId]) {
    return NextResponse.json({ message: 'Unknown station' }, { status: 404 });
  }
  if (kind === 'delayed' && (delayMinutes ?? 0) <= 0) {
    return NextResponse.json(
      { message: 'delayMinutes is required when reporting a delay' },
      { status: 422 },
    );
  }

  const result = submitCrowdReport({
    serviceNumber,
    date,
    stationId,
    kind,
    delayMinutes,
    note,
    reporterHash: reporterHashFor(request),
  });

  return NextResponse.json(
    {
      ok: true,
      requestId: randomUUID(),
      duplicate: result.duplicate,
      consensus: {
        total: result.consensus.total,
        uniqueReporters: result.consensus.uniqueReporters,
        confirmed: result.consensus.confirmed,
        delayMinutes: result.consensus.delayMinutes,
        needed: result.consensus.needed,
      },
    },
    { status: result.duplicate ? 200 : 201 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      message:
        'Crowd reports are accepted via POST with serviceNumber, date, stationId and kind. Reports become visible to everyone after three independent confirmations.',
    },
    { status: 405, headers: { Allow: 'POST' } },
  );
}
