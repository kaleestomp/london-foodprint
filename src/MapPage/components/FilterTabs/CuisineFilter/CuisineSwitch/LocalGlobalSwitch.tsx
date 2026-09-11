import LocationSearchingRoundedIcon from '@mui/icons-material/LocationSearchingRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import BaseSwtich from './BaseSwtich/BaseSwtich';
import './CuisineSwitch.css';


const LocalGlobalSwitch: React.FC = () => {

  const { isGlobal, setIsGlobal } = useSearchFilters();

  return (
    <div className="switch-row">
      <BaseSwtich
        leftIcon={<LocationSearchingRoundedIcon />}
        rightIcon={<PublicRoundedIcon />}
        leftLabel="Local"
        rightLabel="Global"
        checked={isGlobal}
        onChange={(event) => setIsGlobal(event.target.checked)}
        slotProps={{ input: { 'aria-label': 'Cuisine include or exclude mode' } }}
      />
    </div>
  );
};

export default LocalGlobalSwitch;
