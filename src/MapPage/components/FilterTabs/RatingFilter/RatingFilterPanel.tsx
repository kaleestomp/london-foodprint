import { useId } from 'react';
import IconButton from '@mui/material/IconButton';

import Typography from '@mui/material/Typography';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import RatingSwitch from './Switch';

import { ratingOptions, T4Icon, T3Icon, T2Icon, T1Icon } from './RatingIcons';
import '../FilterTabPanel.css';
import './RatingFilterPanel.css';



const RatingFilterPanel: React.FC = () => {
  const { scoreTier, setScoreTier } = useSearchFilters();
  const halfDiamondClipId = useId().replace(/:/g, '-');
  const selectedOption = ratingOptions.find((option) => option.tier === scoreTier);

  return (
    <div className="filter-tab-panel rating-filter-panel">
      <div className="filter-tab-panel__header">
        <Typography className="filter-tab-panel__title">Ratings</Typography>
        <div className="filter-tab-panel__header-content">
          <RatingSwitch />
        </div>
      </div>
      <div className="filter-tab-panel__chips">
        <div className="rating-filter-panel__group">
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
                        <T1Icon />
                      ) : option.tier === 2 ? (
                        <T2Icon clipId={halfDiamondClipId} />
                      ) : option.tier === 3 ? (
                        <T3Icon />
                      ) : (
                        <T4Icon />
                      )}
                    </span>
                  </IconButton>
                </div>
              );
            })}
          </div>
          {selectedOption ? (
            <Typography className="rating-filter-panel__selection-note">
              {selectedOption.label}
            </Typography>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default RatingFilterPanel;
