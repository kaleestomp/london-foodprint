import Typography from '@mui/material/Typography';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import PrimarySwitch from '../../../../../components/Switch/PrimarySwitch';
import './Switch.css';

const RatingSwitch: React.FC = () => {
  const { ratingSelectionMode, setRatingSelectionMode } = useSearchFilters();
  return (
    <div className="switch-row">
      <Typography variant="caption" className="switch-label left">
        Pro Popularity
      </Typography>
      <PrimarySwitch
        checked={ratingSelectionMode === 'tier_independent'}
        onChange={(event) => setRatingSelectionMode(event.target.checked ? 'tier_independent' : 'tier')}
        slotProps={{ input: { 'aria-label': 'Toggle between tier and tier-independent rating basis' } }}
      />
      <Typography variant="caption" className="switch-label right">
        Pro Diversity
      </Typography>
    </div>
  );
};

export default RatingSwitch;
