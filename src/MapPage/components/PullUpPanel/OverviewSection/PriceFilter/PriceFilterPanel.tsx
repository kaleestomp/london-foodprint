import type { FC } from 'react';

import PriceChart from './PriceChart/PriceChart';
import PriceSlider from './Slider/PriceSlider';
import getPriceHistRequestParams from './Input/getPriceHistRequestParams';
import useRequestPriceHistogram from '../../../../request/useRequestPriceHistogram/useRequestPriceHistogram';
import getPriceRangeLabel from './Title/getPriceRangeLabel';

import Typography from '@mui/material/Typography';
import './PriceFilterPanel.css';


const PriceFilterPanel: FC = () => {
  
  const requestParams = getPriceHistRequestParams();
  const { res } = useRequestPriceHistogram(requestParams);
  const priceData = res?.cost_histogram ?? [];

  const PriceRangeLabel = getPriceRangeLabel(priceData);

  return (
    <div className="price-filter-panel">
      <div className="title-block">
        {/* <div className="top">Budget</div> */}
        <div className="bottom">{PriceRangeLabel}</div>
      </div>
      <div className="price-filter-content">
        <PriceChart priceData={priceData} />
        <PriceSlider />
      </div>
    </div>
  );
};

export default PriceFilterPanel;

