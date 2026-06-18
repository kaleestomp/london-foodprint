import Typography from '@mui/material/Typography';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import FilterTabPanel from '../FilterTabPanel';
import RatingBar from './RatingBar/RatingBar';
import RatingSwitch from './Switch/RatingSwitch';

import { ratingOptions } from './RatingBar/RatingIcons';
import './RatingFilterPanel.css';

const RatingFilterPanel: React.FC = () => {
  const { scoreTier } = useSearchFilters();
  const selectedOption = ratingOptions.find((option) => option.tier === scoreTier);

  return (
    <FilterTabPanel
      title="Ratings"
      className="rating-filter-panel"
      headerContent={<RatingSwitch />}
    >
      <div className="rating-filter-panel__content">
        <RatingBar />
        {selectedOption ? (
          <Typography className="rating-filter-panel__selection-note">
            {selectedOption.label}
          </Typography>
        ) : null}
      </div>
    </FilterTabPanel>
  );
};

export default RatingFilterPanel;
