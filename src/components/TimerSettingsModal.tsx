import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';

interface TimerSettingsModalProps {
  readonly onClose: () => void;
}

const MUSIC_OPTIONS = [
  { value: 'none', label: 'None (Silent block)' },
  { value: 'lofi', label: 'Lo-Fi Beats' },
  { value: 'rain', label: 'Rain Sounds' },
  { value: 'whitenoise', label: 'White Noise' },
];

export const TimerSettingsModal: React.FC<TimerSettingsModalProps> = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const { setBgMusic } = useTimer();

  const [work, setWork] = useState(user?.settings?.pomodoroWork || 25);
  const [breakTime, setBreakTime] = useState(user?.settings?.pomodoroBreak || 5);
  const [cycles, setCycles] = useState(user?.settings?.pomodoroCycles || 4);
  const [music, setMusic] = useState(user?.settings?.bgMusic || 'none');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Save ALL settings including bgMusic
    await updateUser({
      settings: {
        ...user?.settings,
        pomodoroWork: work,
        pomodoroBreak: breakTime,
        pomodoroCycles: cycles,
        bgMusic: music,
      }
    });
    // Also update the live timer context so music changes immediately
    setBgMusic(music);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-surface-container-high rounded-3xl p-8 border border-white/10 shadow-2xl animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold headline-text text-white">Timer Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex justify-between">
              <span>Focus Session</span>
              <span className="text-primary font-bold">{work} min</span>
            </label>
            <input
              type="range"
              min="5" max="60" step="5"
              value={work}
              onChange={(e) => setWork(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-surface-container rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex justify-between">
              <span>Short Break</span>
              <span className="text-tertiary font-bold">{breakTime} min</span>
            </label>
            <input
              type="range"
              min="1" max="15" step="1"
              value={breakTime}
              onChange={(e) => setBreakTime(Number(e.target.value))}
              className="w-full accent-tertiary h-2 bg-surface-container rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex justify-between">
              <span>Cycles before Long Break</span>
              <span className="text-secondary font-bold">{cycles}</span>
            </label>
            <input
              type="range"
              min="1" max="8" step="1"
              value={cycles}
              onChange={(e) => setCycles(Number(e.target.value))}
              className="w-full accent-secondary h-2 bg-surface-container rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">
              Background Music
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MUSIC_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMusic(opt.value)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2
                    ${music === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-white/5 bg-surface-container text-on-surface hover:bg-surface-bright'
                    }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {opt.value === 'none' ? 'volume_off' : opt.value === 'lofi' ? 'headphones' : opt.value === 'rain' ? 'water_drop' : 'waves'}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 mt-4 bg-gradient-to-r from-primary to-primary-container text-on-primary-container rounded-xl font-bold text-sm uppercase tracking-wider hover:scale-[1.02] transition-all"
          >
            Save Preferences
          </button>
        </form>
      </div>
    </div>
  );
};
