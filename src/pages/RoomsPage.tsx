import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useFocusRooms } from '../hooks/useFocusRooms';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../utils/firebaseMode';

export const RoomsPage: React.FC = () => {
  const navigate = useNavigate();
  const { rooms, createRoom, joinRoom } = useFocusRooms();

  const [name, setName] = useState('Focus Room');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!useFirebase) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl">groups</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white headline-text">Live Focus Rooms</h2>
            <p className="text-on-surface-variant mt-2">Multiplayer requires Firebase configuration in <code className="text-primary">.env</code>.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const publicRooms = rooms.filter(r => r.visibility === 'public');

  const statusConfig = {
    running: { label: 'Live', color: 'text-tertiary', dot: 'bg-tertiary', bg: 'bg-tertiary/10 border-tertiary/20' },
    paused:  { label: 'Paused', color: 'text-yellow-400', dot: 'bg-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
    idle:    { label: 'Idle', color: 'text-outline', dot: 'bg-outline', bg: 'bg-white/5 border-white/10' },
  };

  return (
    <DashboardLayout>
      {/* Hero Header */}
      <div className="relative mb-8 animate-fade-in-up overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-surface-container-high to-secondary-container/20 border border-primary/10 p-8">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, var(--color-primary) 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-3xl">groups</span>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold headline-text text-white">Live Focus Rooms</h2>
            <p className="text-on-surface-variant mt-1">Join a room, focus together, chat and share media in real-time.</p>
          </div>
        </div>
        <div className="relative mt-6 flex gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span className="text-on-surface-variant font-semibold">{publicRooms.filter(r => r.timerState.status === 'running').length} Live</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="material-symbols-outlined text-outline text-base">meeting_room</span>
            <span className="text-on-surface-variant font-semibold">{publicRooms.length} Public Rooms</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel – Create & Join */}
        <div className="lg:col-span-1 space-y-5">
          {/* Create Room Card */}
          <div className="bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg">add_circle</span>
                </div>
                <h3 className="text-base font-black text-white headline-text">Create Room</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Room Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-base">meeting_room</span>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all"
                    placeholder="Focus Room"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Visibility</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['public', 'private'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setVisibility(v)}
                      className={`py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
                        visibility === v
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container border border-white/10 text-on-surface-variant hover:border-primary/30 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{v === 'public' ? 'public' : 'lock'}</span>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                disabled={creating}
                onClick={async () => {
                  setCreating(true);
                  try {
                    const id = await createRoom({ name: name.trim() || 'Focus Room', visibility });
                    navigate(`/rooms/${id}`);
                  } finally {
                    setCreating(false);
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-on-primary rounded-xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">rocket_launch</span>
                {creating ? 'Creating...' : 'Create & Enter'}
              </button>
            </div>
          </div>

          {/* Join by Code Card */}
          <div className="bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-lg">vpn_key</span>
                </div>
                <h3 className="text-base font-black text-white headline-text">Join by Code</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-base">tag</span>
                <input
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all font-mono"
                  placeholder="Paste Room ID…"
                />
              </div>
              <button
                disabled={joining || !roomCode.trim()}
                onClick={async () => {
                  const id = roomCode.trim();
                  if (!id) return;
                  setJoining(true);
                  try {
                    await joinRoom(id);
                    navigate(`/rooms/${id}`);
                  } finally {
                    setJoining(false);
                  }
                }}
                className="w-full py-3 bg-surface-container-highest border border-white/10 text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-surface-bright hover:border-primary/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">login</span>
                {joining ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel – Public Rooms */}
        <div className="lg:col-span-2 bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">explore</span>
              </div>
              <h3 className="text-base font-black text-white headline-text">Public Rooms</h3>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-outline px-2 py-1 bg-surface-container rounded-full">
              {publicRooms.length}
            </span>
          </div>

          <div className="p-6">
            {publicRooms.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-outline text-3xl">groups</span>
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-outline">No public rooms yet</p>
                  <p className="text-xs text-on-surface-variant mt-1">Be the first to create one!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {publicRooms.map((r, i) => {
                  const status = r.timerState.status as 'running' | 'paused' | 'idle';
                  const cfg = statusConfig[status] ?? statusConfig.idle;
                  return (
                    <div
                      key={r.id}
                      className="group p-4 rounded-2xl bg-surface-container border border-white/5 hover:border-primary/20 hover:bg-surface-container-highest transition-all duration-200 animate-fade-in-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-lg">meeting_room</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-black headline-text truncate">{r.name}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {r.settings.workMin}m focus · {r.settings.breakMin}m break · {r.settings.cycles} cycles
                            </p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shrink-0 ${cfg.bg} ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'running' ? 'animate-pulse' : ''}`} />
                          {cfg.label}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-1.5 bg-surface-container-lowest rounded-lg px-2.5 py-1.5 min-w-0">
                          <span className="material-symbols-outlined text-outline/50 text-xs shrink-0">tag</span>
                          <code className="text-[11px] font-mono text-primary overflow-hidden text-ellipsis whitespace-nowrap">
                            {r.id}
                          </code>
                        </div>
                        <button
                          onClick={() => handleCopy(r.id)}
                          className="p-2 bg-surface-container-highest rounded-lg text-white hover:bg-surface-bright transition-colors shrink-0"
                          title="Copy Room ID"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {copied === r.id ? 'check' : 'content_copy'}
                          </span>
                        </button>
                        <button
                          onClick={async () => {
                            await joinRoom(r.id);
                            navigate(`/rooms/${r.id}`);
                          }}
                          className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-black hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                        >
                          <span className="material-symbols-outlined text-sm">login</span>
                          Join
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RoomsPage;
