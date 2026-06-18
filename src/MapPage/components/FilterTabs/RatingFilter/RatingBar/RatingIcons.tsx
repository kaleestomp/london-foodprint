type RatingOption = {
  tier: 1 | 2 | 3 | 4;
  label: string;
};

export const ratingOptions: RatingOption[] = [
  { tier: 1, label: 'Better than Average' },
  { tier: 2, label: 'Top 20% of London Establishments' },
  { tier: 3, label: 'Top 10% of London Establishments' },
  { tier: 4, label: 'Top 5% of London Establishments' },
];

const MUI_DIAMOND_PATH = 'M12 2 1 12l11 10 11-10z';
const MUI_DIAMOND_T4_PATH = 'M12.16 3h-.32L9.21 8.25h5.58zm4.3 5.25h5.16L19 3h-5.16zm4.92 1.5h-8.63V20.1zM11.25 20.1V9.75H2.62zM7.54 8.25 10.16 3H5L2.38 8.25z';
const DIAMOND_PATH = 'M12 22 L2 12 L6.5 7 L17.5 7 L22 12 Z';
const GEMSTONE_PATH = 'M12 1.5 L18 5.5 L18 18.5 L12 22.5 L6 18.5 L6 5.5 Z';

export const DIAMOND = ({ text, filled = true }: { text?: string | number; filled?: boolean }) => (
  <svg viewBox="0 2 24 24" aria-hidden="true" focusable="false">
    <path
      d={DIAMOND_PATH}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.25}
      strokeLinejoin="round"
    />
    {text !== undefined ? (
      <text
        x="12"
        y="12.4"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={filled ? "6.5" : "5.5"}
        fill={filled ? '#ffffff' : 'currentColor'}
      >
        <tspan fontWeight="500">{text}</tspan>
        <tspan fontSize={filled ? "3.6" : "3.6"} fontWeight="100">%</tspan>
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
    <path d={MUI_DIAMOND_T4_PATH} fill="currentColor" />
  </svg>
);

export const T3Icon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={MUI_DIAMOND_PATH} fill="currentColor" />
  </svg>
);

export const T2Icon = ({ clipId }: { clipId: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id={clipId}>
        <rect x="2" y="2" width="10" height="20" />
      </clipPath>
    </defs>
    <path d={MUI_DIAMOND_PATH} fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d={MUI_DIAMOND_PATH} fill="currentColor" clipPath={`url(#${clipId})`} />
  </svg>
);

export const T1Icon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={MUI_DIAMOND_PATH} fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);