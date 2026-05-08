import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { StartSessionModal } from './StartSessionModal';

export const WelcomeHeader: React.FC = () => {
  const { user } = useAuth();
  const { isActive, timeLeft, subject, resetTimer } = useTimer();
  const [showModal, setShowModal] = useState(false);

  const displayName = user?.name?.split(' ')[0] || 'Archer';
  const currentLevel = user?.level || 1;
  const currentXP = user?.xp || 0;
  const xpToNext = 500 - (currentXP % 500);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    resetTimer();
  };

  return (
    <>
      <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 animate-fade-in-up">
        <div>
          <h2 className="text-3xl sm:text-5xl font-extrabold headline-text tracking-tight text-white mb-2">
            Keep it up, {displayName}!
          </h2>
          <p className="text-base sm:text-lg text-on-surface-variant font-medium">
            You're only <span className="text-primary font-bold">{xpToNext} XP</span> away from Level {currentLevel + 1}.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {isActive && (
            <div className="bg-surface-container border border-white/10 rounded-lg px-6 py-4 sm:py-5 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{subject}</span>
              <span className="text-sm font-mono font-bold text-white">{formatTime(timeLeft)}</span>
            </div>
          )}

          {isActive ? (
            <button
              onClick={handleStop}
              className="flex-1 sm:flex-none px-6 sm:px-8 py-4 sm:py-5 rounded-lg font-black text-base sm:text-lg headline-text tracking-tight flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap bg-error text-white shadow-error/20"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stop</span>
              End Session
            </button>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 sm:flex-none px-6 sm:px-8 py-4 sm:py-5 rounded-lg font-black text-base sm:text-lg headline-text tracking-tight flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap bg-gradient-to-r from-primary to-primary-container text-on-primary-container shadow-[0_0_40px_rgba(79,140,255,0.3)]"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              Start Session
            </button>
          )}
        </div>
      </header>

      {showModal && <StartSessionModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default WelcomeHeader;
