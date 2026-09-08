// import { useId } from 'react';

import { Fragment } from 'react';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import RatingPillButton from './RatingPillButton';
import { ratingOptions } from '../RatingIcons';
import './RatingBar.css';


const RatingBar: React.FC = () => {
  const { scoreTier, setScoreTier } = useSearchFilters();
  // const halfDiamondClipId = useId().replace(/:/g, '-');
  return (
    <div className="rating-filter-panel__options">
      {ratingOptions.map((option, index) => {
        const selected = scoreTier === option.tier;
        const percentile = option.tier === 1 ? 50 : option.tier === 2 ? 25 : option.tier === 3 ? 10 : 5;

        return (
          <Fragment key={option.tier}>
            {index > 0 && <span className="rating-filter-pill-separator" aria-hidden="true" />}
            <RatingPillButton
              percentile={percentile}
              text="%"
              ariaLabel={`Tier ${option.tier} ${option.label}`}
              isActive={selected}
              onClick={() => setScoreTier(selected ? 0 : option.tier)}
            />
          </Fragment>
        );
      })}
    </div>
  );
};

export default RatingBar;
