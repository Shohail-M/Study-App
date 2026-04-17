import React from 'react';
import { useAuth } from '../context/AuthContext';

export const MilestoneAlert: React.FC = () => {
  const { user } = useAuth();

  return (
    <section className="col-span-12 sm:col-span-4 bg-gradient-to-tr from-surface-container-high to-surface-bright rounded-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col justify-center border border-white/5 animate-fade-in-up delay-400">
      <div className="relative z-10">
        <h3 className="text-xl sm:text-2xl font-bold headline-text text-white mb-4">Milestone Alert!</h3>
        <p className="text-on-surface-variant leading-relaxed mb-6 text-sm sm:text-base">
          You've focused for <span className="text-white font-bold">{user?.focusHours || 120} hours</span> this semester. That's top 5% in your region.
        </p>
        <button className="flex items-center gap-2 text-primary font-bold headline-text group">
          Claim Reward
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
      <div className="absolute -bottom-10 -right-10 opacity-10">
        <span className="material-symbols-outlined text-[10rem]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
      </div>
    </section>
  );
};

export default MilestoneAlert;
