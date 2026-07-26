import { useSearchFilters } from '../../../../../../context/SearchFiltersContext';
import MaterialUISwitch from '../../../../../../components/Switch/MaterialUISwitchStyle2';
import './Switch.css';


const CuisineIncludeSwitch: React.FC = () => {
  const {
    cuisineSelectionMode,
    setCuisineSelectionMode,
  } = useSearchFilters();

  return (
    <div className="switch-row">
        Incl.
        <MaterialUISwitch
          checked={cuisineSelectionMode === 'exclude'}
          onChange={(event) => setCuisineSelectionMode(event.target.checked ? 'exclude' : 'include')}
          slotProps={{ input: { 'aria-label': 'Cuisine include or exclude mode' } }}
        />
        Excl.
    </div>
  );
};

export default CuisineIncludeSwitch;
