import Link from 'next/link';
import { ArrowLeft, ArrowRight, MonitorPlay } from 'lucide-react';
import type { Locale, StationBoard } from '@/types/rail';
import { STATION_MAP } from '@/lib/data/stations';
import { BoardTable, ConfidenceLegend } from '@/components/board/BoardTable';
import { LiveRefresher } from '@/components/trip/LiveBits';

const BOARD_STATIONS = ['cairo-ramses', 'alexandria-sidi-gaber', 'tanta', 'asyut', 'luxor'];

export function LiveBoardPreview({
  locale,
  board,
}: {
  locale: Locale;
  board: StationBoard;
}) {
  const ar = locale === 'ar';
  const station = STATION_MAP[board.station.id];

  return (
    <section className="page-shell py-8 sm:py-10">
      <div className="relative overflow-hidden rounded-2xl bg-[#071a33] text-white shadow-board sm:rounded-3xl">
        <div className="pointer-events-none absolute inset-0 opacity-[0.55] hero-grid" aria-hidden />
        <div
          className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-4 sm:p-5">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300/70">
              <MonitorPlay className="h-3.5 w-3.5" aria-hidden />
              {ar ? 'لوحة المحطة المباشرة' : 'Live station board'}
            </p>
            <h2 className="mt-1 text-lg font-bold sm:text-xl">
              {ar ? station.nameAr : station.nameEn}
            </h2>
            <p className="mt-0.5 text-[11px] text-brand-200/60">
              {ar
                ? 'نفس فكرة الشاشة داخل المحطة، من أي مكان — للتحديث قبل التحرك.'
                : 'The same board you see at the station, from anywhere — check before you leave.'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <LiveRefresher locale={locale} intervalMs={60_000} onDark className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1" />
            <Link
              href={`/board?station=${station.id}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-200 transition hover:text-white"
            >
              {ar ? 'اللوحة الكاملة' : 'Full board'}
              {ar ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
            </Link>
          </div>
        </div>

        <div className="relative flex gap-1 overflow-x-auto border-b border-white/10 px-3 py-2 no-scrollbar">
          {BOARD_STATIONS.map((id) => {
            const item = STATION_MAP[id];
            const active = id === station.id;
            return (
              <Link
                key={id}
                href={`/station/${id}`}
                className={
                  active
                    ? 'shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white'
                    : 'shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-medium text-brand-200/60 transition hover:bg-white/5 hover:text-white'
                }
              >
                {ar ? item.nameAr : item.nameEn}
              </Link>
            );
          })}
        </div>

        <div className="relative">
          <BoardTable locale={locale} rows={board.departures} mode="departure" dense />
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
          <ConfidenceLegend locale={locale} />
          <p className="text-[9px] text-brand-300/50">
            {ar ? 'اللوحة تعرض المغادرة القادمة خلال 4 ساعات' : 'Next 4 hours of departures'}
          </p>
        </div>
      </div>
    </section>
  );
}
