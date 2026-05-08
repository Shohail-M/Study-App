import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useWeeklyLeaderboard } from '../hooks/useWeeklyLeaderboard';
import { useFirebase } from '../utils/firebaseMode';

export const LeaderboardPage: React.FC = () => {
  const { entries, weekKey } = useWeeklyLeaderboard();

  if (!useFirebase) {
    return (
      <DashboardLayout>
        <div className="bg-surface-container-high rounded-2xl p-8 border border-white/5">
          <h2 className="text-2xl font-black text-white headline-text">Ranked (Weekly)</h2>
          <p className="text-on-surface-variant mt-2">Leaderboard requires Firebase configuration in `.env`.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in-up">
        <h2 className="text-3xl font-extrabold headline-text text-white">Ranked Ladder</h2>
        <p className="text-on-surface-variant mt-2">Weekly season: <span className="text-white font-bold">{weekKey}</span></p>
      </div>

      <div className="bg-surface-container-high rounded-2xl p-6 border border-white/5">
        {entries.length === 0 ? (
          <div className="py-16 text-center text-outline/40">
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
    </DashboardLayout>
  );
};

export default LeaderboardPage;

