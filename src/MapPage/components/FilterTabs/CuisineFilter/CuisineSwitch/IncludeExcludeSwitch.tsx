import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import BaseSwtich from './BaseSwtich/BaseSwtich';
import './CuisineSwitch.css';


const IncludeExcludeSwitch: React.FC = () => {
  const {
    cuisineSelectionMode,
    setCuisineSelectionMode,
  } = useSearchFilters();

  const includeMode = cuisineSelectionMode === 'include';
  return (
    <div className="switch-row">
      <BaseSwtich
        leftLabel="Include"
        rightLabel="Exclude"
        checked={!includeMode}
        onChange={(event) => setCuisineSelectionMode(event.target.checked ? 'exclude' : 'include')}
        slotProps={{ input: { 'aria-label': 'Cuisine include or exclude mode' } }}
      />
    </div>
  );
};

export default IncludeExcludeSwitch;
