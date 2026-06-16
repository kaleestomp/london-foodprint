import Typography from '@mui/material/Typography';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import MaterialUISwitch from '../../../../components/Switch/MaterialUISwitch';
import './RatingFilterPanel.css';


const RatingSwitch: React.FC = () => {
  const {
    ratingSelectionMode,
    setRatingSelectionMode,
  } = useSearchFilters();

  return (
    <div className="rating-filter-panel__mode-row">
      <Typography variant="caption" className="rating-filter-panel__mode-label rating-filter-panel__mode-label--left">
        Tier
      </Typography>
      <MaterialUISwitch
        checked={ratingSelectionMode === 'tier_independent'}
        onChange={(event) => setRatingSelectionMode(event.target.checked ? 'tier_independent' : 'tier')}
        slotProps={{ input: { 'aria-label': 'Toggle tier rating mode' } }}
      />
      <Typography variant="caption" className="rating-filter-panel__mode-label rating-filter-panel__mode-label--right">
        Tier Indep.
      </Typography>
    </div>
  );
};

export default RatingSwitch;
