import Typography from '@mui/material/Typography';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import TemplateWrapper from '../TemplateWrapper/TemplateWrapper';
import RatingBar from './RatingBar/RatingBar';
import RatingSwitch from './Switch/RatingSwitch';

import { ratingOptions } from './RatingBar/RatingIcons';
import '../TemplateWrapper/TemplateWrapper.css';

const RatingFilterPanel: React.FC = () => {
  const { scoreTier } = useSearchFilters();
  const selectedOption = ratingOptions.find((option) => option.tier === scoreTier);

  return (
    <TemplateWrapper
      title="Ratings"
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
    </TemplateWrapper>
  );
};

export default RatingFilterPanel;
