import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../hooks/useBooks';
import { useAnalytics } from '../hooks/useAnalytics';

export const StatsCards: React.FC = () => {
  const { user } = useAuth();
  const { books } = useBooks();
  const { avgConcentration } = useAnalytics();
  
  const completedBooks = books?.filter((b: any) => b.progress === 100).length || 0;
  
  let mentalPerformance = "Good";
  if (avgConcentration > 90) mentalPerformance = "Elite";
  else if (avgConcentration > 75) mentalPerformance = "Great";
  else if (avgConcentration === 0) mentalPerformance = "Unrated";

  return (
    <section className="col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 animate-fade-in-up delay-300">
      {/* Streak Card */}
      <div className="bg-gradient-to-br from-secondary-container to-surface-container-high rounded-2xl p-6 sm:p-8 flex items-center gap-6 relative overflow-hidden group">
        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center shrink-0">
          <span
            className="material-symbols-outlined text-4xl sm:text-5xl text-orange-400 group-hover:scale-110 transition-transform"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            local_fire_department
          </span>
        </div>
        <div>
          <h4 className="text-2xl sm:text-3xl font-black headline-text text-white">{user?.streak ?? 0} Days</h4>
          <p className="text-secondary-fixed text-xs sm:text-sm font-bold uppercase tracking-widest">Master Streak</p>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined text-[6rem] sm:text-9xl rotate-12">trending_up</span>
        </div>
      </div>

      {/* Books Card */}
      <div className="bg-surface-container-high rounded-2xl p-6 sm:p-8 flex items-center gap-6 border border-white/5 group hover:border-tertiary/20 transition-colors">
        <div className="w-14 sm:w-16 h-14 sm:h-16 bg-tertiary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <span className="material-symbols-outlined text-2xl sm:text-3xl text-tertiary">menu_book</span>
        </div>
        <div>
          <h4 className="text-xl sm:text-2xl font-bold headline-text text-white">{completedBooks} Books</h4>
          <p className="text-on-surface-variant text-xs sm:text-sm">Completed in Library</p>
        </div>
      </div>

      {/* Focus Quality Card */}
      <div className="bg-surface-container-high rounded-2xl p-6 sm:p-8 flex items-center gap-6 border border-white/5 group hover:border-primary/20 transition-colors">
        <div className="w-14 sm:w-16 h-14 sm:h-16 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <span className="material-symbols-outlined text-2xl sm:text-3xl text-primary">psychology</span>
        </div>
        <div>
          <h4 className="text-xl sm:text-2xl font-bold headline-text text-white">{mentalPerformance}</h4>
          <p className="text-on-surface-variant text-xs sm:text-sm">Mental Performance</p>
        </div>
      </div>
    </section>
  );
};

export default StatsCards;
