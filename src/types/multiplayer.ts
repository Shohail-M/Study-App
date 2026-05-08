export type RoomVisibility = 'public' | 'private';
export type TimerPhase = 'work' | 'break';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface FocusRoom {
  id: string;
  ownerId: string;
  name: string;
  visibility: RoomVisibility;
  subjectTag?: string;
  createdAt: Date;
  settings: {
    workMin: number;
    breakMin: number;
    cycles: number;
    allowJoinMidSession?: boolean;
  };
  timerState: {
    phase: TimerPhase;
    status: TimerStatus;
    startedAt?: Date;
    durationSec?: number;
    pausedAt?: Date;
    accumulatedPausedSec?: number;
  };
}

export interface RoomMember {
  id: string; // uid
  displayName: string;
  photoURL?: string;
  role: 'owner' | 'mod' | 'member';
  joinedAt: Date;
  presence: {
    state: 'active' | 'away';
    lastPingAt: Date;
  };
}

export interface Guild {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  weeklyGoalMinutes: number;
  privacy: 'open' | 'invite' | 'closed';
}

export interface GuildMember {
  id: string; // uid
  displayName: string;
  photoURL?: string;
  role: 'owner' | 'mod' | 'member';
  joinedAt: Date;
}

export type ChatMessageType = 'text' | 'image' | 'mixed';

export interface ChatAttachment {
  kind: 'image';
  storagePath: string;
  url: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  contentType?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  type: ChatMessageType;
  text?: string;
  attachments?: ChatAttachment[];
  createdAt: Date;
  deleted?: boolean;
}

export interface WeeklyUserEntry {
  id: string; // uid
  displayName?: string;
  photoURL?: string;
  focusMinutes: number;
  xpGained: number;
  tasksCompleted: number;
  booksCompleted: number;
  score: number;
  updatedAt: Date;
}

