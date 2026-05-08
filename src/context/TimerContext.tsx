import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useStudySessions } from '../hooks/useStudySessions';

interface TimerContextType {
  isActive: boolean;
  timeLeft: number;
  totalTime: number;
  mode: 'work' | 'break';
  subject: string;
  bgMusic: string;
  startTimer: (subject: string, durationSecs: number, music?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  toggleTimer: () => void;
  switchMode: (m: 'work' | 'break') => void;
  setBgMusic: (music: string) => void;
  seekTo: (nextTimeLeftSecs: number) => void;
  endNow: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const MUSIC_URLS: Record<string, string> = {
  lofi: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  rain: 'https://cdn.pixabay.com/audio/2021/10/25/audio_83e9a8b15b.mp3',
  whitenoise: 'https://cdn.pixabay.com/audio/2022/03/15/audio_24a27e7740.mp3',
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addSession } = useStudySessions();

  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [subject, setSubject] = useState('General Study');
  const [bgMusic, setBgMusicState] = useState(() => {
    return user?.settings?.bgMusic || 'none';
  });

  // Work duration in seconds
  const [workDuration, setWorkDuration] = useState(() => (user?.settings?.pomodoroWork || 25) * 60);
  const [breakDuration] = useState(() => (user?.settings?.pomodoroBreak || 5) * 60);
  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [totalTime, setTotalTime] = useState(workDuration);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const subjectRef = useRef(subject);
  const workDurationRef = useRef(workDuration);

  // Keep refs in sync
  useEffect(() => { subjectRef.current = subject; }, [subject]);
  useEffect(() => { workDurationRef.current = workDuration; }, [workDuration]);

  // Sync bgMusic from user settings on mount
  useEffect(() => {
    if (user?.settings?.bgMusic) {
      setBgMusicState(user.settings.bgMusic);
    }
  }, [user?.settings?.bgMusic]);

  // Audio management
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }
    const audio = audioRef.current;

    if (isActive && bgMusic && bgMusic !== 'none') {
      const src = MUSIC_URLS[bgMusic];
      if (src && audio.src !== src) {
        audio.src = src;
        audio.load();
      }
      if (src) {
        audio.play().catch(e => console.warn('Audio autoplay blocked:', e));
      }
    } else {
      audio.pause();
    }

    return () => {};
  }, [isActive, bgMusic]);

  // Pause audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const completePhase = useCallback(() => {
    setIsActive(false);
    audioRef.current?.pause();

    if (mode === 'work') {
      const durationMinutes = Math.round(workDurationRef.current / 60);
      addSession(subjectRef.current, durationMinutes, 100);
      setMode('break');
      setTimeLeft(breakDuration);
      setTotalTime(breakDuration);
    } else {
      setMode('work');
      setTimeLeft(workDurationRef.current);
      setTotalTime(workDurationRef.current);
    }
  }, [mode, breakDuration, addSession]);

  // Timer countdown
  useEffect(() => {
    if (!isActive) return;

    const interval = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          completePhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, completePhase]);

  const startTimer = useCallback((subj: string, durationSecs: number, music?: string) => {
    setSubject(subj);
    setWorkDuration(durationSecs);
    setTimeLeft(durationSecs);
    setTotalTime(durationSecs);
    setMode('work');
    if (music && music !== 'none') {
      setBgMusicState(music);
    }
    setIsActive(true);
  }, []);

  const pauseTimer = useCallback(() => setIsActive(false), []);
  const resumeTimer = useCallback(() => setIsActive(true), []);

  const toggleTimer = useCallback(() => {
    setIsActive(prev => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    audioRef.current?.pause();
    const dur = mode === 'work' ? workDurationRef.current : breakDuration;
    setTimeLeft(dur);
    setTotalTime(dur);
  }, [mode, breakDuration]);

  const switchMode = useCallback((m: 'work' | 'break') => {
    setIsActive(false);
    audioRef.current?.pause();
    setMode(m);
    if (m === 'work') {
      setTimeLeft(workDurationRef.current);
      setTotalTime(workDurationRef.current);
    } else {
      setTimeLeft(breakDuration);
      setTotalTime(breakDuration);
    }
  }, [breakDuration]);

  const setBgMusic = useCallback((music: string) => {
    setBgMusicState(music);
  }, []);

  const seekTo = useCallback((nextTimeLeftSecs: number) => {
    const clamped = Math.max(0, Math.min(totalTime, Math.round(nextTimeLeftSecs)));
    setTimeLeft(clamped);
    if (clamped === 0) {
      completePhase();
    }
  }, [totalTime, completePhase]);

  const endNow = useCallback(() => {
    seekTo(0);
  }, [seekTo]);

  return (
    <TimerContext.Provider value={{
      isActive,
      timeLeft,
      totalTime,
      mode,
      subject,
      bgMusic,
      startTimer,
      pauseTimer,
      resumeTimer,
      resetTimer,
      toggleTimer,
      switchMode,
      setBgMusic,
      seekTo,
      endNow,
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export function useTimer(): TimerContextType {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within a TimerProvider');
  return ctx;
}
