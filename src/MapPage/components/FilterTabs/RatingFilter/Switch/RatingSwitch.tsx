import Typography from '@mui/material/Typography';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import PrimarySwitch from '../../../../../components/Switch/PrimarySwitch.tsx';
import { DIVERSITY_THUMB_SVG, POPULARITY_THUMB_SVG } from './Icons';
import './Switch.css';

const RatingSwitch: React.FC = () => {
  
  const { scoreBasis, setScoreBasis } = useSearchFilters();
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScoreBasis(event.target.checked ? 2 : 0);
  };

  return (
    <div className="switch-row">
      <Typography variant="caption" className="switch-label left">
        <span className="switch-label-stack">Favour</span>
        <span className="switch-label-stack">Popularity</span>
      </Typography>
      <PrimarySwitch
        checked={scoreBasis === 2}
        onChange={handleChange}
        uncheckedThumbSvg={POPULARITY_THUMB_SVG}
        checkedThumbSvg={DIVERSITY_THUMB_SVG}
        uncheckedThumbColor="#5f5f5f"
        checkedThumbColor="#5f5f5f"
        uncheckedTrackColor="#e3e3e3"
        checkedTrackColor="#e3e3e3"
        slotProps={{ input: { 'aria-label': 'Toggle between popularity and independent rating basis' } }}
      />
      <Typography variant="caption" className="switch-label right">
        <span className="switch-label-stack">Favour</span>
        <span className="switch-label-stack">Diversity</span>
      </Typography>
    </div>
  );
};

export default RatingSwitch;
