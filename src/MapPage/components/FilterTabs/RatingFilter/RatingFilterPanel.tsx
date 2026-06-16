import { useId } from 'react';
import IconButton from '@mui/material/IconButton';

import Typography from '@mui/material/Typography';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import FilterTabPanel from '../FilterTabPanel';
import RatingSwitch from './Switch';

import { ratingOptions, RatingDiamondMuiIcon, RatingDiamondFullIcon, RatingDiamondHalfIcon, RatingDiamondOutlineIcon } from './RatingIcons';
import './RatingFilterPanel.css';



const RatingFilterPanel: React.FC = () => {
  const { scoreTier, setScoreTier } = useSearchFilters();
  const halfDiamondClipId = useId().replace(/:/g, '-');

  return (
    <FilterTabPanel
      title="Ratings"
      headerContent={<RatingSwitch />}
    >
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
                  {option.tier === 1 ? (
                    <RatingDiamondMuiIcon />
                  ) : option.tier === 2 ? (
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
