import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { FloatingActionButton } from './FloatingActionButton';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProgression } from '../hooks/useProgression';

interface DashboardLayoutProps {
  readonly children: React.ReactNode;
  readonly hideSidebar?: boolean;
  readonly hideTopNav?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  hideSidebar = false, 
  hideTopNav = false 
}) => {
  // Keep streak/level/rank synced from real activity.
  useProgression();

  const location = useLocation();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('home');

  useEffect(() => {
    // Map pathname to nav key
    const path = location.pathname.substring(1); // remove leading slash
    setActiveNav(path || 'home');
  }, [location.pathname]);

  const handleNavigate = (key: string) => {
    if (key === 'home') {
      navigate('/');
    } else {
      navigate(`/${key}`);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-background">
      {!hideSidebar && <Sidebar activeKey={activeNav} onNavigate={handleNavigate} />}
      {!hideTopNav && <TopNav />}
      
      <main className={`${!hideSidebar ? 'lg:ml-64' : ''} ${!hideTopNav ? 'pt-28' : 'pt-0'} px-4 sm:px-8 lg:px-12 pb-16 min-h-screen`}>
        {children}
      </main>

      {!hideSidebar && <FloatingActionButton />}
    </div>
  );
};

export default DashboardLayout;
