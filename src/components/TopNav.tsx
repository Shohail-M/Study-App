import React from 'react';
import { useAuth } from '../context/AuthContext';
import { profileImageUrl } from '../data/mockData';
import { GlobalSearch } from './GlobalSearch';

interface TopNavProps {
  // Props can be added here if needed in the future
}

export const TopNav: React.FC<TopNavProps> = () => {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-20 z-40 bg-[#060e20]/80 backdrop-blur-xl flex justify-between items-center px-4 sm:px-8 w-auto animate-fade-in">
      <div className="flex items-center gap-6 flex-1 ml-12 lg:ml-0">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-surface-container-high rounded-full border border-white/5">
          <span className="material-symbols-outlined text-orange-400" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          <span className="text-sm font-bold headline-text text-on-surface">{user?.streak ?? 0} Day Streak</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-surface-container-high rounded-full border border-white/5">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-sm font-bold headline-text text-on-surface">{(user?.xp ?? 0).toLocaleString()} XP</span>
        </div>

        <button className="material-symbols-outlined text-slate-300 hover:text-primary transition-colors">dark_mode</button>

        <div className="relative group">
          <div className="w-10 h-10 rounded-full bg-primary-fixed border-2 border-primary overflow-hidden cursor-pointer">
            <img
              alt="User Profile Avatar"
              className="w-full h-full object-cover"
              src={profileImageUrl}
            />
          </div>
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-high rounded-lg border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-sm font-bold text-white headline-text">{user?.name || 'Archer'}</p>
              <p className="text-xs text-on-surface-variant">{user?.email || 'archer@study.com'}</p>
            </div>
            <button
              onClick={logout}
              className="w-full px-4 py-3 text-left text-sm text-error hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
