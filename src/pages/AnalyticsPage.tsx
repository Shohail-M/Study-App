import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { WeeklyFocusChart } from '../components/WeeklyFocusChart';
import { useAnalytics } from '../hooks/useAnalytics';

export const AnalyticsPage: React.FC = () => {
  const { totalStudyTimeHrs, avgConcentration, completedTasksCount, subjectBreakdown } = useAnalytics();

  const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-outline'];
  const textColors = ['text-primary', 'text-secondary', 'text-tertiary', 'text-outline'];

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in-up">
        <h2 className="text-3xl font-extrabold headline-text text-white">Analytics</h2>
        <p className="text-on-surface-variant mt-2">Deep dive into your study performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="animate-fade-in-up delay-100">
          <WeeklyFocusChart />
        </div>
        
        <div className="bg-surface-container-low rounded-2xl p-8 border border-white/5 animate-fade-in-up delay-200">
          <h3 className="text-xl font-bold headline-text text-white mb-6">Subject Breakdown</h3>
          {!subjectBreakdown || subjectBreakdown.length === 0 ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">donut_large</span>
              <p className="text-sm text-on-surface-variant">No session data yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {subjectBreakdown.map((s, i) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-white">{s.name}</span>
                    <span className={textColors[i % 4]}>{s.percentage}%</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[i % 4]} rounded-full animate-grow-up`} 
                      style={{ width: `${s.percentage}%`, animationDelay: `${i * 100}ms` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up delay-300">
        <div className="bg-gradient-to-br from-surface-container-high to-surface-container p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-primary/10 group-hover:scale-110 transition-transform duration-700">trending_up</span>
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">Total Focus Time</p>
          <h4 className="text-4xl font-black headline-text text-white">{totalStudyTimeHrs}<span className="text-xl text-primary font-bold ml-1">hrs</span></h4>
        </div>
        <div className="bg-gradient-to-br from-surface-container-high to-surface-container p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-secondary/10 group-hover:scale-110 transition-transform duration-700">psychology_alt</span>
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">Avg Concentration</p>
          <h4 className="text-4xl font-black headline-text text-white">{avgConcentration}<span className="text-xl text-secondary font-bold ml-1">%</span></h4>
        </div>
        <div className="bg-gradient-to-br from-surface-container-high to-surface-container p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl text-tertiary/10 group-hover:scale-110 transition-transform duration-700">task_alt</span>
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">Tasks Completed</p>
          <h4 className="text-4xl font-black headline-text text-white">{completedTasksCount}</h4>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
