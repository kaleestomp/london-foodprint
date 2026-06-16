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
        Pure
      </Typography>
      <MaterialUISwitch
        checkedThumbColor = {'#1565c0'}
        checkedTrackColor = {'#90caf9'}
        checked={ratingSelectionMode === 'tier_independent'}
        onChange={(event) => setRatingSelectionMode(event.target.checked ? 'tier_independent' : 'tier')}
        slotProps={{ input: { 'aria-label': 'Toggle tier rating mode' } }}
      />
      <Typography variant="caption" className="rating-filter-panel__mode-label rating-filter-panel__mode-label--right">
        Diversify
      </Typography>
    </div>
  );
};

export default RatingSwitch;
