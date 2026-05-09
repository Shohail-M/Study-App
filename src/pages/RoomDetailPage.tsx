import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { useFocusRoom, useFocusRooms } from '../hooks/useFocusRooms';
import { useFirebase } from '../utils/firebaseMode';
import { ChatThread } from '../components/ChatThread';
import { useAuth } from '../context/AuthContext';

function computeRemaining(room: any): number {
  const ts = room?.timerState;
  if (!ts?.durationSec) return 0;
  if (ts.status === 'idle') return ts.durationSec;
  const startedAt = ts.startedAt?.getTime?.() ?? 0;
  const accumulatedPaused = ts.accumulatedPausedSec ?? 0;
  let pausedExtra = 0;
  if (ts.status === 'paused' && ts.pausedAt) {
    pausedExtra = Math.max(0, Math.floor((Date.now() - ts.pausedAt.getTime()) / 1000));
  }
  const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000) - accumulatedPaused - pausedExtra);
  return Math.max(0, ts.durationSec - elapsed);
}

/** SVG circular progress ring */
function TimerRing({ progress, phase, status }: { progress: number; phase: string; status: string }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  const phaseColor = phase === 'work'
    ? { stroke: '#88adff', glow: 'rgba(136,173,255,0.4)' }
    : { stroke: '#c5ffc9', glow: 'rgba(197,255,201,0.4)' };

  return (
    <svg width="170" height="170" viewBox="0 0 170 170" className="drop-shadow-lg">
      {/* Track */}
      <circle cx="85" cy="85" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      {/* Progress */}
      <circle
        cx="85"
        cy="85"
        r={r}
        fill="none"
        stroke={phaseColor.stroke}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 85 85)"
        style={{
          filter: status === 'running' ? `drop-shadow(0 0 8px ${phaseColor.glow})` : 'none',
          transition: 'stroke-dashoffset 1s linear',
        }}
      />
    </svg>
  );
}

