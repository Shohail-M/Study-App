import React from 'react';
import { getAllRanks, computeEffectiveScore } from '../utils/progression';
import { useProgression } from '../hooks/useProgression';

interface RankingsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const RankingsModal: React.FC<RankingsModalProps> = ({ isOpen, onClose }) => {
  const { score, rankInfo, completedTasks, completedBooks, streak } = useProgression();

  if (!isOpen) return null;

  const ranks = getAllRanks();
  const current = rankInfo;
  const nextMin = current.nextMinScore;
  const span = nextMin != null ? Math.max(1, nextMin - current.minScore) : 1;
  const intoTier = Math.max(0, score - current.minScore);
  const progressPct = nextMin != null ? Math.min(100, Math.round((intoTier / span) * 100)) : 100;
  const remaining = nextMin != null ? Math.max(0, nextMin - score) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-surface-container-high rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold headline-text text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">military_tech</span>
              Rankings
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">Rank increases with your overall score (XP + streak + tasks + books).</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Current Rank Summary */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/15 via-surface-container-high to-secondary/10 border border-primary/20">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Current Rank</p>
              <p className="text-2xl font-extrabold headline-text text-white mt-1">{current.name}</p>
              <p className="text-xs text-on-surface-variant mt-1">{current.tier} · Division {current.division}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Effective Score</p>
              <p className="text-2xl font-extrabold headline-text text-primary mt-1 tabular-nums">{score.toLocaleString()}</p>
              <p className="text-[10px] text-on-surface-variant mt-1">
                streak {streak}d · tasks {completedTasks} · books {completedBooks}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                {nextMin != null ? 'Progress to Next Rank' : 'Top Rank Reached'}
              </span>
              <span className="text-xs font-black text-primary tabular-nums">{progressPct}%</span>
            </div>
            <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1.5">
              {nextMin != null ? (
                <>
                  <span className="text-white font-bold tabular-nums">{remaining.toLocaleString()}</span> points until{' '}
                  <span className="text-white font-bold tabular-nums">{nextMin.toLocaleString()}</span>
                </>
              ) : (
                <>You have reached the top of the ladder.</>
              )}
            </p>
          </div>
        </div>

        {/* Full hierarchy */}
        <div className="max-h-[45vh] overflow-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ranks.map(r => {
              const isCurrent = r.name === current.name;
              const isReached = score >= r.minScore;
              return (
                <div
                  key={r.name}
                  className={`p-4 rounded-2xl border transition-colors ${
                    isCurrent
                      ? 'border-primary bg-primary/10'
                      : isReached
                      ? 'border-tertiary/30 bg-tertiary/5'
                      : 'border-white/5 bg-surface-container'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-black text-white headline-text">{r.name}</p>
                    {isCurrent && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">Current</span>
                    )}
                    {!isCurrent && isReached && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-tertiary">Reached</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Unlock at <span className="text-white font-bold tabular-nums">{r.minScore.toLocaleString()}</span> score
                    {r.nextMinScore ? (
                      <> · Next at <span className="text-white font-bold tabular-nums">{r.nextMinScore.toLocaleString()}</span></>
                    ) : (
                      <> · <span className="text-tertiary font-bold">Top Rank</span></>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Re-export the score helper so the modal docs stay aligned with progression utils.
export { computeEffectiveScore };

export default RankingsModal;
