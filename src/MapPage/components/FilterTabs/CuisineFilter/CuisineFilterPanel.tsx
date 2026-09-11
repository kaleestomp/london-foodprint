import type { FC } from 'react';

import IncludeExcludeSwitch from './CuisineSwitch/IncludeExcludeSwitch';
import LocalGlobalSwitch from './CuisineSwitch/LocalGlobalSwitch';
import CuisineFilterChips from './CuisineChips/CuisineChips';
import getCuisineHistRequestParams from './Input/getCuisineHistRequestParams';
import useRequestCuisineHistogram from '../../../request/useRequestCuisineHistogram/useRequestCuisineHistogram';
import CuisineFilterResetButton from './ResetButton/ResetButton';
import ChipsToBarsSwitch from './CuisineSwitch/ChipsToBarsSwitch';
import './CuisineFilterPanel.css';

const CuisineFilterPanel: FC = () => {
  const requestParams = getCuisineHistRequestParams();
  const { res } = useRequestCuisineHistogram(requestParams); 
  const cuisineData = res?.cuisine_histogram ?? [];
  return (
    <div className="cuisine-filter-panel">
      <div className="title-block">
        <CuisineFilterResetButton />
        <IncludeExcludeSwitch />
        <LocalGlobalSwitch />
        <ChipsToBarsSwitch />

      </div>
      <div className="cuisine-filter-content">
        <CuisineFilterChips cuisineData={cuisineData} />
      </div>
    </div>
  );
};

export default CuisineFilterPanel;
