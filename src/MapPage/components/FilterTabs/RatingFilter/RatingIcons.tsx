import { describeTier } from './RatingBar/describeTier';
import { primaryBlack } from '../../../../utils/styling/Colors';

type RatingOption = {
  tier: 1 | 2 | 3 | 4;
  label: string;
};

export const ratingOptions: RatingOption[] = [
  { tier: 1, label: 'Better than Average' },
  { tier: 2, label: 'Top 25% of Establishments' },
  { tier: 3, label: 'Top 10% of Establishments' },
  { tier: 4, label: 'Top 5% of Establishments' },
];

export const SVG_05 = 'M12 22 L2 12 L6.5 7 L17.5 7 L22 12 Z';
export const SVG_10 = 'M12 1.5 L18 5.5 L18 18.5 L12 22.5 L6 18.5 L6 5.5 Z';
export const SVG_25 = 'M 12 1.5 L 19 12 L 12 22.5 L 5 12 Z';
export const SVG_50 = 'M 6 6 H 18 V 18 H 6 Z';
export const RANK_BADGE = ({ tier, filled = true }: { tier: 1 | 2 | 3 | 4; filled?: boolean }) => {
  if (tier >= 1) return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d={tier === 1 ? SVG_50 : tier === 2 ? SVG_25 : tier === 3 ? SVG_10 : SVG_05}
        fill={filled ? 'currentColor' : 'none'}
        stroke={primaryBlack}
        strokeWidth={filled ? 0 : 1.2}
        strokeLinejoin="round"
      />
    </svg>
  )
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10"
        fill={filled ? 'currentColor' : 'none'}
        stroke={primaryBlack} strokeWidth={filled ? 0 : 1.2}
      />
    </svg>
  );
};

const BADGE_STROKE_COLOR = primaryBlack;

export const BADGE = ({ tier, filled = true }: { tier?: 1 | 2 | 3 | 4; filled?: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d={SVG_25}
      fill={filled ? 'currentColor' : 'none'}
      stroke={BADGE_STROKE_COLOR}
      strokeWidth={filled ? 0 : 1.2}
      strokeLinejoin="round"
    />
    {tier !== undefined ? (
      <text
        x="12"
        y="12.4"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={filled ? "8" : "7"}
        fill={filled ? '#ffffff' : BADGE_STROKE_COLOR}
      >
        <tspan fontWeight="500">{describeTier(tier)}</tspan>
      </text>
    ) : null}
  </svg>
)

export const GEMSTONE = () => (
  <svg viewBox="1 1 22 22" aria-hidden="true" focusable="false">
    <path d={SVG_10} fill="currentColor" />
  </svg>
)

export const T4Icon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={SVG_05} fill="currentColor" />
  </svg>
);

export const T3Icon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={SVG_05} fill="currentColor" />
  </svg>
);

export const T2Icon = ({ clipId }: { clipId: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id={clipId}>
        <rect x="2" y="2" width="10" height="20" />
      </clipPath>
    </defs>
    <path d={SVG_05} fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d={SVG_05} fill="currentColor" clipPath={`url(#${clipId})`} />
  </svg>
);

export const T1Icon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={SVG_05} fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);