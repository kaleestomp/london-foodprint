import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import StyledSwitch from './StyledSwitch';
import './Switch.css';
import Typography from '@mui/material/Typography';


const CuisineIncludeSwitch: React.FC = () => {
  const {
    cuisineSelectionMode,
    setCuisineSelectionMode,
  } = useSearchFilters();

  const includeMode = cuisineSelectionMode === 'include';
  return (
    <div className="switch-row">
      <Typography variant="caption" className="switch-label switch-label--left">
        Incl.
      </Typography>
      <StyledSwitch
        checked={!includeMode}
        onChange={(event) => setCuisineSelectionMode(event.target.checked ? 'exclude' : 'include')}
        slotProps={{ input: { 'aria-label': 'Cuisine include or exclude mode' } }}
      />
      <Typography variant="caption" className="switch-label switch-label--right">
        Excl.
      </Typography>
    </div>
  );
};

export default CuisineIncludeSwitch;