export const RoomDetailPage: React.FC = () => {
  const { id } = useParams();
  const roomId = id || '';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinRoom, leaveRoom, updatePresence, deleteRoom } = useFocusRooms();
  const { room, members, isMember, startPhase, pause, resume, end } = useFocusRoom(roomId);
  const [tick, setTick] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Track member status in a ref so the unmount cleanup can read the latest value
  // without re-running the effect every time membership flips.
  const isMemberRef = React.useRef(isMember);
  const isOwnerRef = React.useRef(false);
  useEffect(() => { isMemberRef.current = isMember; }, [isMember]);
  useEffect(() => { isOwnerRef.current = !!user && room?.ownerId === user.id; }, [user, room?.ownerId]);

  useEffect(() => {
    const t = window.setInterval(() => setTick(x => x + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!useFirebase || !roomId) return;
    if (!isMember) return;
    updatePresence(roomId, 'active');
    const ping = window.setInterval(() => updatePresence(roomId, 'active'), 15000);
    return () => window.clearInterval(ping);
  }, [roomId, isMember, updatePresence]);

  // Auto-cleanup: removing the user's member doc when navigating away from the room.
  // Owner is preserved so they don't accidentally drop themselves on every visit.
  useEffect(() => {
    if (!useFirebase || !roomId) return;
    return () => {
      if (isMemberRef.current && !isOwnerRef.current) {
        leaveRoom(roomId);
      }
    };
  }, [roomId, leaveRoom]);

  const withLoading = async (fn: () => Promise<void>, errMsg: string) => {
    setIsLoading(true);
    setError(null);
    try { await fn(); }
    catch (err) {
      const msg = err instanceof Error ? err.message : errMsg;
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } finally { setIsLoading(false); }
  };

  const remainingSec = useMemo(() => { void tick; return computeRemaining(room); }, [room, tick]);
  const totalSec = room?.timerState?.durationSec || 1;
  const progress = remainingSec / totalSec;

  const mm = Math.floor(remainingSec / 60).toString().padStart(2, '0');
  const ss = (remainingSec % 60).toString().padStart(2, '0');

  const phase = room?.timerState?.phase || 'work';
  const status = room?.timerState?.status || 'idle';

  const phaseConfig = {
    work:  { label: 'Focus', icon: 'psychology', color: 'text-primary',  bg: 'bg-primary/10 border-primary/20' },
    break: { label: 'Break', icon: 'coffee',     color: 'text-tertiary', bg: 'bg-tertiary/10 border-tertiary/20' },
  };
  const pCfg = phaseConfig[phase as 'work' | 'break'] ?? phaseConfig.work;

  const statusBadge = {
    running: { label: 'Live',   color: 'text-tertiary',  dot: 'bg-tertiary animate-pulse',  bg: 'bg-tertiary/10 border-tertiary/20' },
    paused:  { label: 'Paused', color: 'text-yellow-400', dot: 'bg-yellow-400',             bg: 'bg-yellow-400/10 border-yellow-400/20' },
    idle:    { label: 'Idle',   color: 'text-outline',    dot: 'bg-outline',                bg: 'bg-white/5 border-white/10' },
  };
  const sBadge = statusBadge[status as 'running' | 'paused' | 'idle'] ?? statusBadge.idle;

  if (!useFirebase) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl">meeting_room</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white headline-text">Live Focus Room</h2>
            <p className="text-on-surface-variant mt-2">Multiplayer requires Firebase configuration in <code className="text-primary">.env</code>.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!room) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-error/10 border border-error/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-error text-4xl">error</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white headline-text">Room not found</h2>
            <p className="text-on-surface-variant mt-2">This room may have been deleted or doesn't exist.</p>
          </div>
          <button
            onClick={() => navigate('/rooms')}
            className="px-6 py-3 bg-surface-container-highest border border-white/10 text-white rounded-xl font-black hover:bg-surface-bright transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Rooms
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/rooms')}
              className="w-10 h-10 rounded-xl bg-surface-container-highest border border-white/10 flex items-center justify-center hover:bg-surface-bright transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-white text-base">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-extrabold headline-text text-white">{room.name}</h2>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${sBadge.bg} ${sBadge.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sBadge.dot}`} />
                  {sBadge.label}
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${pCfg.bg} ${pCfg.color}`}>
                  <span className="material-symbols-outlined text-xs">{pCfg.icon}</span>
                  {pCfg.label}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 bg-surface-container-lowest rounded-lg px-2.5 py-1.5">
                  <span className="material-symbols-outlined text-outline/50 text-xs">tag</span>
                  <code className="text-[11px] font-mono text-primary max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{room.id}</code>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(room.id); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="p-2 bg-surface-container-highest rounded-lg text-white hover:bg-surface-bright transition-colors"
                  title="Copy Room ID"
                >
                  <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {!isMember && (
              <button
                onClick={async () => await joinRoom(roomId)}
                className="px-5 py-2.5 bg-primary text-on-primary font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-base">login</span>
                Join Room
              </button>
            )}
            {isMember && room.ownerId !== user?.id && (
              <button
                onClick={async () => {
                  await leaveRoom(roomId);
                  navigate('/rooms');
                }}
                className="px-5 py-2.5 bg-surface-container-highest border border-white/10 text-white font-black rounded-xl hover:bg-surface-bright transition-all flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Leave Room
              </button>
            )}
            {isMember && room.ownerId === user?.id && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this room?')) {
                    await deleteRoom(roomId);
                    navigate('/rooms');
                  }
                }}
                className="px-5 py-2.5 bg-error/10 border border-error/30 text-error font-black rounded-xl hover:bg-error hover:text-white transition-all flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left – Timer + Members */}
        <div className="lg:col-span-1 space-y-5">
          {/* Timer Card */}
          <div className="bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-base">timer</span>
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-on-surface-variant">Synced Timer</p>
            </div>

            <div className="p-6 flex flex-col items-center">
              {/* Ring + Time */}
              <div className="relative flex items-center justify-center">
                <TimerRing progress={progress} phase={phase} status={status} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-4xl font-black headline-text text-white tabular-nums">{mm}:{ss}</p>
                  <p className={`text-[11px] font-black uppercase tracking-widest mt-1 ${pCfg.color}`}>{pCfg.label}</p>
                </div>
              </div>

              {/* Session info pills */}
              <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant border border-white/5">
                  <span className="material-symbols-outlined text-xs">psychology</span>
                  {room.settings.workMin}m focus
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant border border-white/5">
                  <span className="material-symbols-outlined text-xs">coffee</span>
                  {room.settings.breakMin}m break
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container text-[10px] font-bold text-on-surface-variant border border-white/5">
                  <span className="material-symbols-outlined text-xs">repeat</span>
                  {room.settings.cycles}x
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 w-full p-3 bg-error/10 border border-error/30 rounded-xl text-error text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              {/* Controls */}
              <div className="mt-5 w-full grid grid-cols-2 gap-2">
                <button
                  onClick={() => withLoading(() => startPhase('work', room.settings.workMin * 60), 'Failed to start')}
                  disabled={!isMember || isLoading}
                  className="py-2.5 bg-primary text-on-primary rounded-xl font-black text-xs flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-sm">psychology</span>
                  Focus
                </button>
                <button
                  onClick={() => withLoading(() => startPhase('break', room.settings.breakMin * 60), 'Failed to start')}
                  disabled={!isMember || isLoading}
                  className="py-2.5 bg-tertiary/20 border border-tertiary/30 text-tertiary rounded-xl font-black text-xs flex items-center justify-center gap-1.5 hover:bg-tertiary hover:text-on-tertiary hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-sm">coffee</span>
                  Break
                </button>

                {status === 'running' ? (
                  <button
                    onClick={() => withLoading(pause, 'Failed to pause')}
                    disabled={!isMember || isLoading}
                    className="py-2.5 bg-surface-container-highest border border-white/10 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 hover:bg-surface-bright transition-all disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">pause</span>
                    Pause
                  </button>
                ) : status === 'paused' ? (
                  <button
                    onClick={() => withLoading(resume, 'Failed to resume')}
                    disabled={!isMember || isLoading}
                    className="py-2.5 bg-surface-container-highest border border-white/10 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 hover:bg-surface-bright transition-all disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    Resume
                  </button>
                ) : <div />}

                <button
                  onClick={() => withLoading(end, 'Failed to end')}
                  disabled={!isMember || isLoading}
                  className="py-2.5 bg-error/10 border border-error/30 text-error rounded-xl font-black text-xs flex items-center justify-center gap-1.5 hover:bg-error hover:text-white hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-sm">stop</span>
                  End
                </button>
              </div>
            </div>
          </div>

          {/* Members Card */}
          <div className="bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-base">group</span>
                </div>
                <p className="text-sm font-black text-white headline-text">Members</p>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-outline px-2 py-1 bg-surface-container rounded-full">
                {members.length}
              </span>
            </div>
            <div className="p-4 space-y-2">
              {members.length === 0 ? (
                <div className="py-8 text-center text-outline/40">
                  <span className="material-symbols-outlined text-2xl">person_off</span>
                  <p className="text-xs mt-1 font-black uppercase tracking-widest">No members</p>
                </div>
              ) : (
                members.map(m => {
                  const isActive = m.presence.state === 'active';
                  const initials = (m.displayName || 'U').charAt(0).toUpperCase();
                  return (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center">
                            <span className="text-sm font-black text-primary">{initials}</span>
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-container ${isActive ? 'bg-tertiary' : 'bg-outline/50'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{m.displayName}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">{m.role}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-tertiary' : 'text-outline'}`}>
                        {isActive ? 'Active' : 'Away'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right – Chat */}
        <div className="lg:col-span-2 h-[70vh]">
          <ChatThread scope={{ kind: 'room', id: roomId }} title="Room Chat" />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RoomDetailPage;
