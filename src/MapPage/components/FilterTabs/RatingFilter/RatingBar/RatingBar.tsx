// import { useId } from 'react';

import IconButton from '@mui/material/IconButton';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { ratingOptions, BADGE } from './RatingIcons';
import './RatingBar.css';


const RatingBar: React.FC = () => {
  const { scoreTier, setScoreTier } = useSearchFilters();
  // const halfDiamondClipId = useId().replace(/:/g, '-');
  return (
    <div className="rating-filter-panel__options">
      {ratingOptions.map((option) => {
        const selected = scoreTier === option.tier;

        return (
          <IconButton
            key={option.tier}
            className={`rating-filter-button tier-${option.tier} ${selected ? 'rating-filter-button-active' : ''}`}
            aria-pressed={selected}
            aria-label={`Tier ${option.tier} ${option.label}`}
            onClick={() => setScoreTier(selected ? 0 : option.tier)}
          >
            <span className={`rating-filter-button-icon tier-${option.tier}`} aria-hidden="true">
              <BADGE tier={option.tier} filled={selected} />
            </span>
          </IconButton>
        );
      })}
    </div>
  );
};

export default RatingBar;
