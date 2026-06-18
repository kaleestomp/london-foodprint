import Typography from '@mui/material/Typography';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import PrimarySwitch from '../../../../../components/Switch/PrimarySwitch';
import './Switch.css';

const RatingSwitch: React.FC = () => {
  
  const { scoreBasis, setScoreBasis } = useSearchFilters();
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScoreBasis(event.target.checked ? 2 : 0);
  };

  return (
    <div className="switch-row">
      <Typography variant="caption" className="switch-label left">
        Pro Popularity
      </Typography>
      <PrimarySwitch
        checked={scoreBasis === 2}
        onChange={handleChange}
        slotProps={{ input: { 'aria-label': 'Toggle between popularity and independent rating basis' } }}
      />
      <Typography variant="caption" className="switch-label right">
        Pro Diversity
      </Typography>
    </div>
  );
};

export default RatingSwitch;
