import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useTaskManager } from '../hooks/useTaskManager';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../context/TimerContext';

export const FocusModePage: React.FC = () => {
  const { incompleteTasks } = useTaskManager();
  const navigate = useNavigate();
  const currentTask = incompleteTasks[0];

  const { isActive, timeLeft, toggleTimer, resetTimer, pauseTimer, seekTo, totalTime } = useTimer();

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Relaxation animation state: pulse speed based on isActive
  const breathRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!breathRef.current) return;
    if (isActive) {
      breathRef.current.style.animationPlayState = 'running';
    } else {
      breathRef.current.style.animationPlayState = 'paused';
    }
  }, [isActive]);

  const setFromPointerEvent = useCallback((e: React.PointerEvent) => {
    if (!dialRef.current || totalTime <= 0) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = e.clientX - cx;
    const y = e.clientY - cy;
    const angle = Math.atan2(y, x);
    const angleFromTop = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
    const fraction = angleFromTop / (2 * Math.PI);
    seekTo(totalTime * (1 - fraction));
  }, [seekTo, totalTime]);

  return (
    <DashboardLayout hideSidebar hideTopNav>
      <div className="fixed inset-0 bg-surface z-50 flex flex-col items-center justify-center p-8 overflow-hidden">

        {/* Animated background orbs — play when active */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Primary breathing orb */}
          <div
            ref={breathRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(79,140,255,0.15) 0%, transparent 70%)',
              animation: `breathe 4s ease-in-out infinite`,
              animationPlayState: isActive ? 'running' : 'paused',
            }}
          />
          {/* Secondary slow orb */}
          <div
            className="absolute top-1/3 left-1/4 rounded-full"
            style={{
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(130,100,255,0.10) 0%, transparent 70%)',
              animation: `breatheSlow 7s ease-in-out infinite reverse`,
              animationPlayState: isActive ? 'running' : 'paused',
            }}
          />
          {/* Tertiary orb */}
          <div
            className="absolute bottom-1/4 right-1/4 rounded-full"
            style={{
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(100,200,180,0.10) 0%, transparent 70%)',
              animation: `breatheSlow 6s ease-in-out infinite`,
              animationPlayState: isActive ? 'running' : 'paused',
            }}
          />
        </div>

        <style>{`
          @keyframes breathe {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
            50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
          }
          @keyframes breatheSlow {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 0.8; }
          }
        `}</style>

        <button
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 flex items-center gap-2 text-outline hover:text-white transition-colors z-10 font-bold tracking-widest uppercase text-xs"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Exit Focus
        </button>

        {/* Music indicator */}
        {isActive && (
          <div className="absolute top-8 right-8 flex items-center gap-2 bg-surface-container-high/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 z-10">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Focus Active</span>
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center animate-scale-in max-w-2xl w-full">
          {currentTask ? (
            <div className="mb-16 text-center space-y-4">
              <span className="px-4 py-1.5 rounded-full bg-surface-container-high border border-white/10 text-primary font-bold text-xs uppercase tracking-widest">
                Current Objective
              </span>
              <h1 className="text-4xl md:text-5xl font-black headline-text text-white">{currentTask.title}</h1>
              <p className="text-on-surface-variant text-lg">{currentTask.description}</p>
            </div>
          ) : (
            <div className="mb-16 text-center">
              <span className="px-4 py-1.5 rounded-full bg-surface-container-high border border-white/10 text-primary font-bold text-xs uppercase tracking-widest block mb-4">
                Deep Work Mode
              </span>
              <h1 className="text-4xl font-black headline-text text-white">Stay in the Flow</h1>
            </div>
          )}

          {/* Timer display */}
          <div className="relative mb-16">
            <div
              ref={dialRef}
              className="absolute inset-0 -m-10 rounded-full touch-none select-none"
              onPointerDown={(e) => {
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
              title="Drag around to adjust or end the timer"
            />
            <div
              className="text-[8rem] md:text-[12rem] font-black headline-text text-white leading-none tracking-tighter"
              style={{
                textShadow: isActive
                  ? '0 0 60px rgba(79,140,255,0.4), 0 0 120px rgba(79,140,255,0.2)'
                  : '0 0 40px rgba(255,255,255,0.1)',
                transition: 'text-shadow 1s ease',
              }}
            >
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
            <p className="mt-2 text-center text-[10px] text-outline/60 font-bold uppercase tracking-[0.25em]">
              Drag to adjust
            </p>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => resetTimer()}
              className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-bright border border-white/5 transition-all outline-none"
            >
              <span className="material-symbols-outlined">restart_alt</span>
            </button>

            <button
              onClick={toggleTimer}
              className={`px-12 py-5 rounded-full font-black text-xl headline-text tracking-wide transition-all ${
                isActive
                  ? 'bg-surface-container-highest text-white border-2 border-white/10'
                  : 'bg-gradient-to-r from-primary to-primary-container text-on-primary-container shadow-[0_0_40px_rgba(79,140,255,0.4)] hover:scale-105'
              }`}
            >
              {isActive ? 'PAUSE' : 'FOCUS'}
            </button>

            <button
              onClick={() => navigate('/timer')}
              title="Go to full timer"
              className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-bright border border-white/5 transition-all outline-none"
            >
              <span className="material-symbols-outlined">timer</span>
            </button>
          </div>

          {/* Breathing guide text */}
          {isActive && (
            <p className="mt-8 text-on-surface-variant text-sm animate-pulse opacity-60 tracking-wider">
              Breathe in · Focus · Let the time flow
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FocusModePage;
