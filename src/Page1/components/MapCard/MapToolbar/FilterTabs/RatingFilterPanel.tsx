import { useId } from 'react';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import FilterTabPanel from './FilterTabPanel';
import './RatingFilterPanel.css';

type RatingOption = {
  tier: 2 | 3 | 4;
  label: string;
};

const RatingDiamondFullIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 2L22 12L12 22L2 12Z" fill="currentColor" />
  </svg>
);

const RatingDiamondHalfIcon = ({ clipId }: { clipId: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id={clipId}>
        <rect x="2" y="2" width="10" height="20" />
      </clipPath>
    </defs>
    <path d="M12 2L22 12L12 22L2 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 2L22 12L12 22L2 12Z" fill="currentColor" clipPath={`url(#${clipId})`} />
  </svg>
);

const RatingDiamondOutlineIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 2L22 12L12 22L2 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const ratingOptions: RatingOption[] = [
  { tier: 2, label: 'Abv Av' },
  { tier: 3, label: 'Hidden Gems' },
  { tier: 4, label: 'Polished Gems' },
];

const RatingFilterPanel: React.FC = () => {
  const { scoreTier, setScoreTier } = useSearchFilters();
  const halfDiamondClipId = useId().replace(/:/g, '-');

  return (
    <FilterTabPanel title="Ratings">
      <div className="rating-filter-panel__options">
        {ratingOptions.map((option) => {
          const selected = scoreTier === option.tier;

          return (
            <div key={option.tier} className="rating-filter-panel__option">
              <IconButton
                className={`rating-filter-panel__button ${selected ? 'is-selected' : ''}`}
                aria-pressed={selected}
                aria-label={`Tier ${option.tier} ${option.label}`}
                onClick={() => setScoreTier(selected ? 0 : option.tier)}
              >
                <span className="rating-filter-panel__icon" aria-hidden="true">
                  {option.tier === 2 ? (
                    <RatingDiamondOutlineIcon />
                  ) : option.tier === 3 ? (
                    <RatingDiamondHalfIcon clipId={halfDiamondClipId} />
                  ) : (
                    <RatingDiamondFullIcon />
                  )}
                </span>
              </IconButton>
              <Typography className="rating-filter-panel__label">
                {option.label}
              </Typography>
            </div>
          );
        })}
      </div>
    </FilterTabPanel>
  );
};

export default RatingFilterPanel;
