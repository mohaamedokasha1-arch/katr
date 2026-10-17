import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { reviewOverride } from '@/lib/admin';
import { getOverride } from '@/lib/store';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  action: z.enum(['publish', 'reject']),
  note: z.string().trim().max(240).optional(),
});

type Params = Promise<{ id: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const override = getOverride(id);
  if (!override) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ override });
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
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

  const result = reviewOverride(session, id, parsed.data.action, parsed.data.note);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.code, messageAr: result.messageAr, messageEn: result.messageEn },
      { status: result.code === 'forbidden' ? 403 : result.code === 'not_found' ? 404 : 409 },
    );
  }
  return NextResponse.json({ override: result.value });
}
