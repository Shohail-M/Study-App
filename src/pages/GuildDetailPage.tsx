import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { useGuild, useGuilds } from '../hooks/useGuilds';
import { useFirebase } from '../utils/firebaseMode';
import { ChatThread } from '../components/ChatThread';
import { useAuth } from '../context/AuthContext';

export const GuildDetailPage: React.FC = () => {
  const { id } = useParams();
  const guildId = id || '';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinGuild } = useGuilds();
  const { guild, members, myMembership, deleteGuildInHook } = useGuild(guildId);

  if (!useFirebase) {
    return (
      <DashboardLayout>
        <div className="bg-surface-container-high rounded-2xl p-8 border border-white/5">
          <h2 className="text-2xl font-black text-white headline-text">Guild</h2>
          <p className="text-on-surface-variant mt-2">Guilds require Firebase configuration in `.env`.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!guild) {
    return (
      <DashboardLayout>
        <div className="bg-surface-container-high rounded-2xl p-8 border border-white/5">
          <h2 className="text-2xl font-black text-white headline-text">Guild not found</h2>
          <button onClick={() => navigate('/guilds')} className="mt-4 px-4 py-2 bg-surface-container-highest rounded-lg text-white font-black">
            Back to Guilds
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in-up flex justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold headline-text text-white">{guild.name}</h2>
          <p className="text-on-surface-variant mt-2">{guild.description || `${Math.round(guild.weeklyGoalMinutes / 60)}h weekly goal`}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="text-xs font-mono text-primary bg-surface-container-lowest px-2 py-1 rounded">
              ID: {guild.id}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(guild.id)}
              className="p-2 bg-surface-container-highest rounded text-white hover:bg-surface-bright transition-colors"
              title="Copy Guild ID"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {!myMembership && (
            <button
              onClick={async () => {
                await joinGuild(guildId);
              }}
              className="px-5 py-3 bg-primary text-on-primary font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Join Guild
            </button>
          )}
          {myMembership && guild.ownerId === user?.id && (
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to delete this guild?')) {
                  await deleteGuildInHook();
                  navigate('/guilds');
                }
              }}
              className="px-5 py-3 bg-error text-white font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Delete Guild
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-surface-container-high rounded-2xl p-6 border border-white/5">
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
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 h-[70vh]">
          <ChatThread scope={{ kind: 'guild', id: guildId }} title="Guild Chat" />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GuildDetailPage;

