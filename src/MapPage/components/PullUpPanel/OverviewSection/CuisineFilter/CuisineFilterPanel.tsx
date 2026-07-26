import type { FC } from 'react';

import CuisineIncludeSwitch from './CuisineIncludeSwitch/CuisineIncludeSwitch';
import CuisineFilterChips from './Chips/Chips';
import getCuisineHistRequestParams from './Input/getCuisineHistRequestParams';
import useRequestCuisineHistogram from '../../../../request/useRequestCuisineHistogram/useRequestCuisineHistogram';
import './CuisineFilterPanel.css';

const CuisineFilterPanel: FC = () => {
  const requestParams = getCuisineHistRequestParams();
  const { res } = useRequestCuisineHistogram(requestParams); 
  const cuisineData = res?.cuisine_histogram ?? [];
  // const cuisineTitle = cuisineData.length > 0 ? `Cuisines × ${cuisineData.length}` : 'Cuisines';
  return (
    <div className="cuisine-filter-panel">
      <div className="title-block">
        <CuisineIncludeSwitch />
        {/* <div className="left">{cuisineTitle}</div> */}
      </div>
      <div className="cuisine-filter-content">
        
        <CuisineFilterChips cuisineData={cuisineData} />
      </div>
    </div>
  );
};

export default CuisineFilterPanel;
