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
          <div className="w-20 h-20 rounded-3xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-4xl">diversity_3</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white headline-text">Guilds</h2>
            <p className="text-on-surface-variant mt-2">Guilds require Firebase configuration in <code className="text-primary">.env</code>.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const privacyConfig = {
    open:   { icon: 'public', label: 'Open',        color: 'text-tertiary',   bg: 'bg-tertiary/10 border-tertiary/20' },
    invite: { icon: 'group_add', label: 'Invite',   color: 'text-primary',    bg: 'bg-primary/10 border-primary/20' },
    closed: { icon: 'lock',   label: 'Closed',      color: 'text-outline',    bg: 'bg-white/5 border-white/10' },
  };

  return (
    <DashboardLayout>
      {/* Hero Header */}
      <div className="relative mb-8 animate-fade-in-up overflow-hidden rounded-3xl bg-gradient-to-br from-secondary/20 via-surface-container-high to-primary/10 border border-secondary/10 p-8">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, var(--color-secondary) 0%, transparent 60%)' }} />
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-secondary/20 border border-secondary/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-secondary text-3xl">diversity_3</span>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold headline-text text-white">Guilds</h2>
            <p className="text-on-surface-variant mt-1">Join a study group, chat, and hit weekly goals together.</p>
          </div>
        </div>
        <div className="relative mt-6 flex gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="material-symbols-outlined text-secondary text-base">diversity_3</span>
            <span className="text-on-surface-variant font-semibold">{guilds.length} Guilds</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="material-symbols-outlined text-tertiary text-base">public</span>
            <span className="text-on-surface-variant font-semibold">{guilds.filter(g => g.privacy === 'open').length} Open</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel – Create & Join */}
        <div className="lg:col-span-1 space-y-5">
          {/* Create Guild Card */}
          <div className="bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-lg">add_circle</span>
                </div>
                <h3 className="text-base font-black text-white headline-text">Create Guild</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Guild Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-base">shield</span>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/30 transition-all"
                    placeholder="Study Guild"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Weekly Goal (hours)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-base">target</span>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={goalHours}
                    onChange={e => setGoalHours(Number(e.target.value))}
                    className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Privacy</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['open', 'invite', 'closed'] as const).map(p => {
                    const cfg = privacyConfig[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setPrivacy(p)}
                        className={`py-2 rounded-xl text-xs font-black transition-all flex flex-col items-center gap-1 ${
                          privacy === p
                            ? 'bg-secondary text-on-secondary'
                            : 'bg-surface-container border border-white/10 text-on-surface-variant hover:border-secondary/30 hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">{cfg.icon}</span>
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                disabled={creating}
                onClick={async () => {
                  setCreating(true);
                  try {
                    const id = await createGuild({
                      name: name.trim() || 'Study Guild',
                      weeklyGoalMinutes: Math.round(Math.max(1, goalHours) * 60),
                      privacy,
                    });
                    navigate(`/guilds/${id}`);
                  } finally {
                    setCreating(false);
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-secondary to-primary text-on-secondary rounded-xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">rocket_launch</span>
                {creating ? 'Creating...' : 'Create & Enter'}
              </button>
            </div>
          </div>

          {/* Join by Code */}
          <div className="bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg">vpn_key</span>
                </div>
                <h3 className="text-base font-black text-white headline-text">Join by Code</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-base">tag</span>
                <input
                  value={guildCode}
                  onChange={e => setGuildCode(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all font-mono"
                  placeholder="Paste Guild ID…"
                />
              </div>
              <button
                disabled={joining || !guildCode.trim()}
                onClick={async () => {
                  const id = guildCode.trim();
                  if (!id) return;
                  setJoining(true);
                  try {
                    await joinGuild(id);
                    navigate(`/guilds/${id}`);
                  } finally {
                    setJoining(false);
                  }
                }}
                className="w-full py-3 bg-surface-container-highest border border-white/10 text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-surface-bright hover:border-primary/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">login</span>
                {joining ? 'Joining...' : 'Join Guild'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel – Discover Guilds */}
        <div className="lg:col-span-2 bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">explore</span>
              </div>
              <h3 className="text-base font-black text-white headline-text">Discover Guilds</h3>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-outline px-2 py-1 bg-surface-container rounded-full">
              {guilds.length}
            </span>
          </div>

          <div className="p-6">
            {guilds.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-outline text-3xl">diversity_3</span>
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest text-outline">No guilds yet</p>
                  <p className="text-xs text-on-surface-variant mt-1">Start your study group today!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {guilds.map((g, i) => {
                  const pCfg = privacyConfig[g.privacy as 'open' | 'invite' | 'closed'] ?? privacyConfig.open;
                  const goalHrs = Math.round(g.weeklyGoalMinutes / 60);
                  return (
                    <div
                      key={g.id}
                      className="group p-4 rounded-2xl bg-surface-container border border-white/5 hover:border-secondary/20 hover:bg-surface-container-highest transition-all duration-200 animate-fade-in-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/15 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-secondary text-lg">shield</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-black headline-text truncate">{g.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="material-symbols-outlined text-outline/60 text-xs">target</span>
                              <p className="text-xs text-on-surface-variant">{goalHrs}h weekly goal</p>
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shrink-0 ${pCfg.bg} ${pCfg.color}`}>
                          <span className="material-symbols-outlined text-xs">{pCfg.icon}</span>
                          {pCfg.label}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-1.5 bg-surface-container-lowest rounded-lg px-2.5 py-1.5 min-w-0">
                          <span className="material-symbols-outlined text-outline/50 text-xs shrink-0">tag</span>
                          <code className="text-[11px] font-mono text-primary overflow-hidden text-ellipsis whitespace-nowrap">
                            {g.id}
                          </code>
                        </div>
                        <button
                          onClick={() => handleCopy(g.id)}
                          className="p-2 bg-surface-container-highest rounded-lg text-white hover:bg-surface-bright transition-colors shrink-0"
                          title="Copy Guild ID"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {copied === g.id ? 'check' : 'content_copy'}
                          </span>
                        </button>
                        <button
                          onClick={async () => {
                            await joinGuild(g.id);
                            navigate(`/guilds/${g.id}`);
                          }}
                          className="px-4 py-2 bg-secondary text-on-secondary rounded-xl text-xs font-black hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
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

export default GuildsPage;
