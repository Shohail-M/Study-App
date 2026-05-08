import Dexie, { type Table } from 'dexie';

export interface User {
  id: string; // email serves as ID for simplicity
  name: string;
  email: string;
  passwordHash: string;
  xp: number;
  level: number;
  streak: number;
  studyTimeMs: number;
  joinedAt: Date;
  settings: {
    pomodoroWork: number;
    pomodoroBreak: number;
    pomodoroCycles: number;
    dailyTargetHours?: number;
    defaultSubjects?: string[];
    bgMusic?: string;
    theme?: string;
    geminiApiKey?: string;
  };
  // Temporary placeholders until Analytics phase aggregates from DB
  concentration?: number;
  rank?: string;
  focusHours?: number;
  booksRead?: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high';
  time: string;
  completed: boolean;
  createdAt: Date;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  subject: string;
  updatedAt: Date;
  color: string;
}

export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  subject: string;
  coverColor: string;
  pdfData?: ArrayBuffer; // Making this optional in case we just link or hold progress
  pdfUrl?: string;
  progress: number;
  lastReadAt: Date;
}

export interface StudySession {
  id: string;
  userId: string;
  subject: string;
  durationMs: number;
  focusLevel: number;
  date: Date;
}

export interface TimetableEntry {
  id: string;
  userId: string;
  day: string;
  timeSlot: string;
  subject: string;
  room: string;
  color: string;
}

export interface RecentSearch {
  id: string;
  userId: string;
  query: string;
  timestamp: Date;
}

export class StudyAppDatabase extends Dexie {
  users!: Table<User, string>; 
  tasks!: Table<Task, string>;
  notes!: Table<Note, string>;
  books!: Table<Book, string>;
  studySessions!: Table<StudySession, string>;
  timetable!: Table<TimetableEntry, string>;
  recentSearches!: Table<RecentSearch, string>;

  constructor() {
    super('StudySuccessDB');
    
    this.version(2).stores({
      users: '&id, email',
      tasks: '&id, userId, completed, createdAt',
      notes: '&id, userId, subject, updatedAt',
      books: '&id, userId, lastReadAt',
      studySessions: '&id, userId, date, subject',
      timetable: '&id, userId, day, timeSlot',
      recentSearches: '&id, userId, timestamp'
    });
  }
}

// Create a single instance of the database to be shared across the app
export const db = new StudyAppDatabase();
