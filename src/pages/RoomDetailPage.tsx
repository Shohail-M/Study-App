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

export const RoomDetailPage: React.FC = () => {
  const { id } = useParams();
  const roomId = id || '';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinRoom, updatePresence, deleteRoom } = useFocusRooms();
  const { room, members, isMember, startPhase, pause, resume, end } = useFocusRoom(roomId);
  const [tick, setTick] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleStartPhase = async (phase: 'work' | 'break') => {
    setIsLoading(true);
    setError(null);
    try {
      const duration = phase === 'work' ? room.settings.workMin * 60 : room.settings.breakMin * 60;
      await startPhase(phase, duration);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start timer');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await pause();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause timer');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await resume();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume timer');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnd = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await end();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end timer');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const remainingSec = useMemo(() => {
    void tick;
    return computeRemaining(room);
  }, [room, tick]);

  const mm = Math.floor(remainingSec / 60).toString().padStart(2, '0');
  const ss = (remainingSec % 60).toString().padStart(2, '0');

  if (!useFirebase) {
    return (
      <DashboardLayout>
        <div className="bg-surface-container-high rounded-2xl p-8 border border-white/5">
          <h2 className="text-2xl font-black text-white headline-text">Room</h2>
          <p className="text-on-surface-variant mt-2">Multiplayer requires Firebase configuration in `.env`.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!room) {
    return (
      <DashboardLayout>
        <div className="bg-surface-container-high rounded-2xl p-8 border border-white/5">
          <h2 className="text-2xl font-black text-white headline-text">Room not found</h2>
          <button onClick={() => navigate('/rooms')} className="mt-4 px-4 py-2 bg-surface-container-highest rounded-lg text-white font-black">
            Back to Rooms
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in-up flex justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold headline-text text-white">{room.name}</h2>
          <p className="text-on-surface-variant mt-2">
            Phase: <span className="text-white font-bold">{room.timerState.phase}</span> · Status:{' '}
            <span className="text-white font-bold">{room.timerState.status}</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="text-xs font-mono text-primary bg-surface-container-lowest px-2 py-1 rounded">
              ID: {room.id}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(room.id)}
              className="p-2 bg-surface-container-highest rounded text-white hover:bg-surface-bright transition-colors"
              title="Copy Room ID"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {!isMember && (
            <button
              onClick={async () => {
                await joinRoom(roomId);
              }}
              className="px-5 py-3 bg-primary text-on-primary font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Join Room
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
              className="px-5 py-3 bg-error text-white font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Delete Room
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-high rounded-2xl p-6 border border-white/5">
            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Synced Timer</p>
            <div className="mt-3 text-5xl font-black headline-text text-white">{mm}:{ss}</div>
            {error && (
              <div className="mt-3 p-3 bg-error/20 border border-error rounded-lg text-error text-sm font-bold">
                {error}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleStartPhase('work')}
                className="px-4 py-2 bg-primary text-on-primary font-black rounded-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isMember || isLoading}
              >
                {isLoading ? 'Starting...' : 'Start Focus'}
              </button>
              <button
                onClick={() => handleStartPhase('break')}
                className="px-4 py-2 bg-tertiary text-on-tertiary font-black rounded-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isMember || isLoading}
              >
                {isLoading ? 'Starting...' : 'Start Break'}
              </button>
              {room.timerState.status === 'running' ? (
                <button
                  onClick={handlePause}
                  className="px-4 py-2 bg-surface-container-highest text-white font-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isMember || isLoading}
                >
                  {isLoading ? 'Pausing...' : 'Pause'}
                </button>
              ) : room.timerState.status === 'paused' ? (
                <button
                  onClick={handleResume}
                  className="px-4 py-2 bg-surface-container-highest text-white font-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isMember || isLoading}
                >
                  {isLoading ? 'Resuming...' : 'Resume'}
                </button>
              ) : null}
              <button
                onClick={handleEnd}
                className="px-4 py-2 bg-error text-white font-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isMember || isLoading}
              >
                {isLoading ? 'Ending...' : 'End'}
              </button>
            </div>
          </div>

          <div className="bg-surface-container-high rounded-2xl p-6 border border-white/5">
            <p className="text-lg font-black headline-text text-white mb-4">Members</p>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-base">person</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{m.displayName}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-outline">{m.role}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${m.presence.state === 'active' ? 'text-tertiary' : 'text-outline'}`}>
                    {m.presence.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 h-[70vh]">
          <ChatThread scope={{ kind: 'room', id: roomId }} title="Room Chat" />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RoomDetailPage;

