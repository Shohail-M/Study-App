import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';

interface StartSessionModalProps {
  readonly onClose: () => void;
}

export const StartSessionModal: React.FC<StartSessionModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { startTimer } = useTimer();
  const navigate = useNavigate();

  const subjects = user?.settings?.defaultSubjects || ['Math', 'Science', 'History', 'English', 'General Study'];
  const savedMusic = user?.settings?.bgMusic || 'none';

  const [subject, setSubject] = useState(subjects[0] || 'General Study');
  const [mode, setMode] = useState<'pomodoro' | 'custom'>('pomodoro');
  const [customMinutes, setCustomMinutes] = useState(60);
  const [destination, setDestination] = useState<'timer' | 'focus'>('timer');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const durationMins = mode === 'pomodoro' ? 25 : customMinutes;
    startTimer(subject, durationMins * 60, savedMusic);
    onClose();
    navigate(destination === 'focus' ? '/focus' : '/timer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface-container-high rounded-3xl p-8 border border-white/10 shadow-2xl animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold headline-text text-white">Start Session</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          {/* Subject Selector */}
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
              What are you studying?
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none"
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Custom Subject Input */}
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">
              Or type a custom subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Advanced Calculus, World History..."
              className="w-full bg-surface-container border border-white/10 rounded-lg py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          {/* Timer Mode */}
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">
              Timer Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('pomodoro')}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center gap-1 transition-all
                  ${mode === 'pomodoro'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-white/5 bg-surface-container text-on-surface hover:bg-surface-bright'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">timer</span>
                <span className="text-sm font-bold">Pomodoro</span>
                <span className="text-xs opacity-70">25m focus, 5m break</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center gap-1 transition-all
                  ${mode === 'custom'
                    ? 'border-tertiary bg-tertiary/10 text-tertiary'
                    : 'border-white/5 bg-surface-container text-on-surface hover:bg-surface-bright'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">schedule</span>
                <span className="text-sm font-bold">Custom</span>
                <span className="text-xs opacity-70">Set your own time</span>
              </button>
            </div>
          </div>

          {mode === 'custom' && (
            <div className="animate-fade-in-up">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex justify-between">
                <span>Duration</span>
                <span className="text-tertiary font-bold">{customMinutes} min</span>
              </label>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Number(e.target.value))}
                className="w-full accent-tertiary h-2 bg-surface-container rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-on-surface-variant mt-2 font-medium">
                <span>5m</span>
                <span>60m</span>
                <span>120m</span>
              </div>
            </div>
          )}

          {/* Destination */}
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">
              Open in
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDestination('timer')}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center gap-1 transition-all
                  ${destination === 'timer'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-white/5 bg-surface-container text-on-surface hover:bg-surface-bright'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">timer</span>
                <span className="text-sm font-bold">Study Timer</span>
              </button>
              <button
                type="button"
                onClick={() => setDestination('focus')}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center gap-1 transition-all
                  ${destination === 'focus'
                    ? 'border-secondary bg-secondary/10 text-secondary'
                    : 'border-white/5 bg-surface-container text-on-surface hover:bg-surface-bright'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">center_focus_strong</span>
                <span className="text-sm font-bold">Focus Mode</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 mt-2 bg-gradient-to-r from-primary to-primary-container text-on-primary-container rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_circle
            </span>
            Start Focus Timer
          </button>
        </form>
      </div>
    </div>
  );
};
