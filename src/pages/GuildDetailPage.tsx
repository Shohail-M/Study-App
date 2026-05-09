import React, { useMemo } from 'react';
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
  const { joinGuild, leaveGuild } = useGuilds();
  const { guild, members, myMembership, deleteGuildInHook } = useGuild(guildId);
  const [copied, setCopied] = React.useState(false);

  // ⚠️ All hooks must be called before any conditional early returns (Rules of Hooks)
  const totalFocusMin = useMemo(
    () => members.reduce((acc, m) => acc + ((m as any).weeklyFocusMinutes ?? 0), 0),
    [members]
  );

  const privacyConfig = {
    open:   { icon: 'public',    label: 'Open',    color: 'text-tertiary',  bg: 'bg-tertiary/10 border-tertiary/20' },
    invite: { icon: 'group_add', label: 'Invite',  color: 'text-primary',   bg: 'bg-primary/10 border-primary/20'   },
    closed: { icon: 'lock',      label: 'Closed',  color: 'text-outline',   bg: 'bg-white/5 border-white/10'        },
  };

  const roleConfig = {
    owner:  { icon: 'star',        label: 'Owner',  color: 'text-yellow-400' },
    admin:  { icon: 'shield_person', label: 'Admin', color: 'text-primary'   },
    member: { icon: 'person',       label: 'Member', color: 'text-outline'   },
  };

  if (!useFirebase) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-4xl">diversity_3</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white headline-text">Guild</h2>
            <p className="text-on-surface-variant mt-2">Guilds require Firebase configuration in <code className="text-primary">.env</code>.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!guild) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-error/10 border border-error/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-error text-4xl">error</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white headline-text">Guild not found</h2>
            <p className="text-on-surface-variant mt-2">This guild may have been deleted or doesn't exist.</p>
          </div>
          <button
            onClick={() => navigate('/guilds')}
            className="px-6 py-3 bg-surface-container-highest border border-white/10 text-white rounded-xl font-black hover:bg-surface-bright transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Guilds
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const pCfg = privacyConfig[guild.privacy as 'open' | 'invite' | 'closed'] ?? privacyConfig.open;
  const goalHrs = Math.round(guild.weeklyGoalMinutes / 60);
  const progressPct = Math.min(100, Math.round((totalFocusMin / (guild.weeklyGoalMinutes || 1)) * 100));

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/guilds')}
              className="w-10 h-10 rounded-xl bg-surface-container-highest border border-white/10 flex items-center justify-center hover:bg-surface-bright transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-white text-base">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-extrabold headline-text text-white">{guild.name}</h2>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${pCfg.bg} ${pCfg.color}`}>
                  <span className="material-symbols-outlined text-xs">{pCfg.icon}</span>
                  {pCfg.label}
                </div>
              </div>
              <p className="text-on-surface-variant mt-1 text-sm">{guild.description || `${goalHrs}h weekly goal · ${members.length} members`}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 bg-surface-container-lowest rounded-lg px-2.5 py-1.5">
                  <span className="material-symbols-outlined text-outline/50 text-xs">tag</span>
                  <code className="text-[11px] font-mono text-primary max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{guild.id}</code>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(guild.id); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="p-2 bg-surface-container-highest rounded-lg text-white hover:bg-surface-bright transition-colors"
                  title="Copy Guild ID"
                >
                  <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {!myMembership && (
              <button
                onClick={async () => await joinGuild(guildId)}
                className="px-5 py-2.5 bg-secondary text-on-secondary font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-base">login</span>
                Join Guild
              </button>
            )}
            {myMembership && guild.ownerId !== user?.id && (
              <button
                onClick={async () => {
                  if (confirm('Leave this guild? Your guild membership will be removed.')) {
                    await leaveGuild(guildId);
                    navigate('/guilds');
                  }
                }}
                className="px-5 py-2.5 bg-surface-container-highest border border-white/10 text-white font-black rounded-xl hover:bg-surface-bright transition-all flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Leave Guild
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
        {/* Left – Stats + Members */}
        <div className="lg:col-span-1 space-y-5">
          {/* Guild Stats Card */}
          <div className="bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-base">bar_chart</span>
              </div>
              <p className="text-sm font-black text-white headline-text">Guild Stats</p>
            </div>
            <div className="p-6 space-y-5">
              {/* Members stat */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                  <span className="material-symbols-outlined text-base">group</span>
                  Members
                </div>
                <span className="text-white font-black text-lg">{members.length}</span>
              </div>

              {/* Weekly Goal stat */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                  <span className="material-symbols-outlined text-base">target</span>
                  Weekly Goal
                </div>
                <span className="text-white font-black text-lg">{goalHrs}h</span>
              </div>

              {/* Weekly Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Weekly Progress</span>
                  <span className="text-xs font-black text-primary">{progressPct}%</span>
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1.5">
                  {Math.round(totalFocusMin / 60)}h / {goalHrs}h this week
                </p>
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
                  <p className="text-xs mt-1 font-black uppercase tracking-widest">No members yet</p>
                </div>
              ) : (
                members.map(m => {
                  const role = (m.role || 'member') as 'owner' | 'admin' | 'member';
                  const rCfg = roleConfig[role] ?? roleConfig.member;
                  const initials = (m.displayName || 'U').charAt(0).toUpperCase();
                  return (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 border border-secondary/20 flex items-center justify-center">
                          <span className="text-sm font-black text-secondary">{initials}</span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{m.displayName}</p>
                          <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${rCfg.color}`}>
                            <span className="material-symbols-outlined text-xs">{rCfg.icon}</span>
                            {rCfg.label}
                          </div>
                        </div>
                      </div>
                      {(m as any).weeklyFocusMinutes != null && (
                        <span className="text-xs font-bold text-on-surface-variant">
                          {Math.round((m as any).weeklyFocusMinutes / 60)}h
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right – Chat */}
        <div className="lg:col-span-2 h-[70vh]">
          <ChatThread scope={{ kind: 'guild', id: guildId }} title="Guild Chat" />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GuildDetailPage;
