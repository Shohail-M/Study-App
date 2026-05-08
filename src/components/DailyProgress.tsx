import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';

export const DailyProgress: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { weeklyProgress, avgConcentration, dailyTargetHours } = useAnalytics();
  const [animate, setAnimate] = useState(false);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState<number>(dailyTargetHours);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setTargetDraft(dailyTargetHours);
  }, [dailyTargetHours]);

  const todayLabel = weeklyProgress?.[6]?.label ?? '';
  const todayHours = todayLabel ? Number.parseFloat(todayLabel.replace('h', '')) : 0;

  return (
    <section className="col-span-12 lg:col-span-8 bg-surface-container-high rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-2xl border border-white/5 animate-fade-in-up delay-100">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-10">
          <div>
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-full mb-4">
              Focus Goal
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold headline-text text-white">Daily Study Progress</h3>
          </div>
          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-black headline-text text-white">
              {Number.isFinite(todayHours) ? todayHours.toFixed(1) : '0.0'}
              <span className="text-lg text-on-surface-variant font-normal">/ {dailyTargetHours}h</span>
            </span>
            <div className="mt-2 flex justify-end gap-2">
              {!isEditingTarget ? (
                <button
                  onClick={() => setIsEditingTarget(true)}
                  className="text-xs font-bold uppercase tracking-widest text-outline hover:text-white transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">tune</span>
                  Edit Target
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    step={0.5}
                    value={targetDraft}
                    onChange={(e) => setTargetDraft(Number(e.target.value))}
                    className="w-20 bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    onClick={() => {
                      const planned = ((user?.settings?.pomodoroWork ?? 25) * (user?.settings?.pomodoroCycles ?? 4)) / 60;
                      const suggested = Math.min(24, Math.max(1, Math.round(planned * 2) / 2));
                      setTargetDraft(suggested);
                    }}
                    className="px-3 py-2 bg-surface-container-highest text-on-surface text-xs font-black rounded-lg hover:bg-surface-bright transition-colors"
                    title="Set target from your timer plan"
                    type="button"
                  >
                    Use Timer
                  </button>
                  <button
                    onClick={async () => {
                      const next = Number.isFinite(targetDraft) ? Math.min(24, Math.max(1, targetDraft)) : dailyTargetHours;
                      await updateUser({
                        settings: {
                          ...(user?.settings ?? { pomodoroWork: 25, pomodoroBreak: 5, pomodoroCycles: 4, dailyTargetHours: 6 }),
                          dailyTargetHours: next,
                        }
                      });
                      setIsEditingTarget(false);
                    }}
                    className="px-3 py-2 bg-primary text-on-primary text-xs font-black rounded-lg hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setTargetDraft(dailyTargetHours);
                      setIsEditingTarget(false);
                    }}
                    className="px-3 py-2 bg-surface-container-highest text-on-surface text-xs font-black rounded-lg hover:bg-surface-bright transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes liquidMove {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>

        {/* Progress Orbs */}
        <div className="flex items-end gap-3 sm:gap-6 h-36 sm:h-48 mb-8">
          {weeklyProgress.map((day) => (
            <div
              key={day.day}
              className={`flex-1 bg-surface-container-highest rounded-full relative overflow-hidden transition-all duration-500 ${
                day.isToday ? 'h-[120%] -mb-4' : 'h-full'
              }`}
            >
              <div
                className={`absolute bottom-0 left-0 w-full rounded-full transition-all duration-1000 ease-out ${
                  day.isToday
                    ? 'bg-gradient-to-t from-tertiary to-tertiary-dim'
                    : 'bg-gradient-to-t from-primary to-primary-container'
                }`}
                style={{ height: animate ? `${day.percentage}%` : '0%' }}
              />
              {/* Liquid shimmer overlay */}
              <div
                className="absolute bottom-0 left-0 w-[200%] opacity-25 pointer-events-none"
                style={{
                  height: animate ? `${day.percentage}%` : '0%',
                  background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.20) 0px, rgba(255,255,255,0.08) 14px, rgba(255,255,255,0.20) 28px)',
                  animation: day.percentage > 0 ? 'liquidMove 2.5s linear infinite' : undefined,
                }}
              />
              <div className={`absolute inset-0 flex flex-col justify-end items-center ${day.isToday ? 'pb-8' : 'pb-4'} ${
                day.isToday ? 'text-on-tertiary font-black' : day.percentage > 0 ? 'text-on-primary-container font-bold' : 'text-on-surface-variant font-bold'
              } text-[10px] sm:text-xs`}>
                {day.label}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-6">
          <div className="p-3 sm:p-4 bg-surface-container rounded-lg">
            <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">XP Earned</p>
            <p className="text-lg sm:text-xl font-bold text-tertiary">{(user?.xp ?? 0).toLocaleString()} XP</p>
          </div>
          <div className="p-3 sm:p-4 bg-surface-container rounded-lg">
            <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Concentration</p>
            <p className="text-lg sm:text-xl font-bold text-white">{avgConcentration}%</p>
          </div>
          <div className="p-3 sm:p-4 bg-surface-container rounded-lg">
            <p className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Rank</p>
            <p className="text-lg sm:text-xl font-bold text-secondary">{user?.rank || 'Gold II'}</p>
          </div>
        </div>
      </div>

      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 blur-[100px] rounded-full" />
    </section>
  );
};

export default DailyProgress;
