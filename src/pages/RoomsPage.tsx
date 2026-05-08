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

  if (!useFirebase) {
    return (
      <DashboardLayout>
        <div className="bg-surface-container-high rounded-2xl p-8 border border-white/5">
          <h2 className="text-2xl font-black text-white headline-text">Live Focus Rooms</h2>
          <p className="text-on-surface-variant mt-2">Multiplayer requires Firebase configuration in `.env`.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in-up flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold headline-text text-white">Live Focus Rooms</h2>
          <p className="text-on-surface-variant mt-2">Join a room, focus together, chat and share media.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-surface-container-high rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-black text-white headline-text mb-4">Create Room</h3>
          <div className="space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Room name"
            />
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <button
              onClick={async () => {
                const id = await createRoom({ name: name.trim() || 'Focus Room', visibility });
                navigate(`/rooms/${id}`);
              }}
              className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary-container rounded-xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all"
            >
              Create & Enter
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            <h3 className="text-lg font-black text-white headline-text mb-4">Join by Code</h3>
            <div className="flex gap-2">
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="flex-1 bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Room ID"
              />
              <button
                onClick={async () => {
                  const id = roomCode.trim();
                  if (!id) return;
                  await joinRoom(id);
                  navigate(`/rooms/${id}`);
                }}
                className="px-4 py-3 bg-surface-container-highest rounded-lg text-white font-black hover:bg-surface-bright transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface-container-high rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-black text-white headline-text mb-4">Public Rooms</h3>
          {rooms.length === 0 ? (
            <div className="py-16 text-center text-outline/40">
              <span className="material-symbols-outlined text-4xl mb-2">groups</span>
              <p className="text-xs font-black uppercase tracking-widest">No rooms yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms
                .filter(r => r.visibility === 'public')
                .map(r => (
                  <div
                    key={r.id}
                    className="text-left p-4 rounded-2xl bg-surface-container border border-white/5 hover:border-primary/20 hover:bg-surface-container-highest transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-white font-black headline-text">{r.name}</p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-outline">
                        {r.timerState.status === 'running' ? 'Live' : r.timerState.status === 'paused' ? 'Paused' : 'Idle'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {r.settings.workMin}m focus · {r.settings.breakMin}m break · {r.settings.cycles} cycles
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="text-[11px] font-mono text-primary bg-surface-container-lowest px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {r.id}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(r.id);
                        }}
                        className="p-2 bg-surface-container-highest rounded-lg text-white hover:bg-surface-bright transition-colors"
                        title="Copy Room ID"
                      >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                      <button
                        onClick={async () => {
                          await joinRoom(r.id);
                          navigate(`/rooms/${r.id}`);
                        }}
                        className="px-3 py-2 bg-primary text-on-primary rounded-lg text-xs font-black hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RoomsPage;

