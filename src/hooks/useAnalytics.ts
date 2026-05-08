import { useAuth } from '../context/AuthContext';
import { useStudySessions } from './useStudySessions';
import { useTaskManager } from './useTaskManager';
import { useBooks } from './useBooks';
import { useTimer } from '../context/TimerContext';

export function useAnalytics() {
  const { user } = useAuth();
  const { sessions: studySessions } = useStudySessions();
  const { tasks } = useTaskManager();
  const { books } = useBooks();
  const timer = useTimer();

  // Aggregated Stats
  const totalStudyTimeMs = studySessions?.reduce((acc, s) => acc + s.durationMs, 0) || 0;
  const totalStudyTimeHrs = Math.floor(totalStudyTimeMs / (1000 * 60 * 60));
  
  const avgConcentration = studySessions?.length > 0 
    ? Math.round(studySessions.reduce((acc, s) => acc + s.focusLevel, 0) / studySessions.length) 
    : 0;

  const completedTasksCount = tasks?.filter(t => t.completed).length || 0;
  const completedBooksCount = books?.filter(b => b.progress === 100).length || 0;

  // Subject Breakdown
  const subjectMinutes: Record<string, number> = {};
  studySessions?.forEach(s => {
    subjectMinutes[s.subject] = (subjectMinutes[s.subject] || 0) + (s.durationMs / (1000 * 60));
  });

  const totalMinutes = Object.values(subjectMinutes).reduce((acc, m) => acc + m, 0);
  const subjectBreakdown = Object.entries(subjectMinutes)
    .map(([name, minutes]) => ({
      name,
      percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Weekly Focus Chart Data (last 7 days for the orb chart)
  const today = new Date();
  today.setHours(0,0,0,0);

  const dailyTargetHours = user?.settings?.dailyTargetHours ?? 6;

  // Include active work timer time in today's total so progress becomes dynamic "while studying".
  const activeWorkMs =
    timer?.isActive && timer?.mode === 'work' && timer?.totalTime > 0
      ? Math.max(0, (timer.totalTime - timer.timeLeft) * 1000)
      : 0;
  
  const weeklyProgress = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    
    const daySessions = studySessions?.filter(s => {
      const sessionDate = new Date(s.date);
      sessionDate.setHours(0,0,0,0);
      return sessionDate.getTime() === d.getTime();
    }) || [];
    
    const baseDayMs = daySessions.reduce((acc, s) => acc + s.durationMs, 0);
    const dayMs = i === 6 ? baseDayMs + activeWorkMs : baseDayMs;
    const dayHrs = dayMs / (1000 * 60 * 60);
    
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: i === 6,
      percentage: Math.min(100, Math.round((dayHrs / dailyTargetHours) * 100)),
      label: dayHrs > 0 ? `${dayHrs.toFixed(1)}h` : ''
    };
  });

  // Weekly Focus Insight: last 7 days avg focus level (0-100)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const daySessions = studySessions?.filter(s => {
      const sessionDate = new Date(s.date);
      sessionDate.setHours(0,0,0,0);
      return sessionDate.getTime() === d.getTime();
    }) || [];
    const avg = daySessions.length
      ? Math.round(daySessions.reduce((acc, s) => acc + (s.focusLevel || 0), 0) / daySessions.length)
      : 0;
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      height: avg,
    };
  });

  return {
    totalStudyTimeHrs,
    avgConcentration,
    completedTasksCount,
    subjectBreakdown,
    weeklyProgress,
    chartData,
    dailyTargetHours,
    completedBooksCount,
  };
}
