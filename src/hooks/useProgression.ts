import { useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudySessions } from './useStudySessions';
import { useTaskManager } from './useTaskManager';
import { useBooks } from './useBooks';
import { useTimer } from '../context/TimerContext';
import { computeEffectiveScore, computeLevelFromScore, computeRank, computeStreakDays } from '../utils/progression';

export function useProgression() {
  const { user, updateUser } = useAuth();
  const { sessions } = useStudySessions();
  const { tasks } = useTaskManager();
  const { books } = useBooks();
  const timer = useTimer();

  const completedTasks = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);
  const completedBooks = useMemo(() => books.filter(b => b.progress === 100).length, [books]);

  const activeWorkMs =
    timer.isActive && timer.mode === 'work' && timer.totalTime > 0
      ? Math.max(0, (timer.totalTime - timer.timeLeft) * 1000)
      : 0;

  const streak = useMemo(() => {
    const dates = sessions.map(s => new Date(s.date));
    return computeStreakDays({ sessionDates: dates, includeTodayIfActiveMs: activeWorkMs });
  }, [sessions, activeWorkMs]);

  const score = useMemo(() => computeEffectiveScore({
    xp: user?.xp || 0,
    streakDays: streak,
    completedTasks,
    completedBooks,
  }), [user?.xp, streak, completedTasks, completedBooks]);

  const level = useMemo(() => computeLevelFromScore(score), [score]);
  const rankInfo = useMemo(() => computeRank(score), [score]);

  useEffect(() => {
    if (!user) return;
    const u = user as any;
    const needsUpdate =
      user.streak !== streak ||
      user.level !== level ||
      (user.rank || '') !== rankInfo.name ||
      u.completedTasks !== completedTasks ||
      u.completedBooks !== completedBooks ||
      u.score !== score;
    if (!needsUpdate) return;

    // Fire-and-forget; this keeps UI + persistence in sync without user actions.
    // The extra fields (completedTasks/Books/score) let peers compute friends' ranks
    // through progression.ts without needing access to private session data.
    updateUser({
      streak, level, rank: rankInfo.name,
      completedTasks, completedBooks, score,
    } as any).catch(() => {});
  }, [
    user?.id, user?.streak, user?.level, user?.rank,
    streak, level, rankInfo.name, completedTasks, completedBooks, score, updateUser,
  ]);

  return { streak, level, rankInfo, score, completedTasks, completedBooks };
}

