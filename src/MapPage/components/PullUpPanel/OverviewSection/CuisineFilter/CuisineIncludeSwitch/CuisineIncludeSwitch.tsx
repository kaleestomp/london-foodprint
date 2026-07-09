import { useSearchFilters } from '../../../../../../context/SearchFiltersContext';
import MaterialUISwitch from '../../../../../../components/Switch/MaterialUISwitch';
import './Switch.css';


const CuisineIncludeSwitch: React.FC = () => {
  const {
    cuisineSelectionMode,
    setCuisineSelectionMode,
  } = useSearchFilters();

  return (
    <div className="switch-row">
        <MaterialUISwitch
          checked={cuisineSelectionMode === 'exclude'}
          onChange={(event) => setCuisineSelectionMode(event.target.checked ? 'exclude' : 'include')}
          slotProps={{ input: { 'aria-label': 'Cuisine include or exclude mode' } }}
        />
    </div>
  );
};

export default CuisineIncludeSwitch;
