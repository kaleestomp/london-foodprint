import DiamondIcon from '@mui/icons-material/Diamond';

type RatingOption = {
  tier: 1 | 2 | 3 | 4;
  label: string;
};

export const ratingOptions: RatingOption[] = [
  { tier: 1, label: '>50%' },
  { tier: 2, label: 'Top 20%' },
  { tier: 3, label: 'Top 10%' },
  { tier: 4, label: 'Top 5%' },
];

const MUI_DIAMOND_PATH = 'M12 2 1 12l11 10 11-10z';
const MUI_DIAMOND_PATH_2 = 'M12 2 1 12l11 10 11-10z';

export const RatingDiamondMuiIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <DiamondIcon />
  </svg>
);

export const RatingDiamondFullIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={MUI_DIAMOND_PATH} fill="currentColor" />
  </svg>
);

export const RatingDiamondHalfIcon = ({ clipId }: { clipId: string }) => (
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

export const RatingDiamondOutlineIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={MUI_DIAMOND_PATH} fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);