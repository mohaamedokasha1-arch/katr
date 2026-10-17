'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio } from 'lucide-react';
import type { BoardRow, Locale } from '@/types/rail';
import { BoardTable } from '@/components/board/BoardTable';
import { LiveSignalIcon } from '@/components/ui/LiveSignalIcon';
import { formatClockClient } from '@/lib/client-time';
import { cn } from '@/lib/utils';

type Connection = 'connecting' | 'live' | 'polling';

/**
 * Subscribes to the station SSE feed while the board is open.
 *
 * The server sends a full snapshot on connect and every 20 seconds, so the
 * client never needs to merge deltas. If EventSource is unavailable or the
 * stream errors, we fall back to the page-level refresher (router.refresh)
 * instead of leaving stale rows on screen.
 */
export function LiveBoardFeed({
  locale,
  stationId,
  direction,
  mode,
  initialRows,
  dense = false,
}: {
  locale: Locale;
  stationId: string;
  direction: 'departures' | 'arrivals';
  mode: 'departure' | 'arrival';
  initialRows: BoardRow[];
  dense?: boolean;
}) {
  const ar = locale === 'ar';
  const router = useRouter();
  const [rows, setRows] = useState<BoardRow[]>(initialRows);
  const [connection, setConnection] = useState<Connection>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const mounted = useRef(true);

  // A server refresh (fallback path) replaces props; adopt the fresh snapshot.
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  // If the stream is unavailable, fall back to the server-rendered snapshot
  // refreshed by the router — never leave a frozen board on screen.
  useEffect(() => {
    if (connection !== 'polling') return;
    const timer = window.setInterval(() => router.refresh(), 45_000);
    return () => window.clearInterval(timer);
  }, [connection, router]);

  useEffect(() => {
    mounted.current = true;
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      setConnection('polling');
      return () => {
        mounted.current = false;
      };
    }

    const source = new EventSource(
      `/api/board/${stationId}/stream?direction=${direction}`,
    );

    const onBoard = (event: MessageEvent<string>) => {
      if (!mounted.current) return;
      try {
        const payload = JSON.parse(event.data) as { rows?: BoardRow[] };
        if (Array.isArray(payload.rows)) {
          setRows(payload.rows);
          setLastUpdate(new Date());
          setConnection('live');
        }
      } catch {
        // Ignore malformed frames; keep the last good snapshot.
      }
    };
    const onHello = () => {
      if (mounted.current) setConnection('live');
    };
    const onError = () => {
      if (mounted.current) setConnection('polling');
    };

    source.addEventListener('board', onBoard as EventListener);
    source.addEventListener('hello', onHello);
    source.addEventListener('error', onError);

    return () => {
      mounted.current = false;
      source.removeEventListener('board', onBoard as EventListener);
      source.removeEventListener('hello', onHello);
      source.removeEventListener('error', onError);
      source.close();
    };
  }, [stationId, direction]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/[0.06] px-4 py-1.5 text-[9px] text-brand-200/60">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              connection === 'live'
                ? 'bg-emerald-400'
                : connection === 'polling'
                  ? 'bg-orange-400'
                  : 'bg-slate-400',
            )}
            aria-hidden
          />
          <LiveSignalIcon className="h-3 w-3" animated={connection === 'live'} />
          {connection === 'live'
            ? ar
              ? 'بث مباشر من الخادم'
              : 'Live server stream'
            : connection === 'polling'
              ? ar
                ? 'بث غير متاح — تحديث دوري'
                : 'Stream unavailable — polling'
              : ar
                ? 'بيتصل…'
                : 'Connecting…'}
        </span>
        {lastUpdate ? (
          <span className="num inline-flex items-center gap-1">
            <Radio className="h-2.5 w-2.5" aria-hidden />
            {formatClockClient(lastUpdate.getHours() * 60 + lastUpdate.getMinutes())}
          </span>
        ) : null}
        <span className="ms-auto hidden sm:inline">
          {ar ? 'تحديث كل 20 ثانية' : 'Refreshes every 20s'}
        </span>
      </div>
      <BoardTable locale={locale} rows={rows} mode={mode} dense={dense} />
    </div>
  );
}
