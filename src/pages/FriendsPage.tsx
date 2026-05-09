import React, { useMemo, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useFirebase } from '../utils/firebaseMode';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { FriendsList } from '../components/FriendsList';

export const FriendsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    accepted, incoming, outgoing, profiles,
    inviteByUserId, inviteByEmail, acceptRequest, removeFriend,
  } = useFriends();

  const [inviteValue, setInviteValue] = useState('');
  const [inviteMode, setInviteMode] = useState<'email' | 'id'>('email');
  const [inviteStatus, setInviteStatus] = useState<{ ok?: boolean; msg?: string } | null>(null);
  const [inviting, setInviting] = useState(false);

  const otherIdFor = (users: string[]) => users.find(id => id !== user?.id) || '';

  const acceptedProfiles = useMemo(
    () => accepted.map(f => profiles[otherIdFor(f.users)]).filter(Boolean),
    [accepted, profiles, user?.id]
  );

  const handleInvite = async () => {
    if (!inviteValue.trim()) return;
    setInviting(true);
    setInviteStatus(null);
    try {
      if (inviteMode === 'email') await inviteByEmail(inviteValue);
      else await inviteByUserId(inviteValue);
      setInviteValue('');
      setInviteStatus({ ok: true, msg: 'Invite sent.' });
    } catch (e: any) {
      setInviteStatus({ ok: false, msg: e?.message || 'Failed to send invite.' });
    } finally {
      setInviting(false);
    }
  };

  if (!useFirebase) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl">group</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white headline-text">Friends</h2>
            <p className="text-on-surface-variant mt-2">Friends require Firebase configuration in <code className="text-primary">.env</code>.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in-up">
        <h2 className="text-3xl font-extrabold headline-text text-white">Friends</h2>
        <p className="text-on-surface-variant mt-2">Invite peers, accept requests, and watch each other climb the ranks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invite */}
        <div className="lg:col-span-1 bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">person_add</span>
            </div>
            <h3 className="text-base font-black text-white headline-text">Invite a Friend</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(['email', 'id'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setInviteMode(m)}
                  className={`py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                    inviteMode === m
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container border border-white/10 text-on-surface-variant hover:text-white'
                  }`}
                >
                  {m === 'email' ? 'Email' : 'User ID'}
                </button>
              ))}
            </div>
            <input
              value={inviteValue}
              onChange={e => setInviteValue(e.target.value)}
              placeholder={inviteMode === 'email' ? 'friend@example.com' : 'Paste user ID…'}
              className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              disabled={inviting || !inviteValue.trim()}
              onClick={handleInvite}
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-on-primary rounded-xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">send</span>
              {inviting ? 'Sending…' : 'Send Invite'}
            </button>
            {inviteStatus && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-bold ${inviteStatus.ok ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error'}`}>
                <span className="material-symbols-outlined text-sm">{inviteStatus.ok ? 'check_circle' : 'error'}</span>
                {inviteStatus.msg}
              </div>
            )}
          </div>
        </div>

        {/* Lists */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">group</span>
                <p className="text-sm font-black text-white headline-text">Friends List</p>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-outline px-2 py-1 bg-surface-container rounded-full">
                {acceptedProfiles.length}
              </span>
            </div>
            <div className="p-4">
              <FriendsList
                profiles={acceptedProfiles}
                onRemove={(otherId) => {
                  const fs = accepted.find(f => f.users.includes(otherId));
                  if (fs) removeFriend(fs.id);
                }}
              />
            </div>
          </div>

          {(incoming.length > 0 || outgoing.length > 0) && (
            <div className="bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">mark_email_unread</span>
                <p className="text-sm font-black text-white headline-text">Pending</p>
              </div>
              <div className="p-4 space-y-2">
                {incoming.map(f => {
                  const otherId = otherIdFor(f.users);
                  const p = profiles[otherId];
                  return (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-white/5">
                      <div>
                        <p className="text-sm font-black text-white">{p?.name || otherId}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Wants to be your friend</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptRequest(f.id)}
                          className="px-4 py-2 bg-primary text-on-primary text-xs font-black rounded-lg hover:scale-[1.02] active:scale-95 transition-all"
                        >Accept</button>
                        <button
                          onClick={() => removeFriend(f.id)}
                          className="px-4 py-2 bg-surface-container-highest border border-white/10 text-white text-xs font-black rounded-lg hover:bg-surface-bright transition-all"
                        >Decline</button>
                      </div>
                    </div>
                  );
                })}
                {outgoing.map(f => {
                  const otherId = otherIdFor(f.users);
                  const p = profiles[otherId];
                  return (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-white/5">
                      <div>
                        <p className="text-sm font-black text-white">{p?.name || otherId}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Awaiting response</p>
                      </div>
                      <button
                        onClick={() => removeFriend(f.id)}
                        className="px-4 py-2 bg-surface-container-highest border border-white/10 text-white text-xs font-black rounded-lg hover:bg-surface-bright transition-all"
                      >Cancel</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FriendsPage;
