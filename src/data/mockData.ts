export interface NavItem {
  readonly icon: string;
  readonly label: string;
  readonly key: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'normal' | 'low';
  time: string;
  completed: boolean;
}

export interface DayProgress {
  readonly day: string;
  readonly label: string;
  readonly percentage: number;
  readonly isToday: boolean;
}

export interface ChartBar {
  readonly height: number;
}

export const navItems: readonly NavItem[] = [
  { icon: 'home', label: 'Home', key: 'home' },
  { icon: 'checklist', label: 'Tasks', key: 'tasks' },
  { icon: 'timer', label: 'Timer', key: 'timer' },
  { icon: 'calendar_today', label: 'Timetable', key: 'timetable' },
  { icon: 'menu_book', label: 'Books', key: 'books' },
  { icon: 'description', label: 'Notes', key: 'notes' },
  { icon: 'analytics', label: 'Analytics', key: 'analytics' },
  { icon: 'psychology', label: 'AI', key: 'ai' },
  { icon: 'center_focus_strong', label: 'Focus Mode', key: 'focus' },
  { icon: 'settings', label: 'Settings', key: 'settings' },
];

export const defaultTasks: Task[] = [
  {
    id: '1',
    title: 'Organic Chemistry Review',
    description: 'Chapter 4-6 Exercises',
    priority: 'high',
    time: '2:00 PM',
    completed: false,
  },
  {
    id: '2',
    title: 'Ancient History Essay',
    description: 'Drafting the Introduction',
    priority: 'normal',
    time: '4:30 PM',
    completed: false,
  },
  {
    id: '3',
    title: 'Advanced Calculus Lab',
    description: 'Integration Techniques',
    priority: 'low',
    time: 'Tomorrow',
    completed: false,
  },
];

export const weeklyProgress: readonly DayProgress[] = [
  { day: 'mon', label: 'MON', percentage: 75, isToday: false },
  { day: 'tue', label: 'TUE', percentage: 45, isToday: false },
  { day: 'wed', label: 'TODAY', percentage: 90, isToday: true },
  { day: 'thu', label: 'THU', percentage: 0, isToday: false },
  { day: 'fri', label: 'FRI', percentage: 0, isToday: false },
];

export const focusChartBars: readonly ChartBar[] = [
  { height: 30 }, { height: 45 }, { height: 20 }, { height: 80 },
  { height: 55 }, { height: 95 }, { height: 40 }, { height: 85 },
  { height: 25 }, { height: 90 }, { height: 15 }, { height: 70 },
  { height: 50 }, { height: 100 },
];

export const profileImageUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEgdjAuvN_zIf6zDzdGrENm5d5oi8XWtNsT6d66dkbdnf-ARuhvUvSX0_a4_a4zEFcDD78RSDLa5cwca_UWxB_BWR3xc7mO0981qFHd8aI8Wre2ahJ01lBzi69dp8H4-CxnvCzYv8-9pyB1t8hSqQ8n6sxv7kU51coWo3kjNh7gEfvnRjujtE4bhZnRjVWmGvGQk3FTrlHZ8OwpD_hdG_eTd1FVNEKZqQIQbd8e7yoA_C38OO9Ucf-P6ShOo4nxkPsWjpyo_sAPdY';
