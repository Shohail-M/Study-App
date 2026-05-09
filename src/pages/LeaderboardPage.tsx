import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useWeeklyLeaderboard } from '../hooks/useWeeklyLeaderboard';
import { useFirebase } from '../utils/firebaseMode';
import { useProgression } from '../hooks/useProgression';
import { getTierVisual } from '../utils/progression';
import { RankShield } from '../components/RankShield';
import { RankCarousel } from '../components/RankCarousel';

export const LeaderboardPage: React.FC = () => {
  const { entries, weekKey } = useWeeklyLeaderboard();
  const { score, rankInfo, completedTasks, completedBooks, streak } = useProgression();

  const v = getTierVisual(rankInfo.tier);
  const nextMin = rankInfo.nextMinScore;
  const span = nextMin != null ? Math.max(1, nextMin - rankInfo.minScore) : 1;
  const intoTier = Math.max(0, score - rankInfo.minScore);
  const progressPct = nextMin != null ? Math.min(100, Math.round((intoTier / span) * 100)) : 100;
  const remaining = nextMin != null ? Math.max(0, nextMin - score) : 0;

  return (
    <DashboardLayout>
      <div className="mb-6 animate-fade-in-up">
        <h2 className="text-3xl font-extrabold headline-text text-white">Ranked</h2>
        <p className="text-on-surface-variant mt-2">Earn score from XP, streaks, completed tasks and books to climb the ladder.</p>
      </div>

      {/* ── Hero: current rank shield + score + progress ────────────────── */}
      <div className={`relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br ${v.gradient} p-6 sm:p-8 mb-8 animate-fade-in-up`}>
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
        <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <RankShield tier={rankInfo.tier} division={rankInfo.division} size="lg" />
          <div className="flex-1 text-center sm:text-left">
            <p className={`text-xs font-black uppercase tracking-[0.3em] ${v.accent}`}>{rankInfo.tier}</p>
            <h3 className="text-4xl sm:text-5xl font-black headline-text text-white mt-1">{rankInfo.name}</h3>
            <p className="text-on-surface-variant mt-2 text-sm">
              <span className="text-white font-black tabular-nums">{score.toLocaleString()}</span> score ·{' '}
              streak <span className="text-white font-bold">{streak}d</span> ·{' '}
              tasks <span className="text-white font-bold">{completedTasks}</span> ·{' '}
              books <span className="text-white font-bold">{completedBooks}</span>
            </p>
            <div className="mt-4 max-w-md mx-auto sm:mx-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  {nextMin != null ? 'Progress to Next Rank' : 'Top Rank Reached'}
                </span>
                <span className="text-xs font-black text-white tabular-nums">{progressPct}%</span>
              </div>
              <div className="h-2.5 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {nextMin != null && (
                <p className="text-[10px] text-on-surface-variant mt-1.5">
                  <span className="text-white font-bold tabular-nums">{remaining.toLocaleString()}</span> points to next rank
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Carousel of all ranks ───────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">military_tech</span>
            <h3 className="text-lg font-black headline-text text-white">All Ranks</h3>
          </div>
          <p className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-outline">
            Swipe or use arrows to browse
          </p>
        </div>
        <RankCarousel score={score} currentRankName={rankInfo.name} />
      </div>

      {/* ── Weekly leaderboard (secondary) ──────────────────────────────── */}
      {useFirebase && (
        <div className="bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">leaderboard</span>
              <div>
                <h3 className="text-base font-black text-white headline-text">Weekly Ladder</h3>
                <p className="text-xs text-on-surface-variant">Season: <span className="text-white font-bold">{weekKey}</span></p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {entries.length === 0 ? (
              <div className="py-12 text-center text-outline/40">
                <span className="material-symbols-outlined text-4xl mb-2">leaderboard</span>
                <p className="text-xs font-black uppercase tracking-widest">No ranked data yet</p>
                <p className="text-sm text-on-surface-variant mt-2">Once sessions are aggregated into weekly seasons, rankings will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.slice(0, 50).map((e, idx) => (
                  <div key={e.id} className="p-4 rounded-2xl bg-surface-container border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 border border-white/5 flex items-center justify-center text-white font-black">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-white font-black">{e.displayName || e.id}</p>
                        <p className="text-xs text-on-surface-variant">
                          Focus: <span className="text-white font-bold">{e.focusMinutes}</span>m · XP: <span className="text-white font-bold">{e.xpGained}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black text-lg">{e.score.toLocaleString()}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-outline">score</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LeaderboardPage;

