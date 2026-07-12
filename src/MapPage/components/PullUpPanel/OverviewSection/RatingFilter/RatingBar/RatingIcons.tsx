import { describeTier } from './describeTier';

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

const DIAMOND_PATH = 'M12 22 L2 12 L6.5 7 L17.5 7 L22 12 Z';
const GEMSTONE_PATH = 'M12 1.5 L18 5.5 L18 18.5 L12 22.5 L6 18.5 L6 5.5 Z';
const BADGE_STROKE_COLOR = '#8f8f8f';

export const BADGE = ({ tier, filled = true }: { tier?: 1 | 2 | 3 | 4; filled?: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d={GEMSTONE_PATH}
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
    <path d={GEMSTONE_PATH} fill="currentColor" />
  </svg>
)

export const T4Icon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={DIAMOND_PATH} fill="currentColor" />
  </svg>
);

export const T3Icon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={DIAMOND_PATH} fill="currentColor" />
  </svg>
);

export const T2Icon = ({ clipId }: { clipId: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id={clipId}>
        <rect x="2" y="2" width="10" height="20" />
      </clipPath>
    </defs>
    <path d={DIAMOND_PATH} fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d={DIAMOND_PATH} fill="currentColor" clipPath={`url(#${clipId})`} />
  </svg>
);

export const T1Icon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={DIAMOND_PATH} fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);