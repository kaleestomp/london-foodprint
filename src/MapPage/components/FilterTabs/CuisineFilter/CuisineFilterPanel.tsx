import { useState, type FC } from 'react';

import IncludeExcludeSwitch from './CuisineSwitch/IncludeExcludeSwitch';
// import LocalGlobalSwitch from './CuisineSwitch/LocalGlobalSwitch';
import ChipsToBarsSwitch from './CuisineSwitch/ChipsToBarsSwitch';
import CuisineFilterChips from './CuisineChips/CuisineChips';
import CuisineChipsBar from './CuisineChips/CuisineChipsBar';
import getCuisineHistRequestParams from './Input/getCuisineHistRequestParams';
import useRequestCuisineHistogram from '../../../request/useRequestCuisineHistogram/useRequestCuisineHistogram';
import CuisineFilterResetButton from './ResetButton/ResetButton';
// import ChipsToBarsSwitch from './CuisineSwitch/ChipsToBarsSwitch';
import './CuisineFilterPanel.css';

const CuisineFilterPanel: FC = () => {
  const [showHistogram, setShowHistogram] = useState(false);
  const requestParams = getCuisineHistRequestParams();
  const { res } = useRequestCuisineHistogram(requestParams); 
  const cuisineData = res?.cuisine_histogram ?? [];
  return (
    <div className="cuisine-filter-panel">
      <div className="title-block">
        <CuisineFilterResetButton />
        <IncludeExcludeSwitch />
        {/* <LocalGlobalSwitch /> */}
        <ChipsToBarsSwitch
          checked={showHistogram}
          onChange={(event) => setShowHistogram(event.target.checked)}
        />

      </div>
      <div className="cuisine-filter-content">
        {showHistogram
          ? <CuisineChipsBar cuisineData={cuisineData} />
          : <CuisineFilterChips cuisineData={cuisineData} />}
      </div>
    </div>
  );
};

export default CuisineFilterPanel;
