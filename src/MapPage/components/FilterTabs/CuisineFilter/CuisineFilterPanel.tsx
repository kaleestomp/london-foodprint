import type L from 'leaflet';
import FilterTabPanel from '../FilterTabPanel';
import CuisineIncludeSwitch from './CuisineIncludeSwitch/CuisineIncludeSwitch';
import CuisineFilterChips from './Chips/Chips';
import './CuisineFilterPanel.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};

const CuisineFilterPanel: React.FC<Props> = ({ mapRef }) => {
  void mapRef;

  return (
    <FilterTabPanel
      title="Cuisine"
      className="cuisine-filter-panel"
      headerContent={(<CuisineIncludeSwitch />)}
    >
      <CuisineFilterChips />
    </FilterTabPanel>
  );
};

export default CuisineFilterPanel;
