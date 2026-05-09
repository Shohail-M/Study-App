import React from 'react';
import {
  computeEffectiveScore, computeLevelFromScore, computeRank,
} from '../utils/progression';
import type { FriendProfile } from '../hooks/useFriends';

interface FriendsListProps {
  readonly profiles: FriendProfile[];
  readonly onRemove?: (id: string) => void;
}

/**
 * Renders friends with their derived rank/level by passing each friend's
 * XP and activity numbers through the central progression logic.
 */
export const FriendsList: React.FC<FriendsListProps> = ({ profiles, onRemove }) => {
  if (profiles.length === 0) {
    return (
      <div className="py-12 text-center text-outline/50">
        <span className="material-symbols-outlined text-3xl">group_off</span>
        <p className="text-xs mt-2 font-black uppercase tracking-widest">No friends yet</p>
        <p className="text-sm text-on-surface-variant mt-1">Invite someone using their email or user ID.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {profiles.map(p => {
        const score = computeEffectiveScore({
          xp: p.xp || 0,
          streakDays: p.streak || 0,
          completedTasks: p.completedTasks || 0,
          completedBooks: p.completedBooks || 0,
        });
        const rank = computeRank(score);
        const level = computeLevelFromScore(score);
        const initials = (p.name || 'U').charAt(0).toUpperCase();

        return (
          <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-primary">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-white truncate">{p.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline truncate">
                  {p.email || p.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="text-xs font-black text-white">{rank.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Lv {level} · {score.toLocaleString()} pts
                </p>
              </div>
              {onRemove && (
                <button
                  onClick={() => onRemove(p.id)}
                  title="Remove friend"
                  className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">person_remove</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FriendsList;
