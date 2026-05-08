import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useGuilds } from '../hooks/useGuilds';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '../utils/firebaseMode';

export const GuildsPage: React.FC = () => {
  const navigate = useNavigate();
  const { guilds, createGuild, joinGuild } = useGuilds();

  const [name, setName] = useState('Study Guild');
  const [goalHours, setGoalHours] = useState(10);
  const [privacy, setPrivacy] = useState<'open' | 'invite' | 'closed'>('open');
  const [guildCode, setGuildCode] = useState('');

  if (!useFirebase) {
    return (
      <DashboardLayout>
        <div className="bg-surface-container-high rounded-2xl p-8 border border-white/5">
          <h2 className="text-2xl font-black text-white headline-text">Guilds</h2>
          <p className="text-on-surface-variant mt-2">Guilds require Firebase configuration in `.env`.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in-up">
        <h2 className="text-3xl font-extrabold headline-text text-white">Guilds</h2>
        <p className="text-on-surface-variant mt-2">Join a study group, chat, and hit weekly goals together.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface-container-high rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-black text-white headline-text mb-4">Create Guild</h3>
          <div className="space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Guild name"
            />
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Weekly Goal (hours)</label>
              <input
                type="number"
                min={1}
                max={200}
                value={goalHours}
                onChange={(e) => setGoalHours(Number(e.target.value))}
                className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as any)}
              className="w-full bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="open">Open</option>
              <option value="invite">Invite Only</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={async () => {
                const id = await createGuild({
                  name: name.trim() || 'Study Guild',
                  weeklyGoalMinutes: Math.round(Math.max(1, goalHours) * 60),
                  privacy,
                });
                navigate(`/guilds/${id}`);
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
                value={guildCode}
                onChange={(e) => setGuildCode(e.target.value)}
                className="flex-1 bg-surface-container border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Guild ID"
              />
              <button
                onClick={async () => {
                  const id = guildCode.trim();
                  if (!id) return;
                  await joinGuild(id);
                  navigate(`/guilds/${id}`);
                }}
                className="px-4 py-3 bg-surface-container-highest rounded-lg text-white font-black hover:bg-surface-bright transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface-container-high rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-black text-white headline-text mb-4">Discover</h3>
          {guilds.length === 0 ? (
            <div className="py-16 text-center text-outline/40">
              <span className="material-symbols-outlined text-4xl mb-2">diversity_3</span>
              <p className="text-xs font-black uppercase tracking-widest">No guilds yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {guilds.map(g => (
                <div
                  key={g.id}
                  className="text-left p-4 rounded-2xl bg-surface-container border border-white/5 hover:border-primary/20 hover:bg-surface-container-highest transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-white font-black headline-text">{g.name}</p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-outline">{g.privacy}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">{Math.round(g.weeklyGoalMinutes / 60)}h weekly goal</p>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="text-[11px] font-mono text-primary bg-surface-container-lowest px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {g.id}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(g.id);
                      }}
                      className="p-2 bg-surface-container-highest rounded-lg text-white hover:bg-surface-bright transition-colors"
                      title="Copy Guild ID"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>
                    <button
                      onClick={async () => {
                        await joinGuild(g.id);
                        navigate(`/guilds/${g.id}`);
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

export default GuildsPage;

