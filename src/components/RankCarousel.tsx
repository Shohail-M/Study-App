import React, { useEffect, useRef } from 'react';
import { getAllRanks, getTierVisual } from '../utils/progression';
import { RankShield } from './RankShield';

interface RankCarouselProps {
  readonly score: number;
  readonly currentRankName: string;
}

// Horizontally scrollable / swipeable carousel of every rank tier. Uses native
// scroll-snap for smooth swipe on touch devices, and arrow buttons drive
// programmatic scroll for desktop. The current rank is auto-centered on mount.
export const RankCarousel: React.FC<RankCarouselProps> = ({ score, currentRankName }) => {
  const ranks = getAllRanks();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const idx = ranks.findIndex(r => r.name === currentRankName);
    const target = cardRefs.current[idx >= 0 ? idx : 0];
    if (target && scrollerRef.current) {
      // Center the active card without scrolling the page.
      const scroller = scrollerRef.current;
      const left = target.offsetLeft - (scroller.clientWidth - target.clientWidth) / 2;
      scroller.scrollTo({ left, behavior: 'smooth' });
    }
  }, [currentRankName, ranks.length]);

  const scrollByCards = (dir: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    // Roughly one card width including gap.
    const step = (cardRefs.current[0]?.clientWidth ?? 220) + 16;
    scroller.scrollBy({ left: step * dir * 1.2, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => scrollByCards(-1)}
        aria-label="Previous rank"
        className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface-container-highest border border-white/10 items-center justify-center text-white hover:bg-surface-bright transition-colors shadow-lg"
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>
      <button
        onClick={() => scrollByCards(1)}
        aria-label="Next rank"
        className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface-container-highest border border-white/10 items-center justify-center text-white hover:bg-surface-bright transition-colors shadow-lg"
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 px-1 -mx-1 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {ranks.map((r, i) => {
          const isCurrent = r.name === currentRankName;
          const isReached = score >= r.minScore;
          const v = getTierVisual(r.tier);
          return (
            <div
              key={r.name}
              ref={el => { cardRefs.current[i] = el; }}
              className={[
                'snap-center shrink-0 w-[230px] sm:w-[260px] rounded-3xl p-6',
                'border transition-all duration-300',
                'bg-gradient-to-b from-surface-container-high to-surface-container',
                isCurrent
                  ? `border-transparent ring-2 ${v.ring} scale-[1.03] shadow-2xl ${v.glow}`
                  : isReached
                  ? 'border-white/10'
                  : 'border-white/5 opacity-80',
              ].join(' ')}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <RankShield tier={r.tier} division={r.division} size="lg" locked={!isReached} />
                <div>
                  <p className={`text-xs font-black uppercase tracking-[0.25em] ${v.accent}`}>{r.tier}</p>
                  <h3 className="text-2xl font-black headline-text text-white mt-0.5">{r.name}</h3>
                </div>
                {isCurrent ? (
                  <span className="px-3 py-1 rounded-full bg-primary text-on-primary text-[10px] font-black uppercase tracking-widest">
                    Current Rank
                  </span>
                ) : isReached ? (
                  <span className="px-3 py-1 rounded-full bg-tertiary/15 text-tertiary text-[10px] font-black uppercase tracking-widest">
                    Reached
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] font-black uppercase tracking-widest">
                    Locked
                  </span>
                )}
                <div className="w-full pt-3 border-t border-white/5 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Required Score</p>
                  <p className="text-lg font-black text-white tabular-nums">{r.minScore.toLocaleString()}</p>
                  {r.nextMinScore != null ? (
                    <p className="text-[10px] text-on-surface-variant">
                      Next at <span className="text-white font-bold tabular-nums">{r.nextMinScore.toLocaleString()}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-tertiary font-black uppercase tracking-widest">Top Rank</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RankCarousel;
