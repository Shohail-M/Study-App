import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { useAuth } from '../context/AuthContext';

export function useAnalytics() {
  const { user } = useAuth();

  const studySessions = useLiveQuery(
    () => user ? db.studySessions.where('userId').equals(user.id).toArray() : [],
    [user?.id],
    []
  );

  const tasks = useLiveQuery(
    () => user ? db.tasks.where('userId').equals(user.id).toArray() : [],
    [user?.id],
    []
  );

  // Aggregated Stats
  const totalStudyTimeMs = studySessions?.reduce((acc, s) => acc + s.durationMs, 0) || 0;
  const totalStudyTimeHrs = Math.floor(totalStudyTimeMs / (1000 * 60 * 60));
  
  const avgConcentration = studySessions?.length > 0 
    ? Math.round(studySessions.reduce((acc, s) => acc + s.focusLevel, 0) / studySessions.length) 
    : 0;

  const completedTasksCount = tasks?.filter(t => t.completed).length || 0;

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
  
  const weeklyProgress = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    
    const daySessions = studySessions?.filter(s => {
      const sessionDate = new Date(s.date);
      sessionDate.setHours(0,0,0,0);
      return sessionDate.getTime() === d.getTime();
    }) || [];
    
    const dayMs = daySessions.reduce((acc, s) => acc + s.durationMs, 0);
    const dayHrs = dayMs / (1000 * 60 * 60);
    const GOAL_HRS = 6;
    
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: i === 6,
      percentage: Math.min(100, Math.round((dayHrs / GOAL_HRS) * 100)),
      label: dayHrs > 0 ? `${dayHrs.toFixed(1)}h` : ''
    };
  });

  return {
    totalStudyTimeHrs,
    avgConcentration,
    completedTasksCount,
    subjectBreakdown,
    weeklyProgress
  };
}
