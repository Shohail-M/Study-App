import React, { useEffect, useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';

export const WeeklyFocusChart: React.FC = () => {
  const { chartData } = useAnalytics();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary'];

  return (
    <section className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-2xl p-6 sm:p-8 border border-white/5 animate-fade-in-up shadow-xl h-full ">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-lg sm:text-xl font-bold headline-text text-white">Weekly Focus Insight</h3>
          <p className="text-sm text-on-surface-variant">Your recent session intensity</p>
        </div>
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <span className="w-3 h-3 rounded-full bg-secondary" />
          <span className="w-3 h-3 rounded-full bg-tertiary" />
        </div>
      </div>

      {!chartData || chartData.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-outline/30 flex-col gap-2">
           <span className="material-symbols-outlined text-4xl">bar_chart</span>
           <p className="text-xs font-bold uppercase tracking-widest">Start studying to see stats</p>
        </div>
      ) : (
        <div className="flex items-end gap-2 px-2 h-32 sm:h-40">
          {chartData.map((bar, index) => (
            <div
              key={index}
              title={bar.label}
              className={`${colors[index % 3]} rounded-t-lg transition-all duration-1000 ease-out relative group`}
              style={{
                flex: 1,
                height: animate ? `${bar.height}%` : '0%',
                opacity: 0.6 + (bar.height / 250),
                transitionDelay: `${index * 50}ms`,
              }}
            >
               <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-[10px] font-bold text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-white/5">
                {bar.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-outline">
        <span>Timeline Pattern</span>
        <span>Recent Activity</span>
      </div>
    </section>
  );
};

export default WeeklyFocusChart;
