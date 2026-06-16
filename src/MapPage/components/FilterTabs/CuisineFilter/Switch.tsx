import Typography from '@mui/material/Typography';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import MaterialUISwitch from '../../../../components/Switch/MaterialUISwitch';
import './CuisineFilterPanel.css';


const CuisineIncludeSwitch: React.FC = () => {
  const {
    cuisineSelectionMode,
    setCuisineSelectionMode,
  } = useSearchFilters();

  return (
    <div className="cuisine-filter-panel__mode-row">
        <Typography variant="caption" className="cuisine-filter-panel__mode-label cuisine-filter-panel__mode-label--left">
        Incl.
        </Typography>
        <MaterialUISwitch
        checked={cuisineSelectionMode === 'exclude'}
        onChange={(event) => setCuisineSelectionMode(event.target.checked ? 'exclude' : 'include')}
        slotProps={{ input: { 'aria-label': 'Cuisine include or exclude mode' } }}
        />
        <Typography variant="caption" className="cuisine-filter-panel__mode-label cuisine-filter-panel__mode-label--right">
        Excl.
        </Typography>
    </div>
  );
};

export default CuisineIncludeSwitch;
