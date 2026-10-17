import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { setStationOperationalStatus } from '@/lib/admin';
import { STATION_MAP } from '@/lib/data/stations';
import { getStationStatus } from '@/lib/store';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  status: z.enum(['active', 'maintenance']),
});

type Params = Promise<{ stationId: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { stationId } = await params;
  const station = STATION_MAP[stationId];
  if (!station) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({
    station: { id: station.id, nameAr: station.nameAr, nameEn: station.nameEn },
    status: getStationStatus(stationId),
  });
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { stationId } = await params;
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

  const result = setStationOperationalStatus(session, stationId, parsed.data.status);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.code, messageAr: result.messageAr, messageEn: result.messageEn },
      { status: result.code === 'forbidden' ? 403 : 404 },
    );
  }
  return NextResponse.json({ ok: true, ...result.value });
}
