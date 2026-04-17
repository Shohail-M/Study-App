import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { WelcomeHeader } from '../components/WelcomeHeader';
import { DailyProgress } from '../components/DailyProgress';
import { UpcomingTasks } from '../components/UpcomingTasks';
import { StatsCards } from '../components/StatsCards';
import { MilestoneAlert } from '../components/MilestoneAlert';
import { WeeklyFocusChart } from '../components/WeeklyFocusChart';
export const DashboardPage: React.FC = () => {
  return (
    <DashboardLayout>
      <WelcomeHeader />

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
        <DailyProgress />
        <UpcomingTasks />
        <StatsCards />
        <MilestoneAlert />
        <WeeklyFocusChart />
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
