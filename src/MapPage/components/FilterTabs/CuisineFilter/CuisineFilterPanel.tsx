import FilterTabPanel from '../FilterTabPanel';
import CuisineIncludeSwitch from './Switch';
import CuisineFilterChips from './Chips';
import './CuisineFilterPanel.css';

const CuisineFilterPanel: React.FC = () => {
  return (
    <FilterTabPanel
      title="Cuisine"
      headerContent={<CuisineIncludeSwitch />}
    >
      <CuisineFilterChips />
    </FilterTabPanel>
  );
};

export default CuisineFilterPanel;
