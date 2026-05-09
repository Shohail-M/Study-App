export type RankTier =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Master'
  | 'Grandmaster';

export interface RankInfo {
  name: string; // e.g. "Gold II"
  tier: RankTier;
  division: 1 | 2 | 3;
  minScore: number;
  nextMinScore: number | null;
}

export function computeEffectiveScore(input: {
  xp: number;
  streakDays: number;
  completedTasks: number;
  completedBooks: number;
}): number {
  const xp = input.xp || 0;
  const streakBonus = Math.max(0, input.streakDays || 0) * 25;
  const taskBonus = Math.max(0, input.completedTasks || 0) * 10;
  const bookBonus = Math.max(0, input.completedBooks || 0) * 150;
  return xp + streakBonus + taskBonus + bookBonus;
}

export function computeLevelFromScore(score: number): number {
  // 500 pts per level keeps parity with existing XP leveling, but now includes bonuses.
  return Math.max(1, Math.floor((score || 0) / 500) + 1);
}

const RANKS: Array<Omit<RankInfo, 'nextMinScore'>> = [
  { name: 'Bronze III', tier: 'Bronze', division: 3, minScore: 0 },
  { name: 'Bronze II', tier: 'Bronze', division: 2, minScore: 500 },
  { name: 'Bronze I', tier: 'Bronze', division: 1, minScore: 1000 },
  { name: 'Silver III', tier: 'Silver', division: 3, minScore: 1500 },
  { name: 'Silver II', tier: 'Silver', division: 2, minScore: 2200 },
  { name: 'Silver I', tier: 'Silver', division: 1, minScore: 3000 },
  { name: 'Gold III', tier: 'Gold', division: 3, minScore: 4000 },
  { name: 'Gold II', tier: 'Gold', division: 2, minScore: 5200 },
  { name: 'Gold I', tier: 'Gold', division: 1, minScore: 6600 },
  { name: 'Platinum III', tier: 'Platinum', division: 3, minScore: 8200 },
  { name: 'Platinum II', tier: 'Platinum', division: 2, minScore: 10000 },
  { name: 'Platinum I', tier: 'Platinum', division: 1, minScore: 12000 },
  { name: 'Diamond III', tier: 'Diamond', division: 3, minScore: 14500 },
  { name: 'Diamond II', tier: 'Diamond', division: 2, minScore: 17500 },
  { name: 'Diamond I', tier: 'Diamond', division: 1, minScore: 21000 },
  { name: 'Master III', tier: 'Master', division: 3, minScore: 25000 },
  { name: 'Master II', tier: 'Master', division: 2, minScore: 30000 },
  { name: 'Master I', tier: 'Master', division: 1, minScore: 36000 },
  { name: 'Grandmaster III', tier: 'Grandmaster', division: 3, minScore: 43000 },
  { name: 'Grandmaster II', tier: 'Grandmaster', division: 2, minScore: 52000 },
  { name: 'Grandmaster I', tier: 'Grandmaster', division: 1, minScore: 62000 },
];

export function getAllRanks(): Array<Omit<RankInfo, 'nextMinScore'> & { nextMinScore: number | null }> {
  return RANKS.map((r, i) => ({
    ...r,
    nextMinScore: RANKS[i + 1]?.minScore ?? null,
  }));
}

// Visual metadata used by the Ranked page to render tier shields. Kept here so
// any UI that needs a consistent look for a tier (modal, page, friends list)
// can pull the same colors/icons.
export interface TierVisual {
  icon: string;        // material-symbols-outlined name
  gradient: string;    // tailwind gradient classes for the shield body
  ring: string;        // tailwind ring/border color class
  accent: string;      // tailwind text color for tier label
  glow: string;        // tailwind shadow color class
}

const TIER_VISUALS: Record<RankTier, TierVisual> = {
  Bronze:      { icon: 'shield',            gradient: 'from-amber-700 to-amber-900',     ring: 'ring-amber-500/40',   accent: 'text-amber-400',   glow: 'shadow-amber-700/30' },
  Silver:      { icon: 'shield',            gradient: 'from-slate-300 to-slate-500',     ring: 'ring-slate-300/40',   accent: 'text-slate-200',   glow: 'shadow-slate-400/30' },
  Gold:        { icon: 'workspace_premium', gradient: 'from-yellow-400 to-amber-600',    ring: 'ring-yellow-300/50',  accent: 'text-yellow-300',  glow: 'shadow-yellow-500/30' },
  Platinum:    { icon: 'workspace_premium', gradient: 'from-teal-300 to-cyan-500',       ring: 'ring-cyan-300/50',    accent: 'text-cyan-200',    glow: 'shadow-cyan-400/30' },
  Diamond:     { icon: 'diamond',           gradient: 'from-sky-400 to-indigo-600',      ring: 'ring-sky-300/50',     accent: 'text-sky-200',     glow: 'shadow-indigo-500/40' },
  Master:      { icon: 'auto_awesome',      gradient: 'from-fuchsia-500 to-purple-700',  ring: 'ring-fuchsia-400/50', accent: 'text-fuchsia-200', glow: 'shadow-fuchsia-600/40' },
  Grandmaster: { icon: 'military_tech',     gradient: 'from-rose-500 to-red-700',        ring: 'ring-rose-400/50',    accent: 'text-rose-200',    glow: 'shadow-rose-600/40' },
};

export function getTierVisual(tier: RankTier): TierVisual {
  return TIER_VISUALS[tier];
}

export function computeRank(score: number): RankInfo {
  const s = score || 0;
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (s >= RANKS[i].minScore) idx = i;
  }
  const current = RANKS[idx];
  const next = RANKS[idx + 1];
  return {
    ...current,
    nextMinScore: next ? next.minScore : null,
  };
}

function dayKey(d: Date): string {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

export function computeStreakDays(input: { sessionDates: Date[]; includeTodayIfActiveMs?: number }): number {
  const keys = new Set(input.sessionDates.map(dayKey));
  const today = new Date();
  const todayKey = dayKey(today);
  if ((input.includeTodayIfActiveMs || 0) > 0) keys.add(todayKey);

  let streak = 0;
  for (let offset = 0; ; offset++) {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    const k = dayKey(d);
    if (!keys.has(k)) break;
    streak++;
  }
  return streak;
}

