import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getTripById } from '@/lib/search';
import { getStationBoard, getNetworkSnapshot } from '@/lib/live';
import { clientFingerprint, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  trip: z.string().regex(/^\d{3,5}-\d{4}-\d{2}-\d{2}$/).optional(),
  station: z.string().min(2).max(60).optional(),
  direction: z.enum(['departures', 'arrivals']).optional(),
});

export async function GET(request: Request) {
  const limit = rateLimit(`live:${clientFingerprint(request.headers)}`, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ message: 'Too many requests.' }, { status: 429 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    trip: url.searchParams.get('trip') ?? undefined,
    station: url.searchParams.get('station') ?? undefined,
    direction: url.searchParams.get('direction') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid live-status query' }, { status: 422 });
  }

  const now = new Date();
  const { trip, station, direction } = parsed.data;

  if (trip) {
    const view = getTripById(trip, { now });
    if (!view) {
      return NextResponse.json({ message: 'Trip not found' }, { status: 404 });
    }
    return NextResponse.json(
      {
        now: now.toISOString(),
        tripId: view.tripId,
        status: view.status,
        confidence: view.confidence,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (station) {
    const board = getStationBoard({
      stationId: station,
      direction: direction === 'arrivals' ? 'arrival' : 'departure',
      limit: 20,
      now,
    });
    return NextResponse.json(
      {
        now: now.toISOString(),
        generatedAtIso: board.generatedAtIso,
        station: board.station,
        direction: direction ?? 'departures',
        rows: direction === 'arrivals' ? board.arrivals : board.departures,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    { now: now.toISOString(), network: getNetworkSnapshot(now) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
