import React from 'react';
import { getTierVisual, type RankInfo, type RankTier } from '../utils/progression';

interface RankShieldProps {
  readonly tier: RankTier;
  readonly division: RankInfo['division'];
  readonly size?: 'sm' | 'md' | 'lg';
  readonly locked?: boolean;
}

// Renders a tier-styled shield/badge with division pips. Used on the Ranked
// page carousel cards and the hero. The look is deliberately game-y: a chunky
// gradient disc with a tier icon and small division stars beneath.
export const RankShield: React.FC<RankShieldProps> = ({ tier, division, size = 'md', locked = false }) => {
  const v = getTierVisual(tier);
  const dims = size === 'lg'
    ? { box: 'w-32 h-32', icon: 'text-6xl', star: 'text-base' }
    : size === 'sm'
    ? { box: 'w-16 h-16', icon: 'text-2xl', star: 'text-[10px]' }
    : { box: 'w-24 h-24', icon: 'text-4xl', star: 'text-sm' };

  // Division I = 3 pips (highest within tier), II = 2, III = 1.
  const pipCount = 4 - division;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={[
          'relative rounded-full flex items-center justify-center',
          'bg-gradient-to-br', v.gradient,
          'ring-4', v.ring,
          'shadow-2xl', v.glow,
          dims.box,
          locked ? 'grayscale opacity-50' : '',
        ].join(' ')}
      >
        <span className={`material-symbols-outlined text-white drop-shadow ${dims.icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {v.icon}
        </span>
        {locked && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-white/90 text-2xl">lock</span>
          </div>
        )}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={i}
            className={`material-symbols-outlined ${dims.star} ${i < pipCount ? v.accent : 'text-white/15'}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
        ))}
      </div>
    </div>
  );
};

export default RankShield;
