// import { useId } from 'react';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { describeTier } from './describeTier';
import { ratingOptions, DIAMOND } from './RatingIcons';
import './RatingBar.css';


const RatingBar: React.FC = () => {
  const { scoreTier, setScoreTier } = useSearchFilters();
  // const halfDiamondClipId = useId().replace(/:/g, '-');
  return (
    <div className="rating-filter-panel__options">
      {ratingOptions.map((option) => {
        const selected = scoreTier === option.tier;

        return (
          <button
            key={option.tier}
            type="button"
            className={`rating-filter-panel__button ${selected ? 'is-selected' : ''}`}
            aria-pressed={selected}
            aria-label={`Tier ${option.tier} ${option.label}`}
            onClick={() => setScoreTier(selected ? 0 : option.tier)}
          >
            <span className={`rating-filter-panel__icon tier-${option.tier}`} aria-hidden="true">
              <DIAMOND text={describeTier(option.tier)} filled={selected} />
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default RatingBar;
