import { getStationBoard } from '@/lib/live';
import { STATION_MAP } from '@/lib/data/stations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = Promise<{ stationId: string }>;

/**
 * Server-Sent Events feed for the live station board.
 *
 * The demo recomputes the board in memory every 20 seconds. In production the
 * same route subscribes to Redis pub/sub, where the scraper worker publishes
 * confirmed station events — the client contract stays identical.
 */
export async function GET(request: Request, { params }: { params: Params }) {
  const { stationId } = await params;
  const station = STATION_MAP[stationId];
  if (!station) {
    return new Response('Unknown station', { status: 404 });
  }

  const url = new URL(request.url);
  const direction = url.searchParams.get('direction') === 'arrivals' ? 'arrival' : 'departure';
  const encoder = new TextEncoder();
  const intervalMs = 20_000;

  let timer: ReturnType<typeof setInterval> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      const push = () => {
        const board = getStationBoard({
          stationId: station.id,
          direction,
          limit: 20,
        });
        send('board', {
          generatedAtIso: board.generatedAtIso,
          direction,
          station: board.station,
          rows: direction === 'arrival' ? board.arrivals : board.departures,
        });
      };

      send('hello', {
        station: { id: station.id, nameAr: station.nameAr, nameEn: station.nameEn, code: station.code },
        direction,
        intervalMs,
      });
      push();

      timer = setInterval(push, intervalMs);
      heartbeat = setInterval(() => send('ping', { at: new Date().toISOString() }), 10_000);

      request.signal.addEventListener('abort', () => {
        closed = true;
        if (timer) clearInterval(timer);
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      if (timer) clearInterval(timer);
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
