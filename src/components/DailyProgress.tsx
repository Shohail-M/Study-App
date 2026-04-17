import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';

export const DailyProgress: React.FC = () => {
  const { user } = useAuth();
  const { weeklyProgress, avgConcentration } = useAnalytics();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 300);
    return () => clearTimeout(timer);
  }, []);

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
              {weeklyProgress?.[6]?.label ? parseFloat(weeklyProgress[6].label) : 0}
              <span className="text-lg text-on-surface-variant font-normal">/ 6h</span>
            </span>
          </div>
        </div>

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
            <p className="text-lg sm:text-xl font-bold text-tertiary">+{user?.xp || 340} XP</p>
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
