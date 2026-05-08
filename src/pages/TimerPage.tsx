import React, { useCallback, useRef, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useTimer } from '../context/TimerContext';
import { TimerSettingsModal } from '../components/TimerSettingsModal';

export const TimerPage: React.FC = () => {
  const {
    isActive,
    timeLeft,
    totalTime,
    mode,
    toggleTimer,
    resetTimer,
    switchMode,
    pauseTimer,
    seekTo,
  } = useTimer();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dialRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  const setFromPointerEvent = useCallback((e: React.PointerEvent) => {
    if (!dialRef.current || totalTime <= 0) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = e.clientX - cx;
    const y = e.clientY - cy;

    // Angle with 0 at top, clockwise increasing.
    const angle = Math.atan2(y, x); // -PI..PI, 0 at right
    const angleFromTop = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
    const fraction = angleFromTop / (2 * Math.PI); // 0..1
    const nextTimeLeft = totalTime * (1 - fraction);
    seekTo(nextTimeLeft);
  }, [totalTime, seekTo]);

  return (
    <DashboardLayout>
      <div className="mb-12 text-center animate-fade-in-up">
        <h2 className="text-3xl font-extrabold headline-text text-white">Study Timer</h2>
        <p className="text-on-surface-variant mt-2">Focus deeply. Earn XP.</p>
      </div>

      <div className="max-w-md mx-auto bg-surface-container-high p-8 sm:p-12 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl animate-scale-in flex flex-col items-center">
        {/* Progress Ring Background Glow */}
        <div className={`absolute inset-0 opacity-20 blur-[100px] rounded-full ${mode === 'work' ? 'bg-primary' : 'bg-tertiary'} transition-colors duration-1000`} />

        {/* Mode Selector */}
        <div className="flex gap-4 p-1 bg-surface-container-highest rounded-full mb-10 z-10 w-full">
          <button
            onClick={() => switchMode('work')}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${mode === 'work' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-white'}`}
          >
            Concentrate
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${mode === 'break' ? 'bg-tertiary text-on-tertiary' : 'text-on-surface-variant hover:text-white'}`}
          >
            Short Break
          </button>
        </div>

        {/* Circular Timer Visual */}
        <div
          ref={dialRef}
          className="relative w-64 h-64 mb-10 flex items-center justify-center z-10 touch-none select-none"
          onPointerDown={(e) => {
            // Dragging the dial lets you "scrub" time and end early.
            setIsDragging(true);
            pauseTimer();
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            setFromPointerEvent(e);
          }}
          onPointerMove={(e) => {
            if (!isDragging) return;
            setFromPointerEvent(e);
          }}
          onPointerUp={(e) => {
            setIsDragging(false);
            try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
          }}
          onPointerCancel={() => setIsDragging(false)}
          title="Drag around the circle to adjust or end the timer"
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" className="stroke-surface-container-highest" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              className={`transition-all duration-1000 stroke-current ${mode === 'work' ? 'text-primary' : 'text-tertiary'}`}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progressPercent) / 100}
            />
          </svg>
          <div className="text-center">
            <h1 className="text-6xl font-black headline-text text-white tracking-tight">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-2">
              {mode === 'work' ? 'Remaining Focus Time' : 'Relax & Recharge'}
            </p>
            <p className="text-[10px] mt-3 text-outline/70 font-bold uppercase tracking-[0.2em]">
              Drag to adjust
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 z-10">
          <button
            onClick={resetTimer}
            className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>

          <button
            onClick={toggleTimer}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl hover:scale-105 active:scale-95 transition-all
              ${isActive ? 'bg-surface-container-lowest text-white border-2 border-white/10' : 'bg-gradient-to-br from-primary to-primary-container text-on-primary-container'}
            `}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isActive ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </div>

      {isSettingsOpen && <TimerSettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </DashboardLayout>
  );
};

export default TimerPage;
