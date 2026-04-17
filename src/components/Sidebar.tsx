import React, { useState } from 'react';
import { navItems } from '../data/mockData';

interface SidebarProps {
  readonly activeKey: string;
  readonly onNavigate: (key: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeKey, onNavigate }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-5 left-4 z-[60] w-10 h-10 bg-surface-container-high rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-bright transition-colors"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[65] sidebar-overlay animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          h-screen w-64 fixed left-0 top-0 border-r border-white/5 bg-[#091328] flex flex-col py-8 z-[70]
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="px-6 mb-10 animate-fade-in">
          <h1 className="text-2xl font-black text-white tracking-tighter headline-text">Study Success</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mt-1">Level 24 Archer</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item, index) => (
            <button
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.key);
                setIsMobileOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 font-['Plus_Jakarta_Sans'] tracking-tight text-sm font-bold uppercase
                transition-all duration-200 animate-slide-in-left
                ${activeKey === item.key
                  ? 'text-white bg-gradient-to-r from-[#4F8CFF]/20 to-transparent border-r-4 border-[#4F8CFF]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-4 mt-auto animate-fade-in-up delay-500">
          <button className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary-container rounded-lg font-bold text-sm uppercase tracking-tighter hover:opacity-90 transition-all active:scale-95">
            Upgrade to Pro
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
