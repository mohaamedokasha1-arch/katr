import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createOverrideDraft } from '@/lib/admin';
import { listOverrides } from '@/lib/store';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  type: z.enum(['delay', 'cancellation', 'schedule_change', 'extra_run', 'maintenance']),
  serviceNumber: z.string().regex(/^\d{1,5}$/).optional(),
  lineId: z.string().max(40).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  delayMinutes: z.number().int().min(0).max(1440).optional(),
  newDepartureMinutes: z.number().int().min(0).max(1439).optional(),
  reasonAr: z.string().trim().min(3).max(240),
  reasonEn: z.string().trim().min(3).max(240),
  source: z.enum(['official', 'ops', 'partner', 'community']).default('ops'),
});

export async function GET() {
  return NextResponse.json({
    overrides: listOverrides().map((override) => ({
      ...override,
      isPending: override.status === 'pending',
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', issues: parsed.error.issues }, { status: 422 });
  }

  const result = createOverrideDraft(session, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.code, messageAr: result.messageAr, messageEn: result.messageEn }, { status: 400 });
  }
  return NextResponse.json({ override: result.value }, { status: 201 });
}
