import { useState } from 'react';
import type L from 'leaflet';

import FilterTabPanel from '../FilterTabPanel';
import SelectedPriceRangeLabel from './Title/SelectedPriceRangeLabel';
import LocalGlobalSwitch from './Switch/LocalGlobalSwitchV2';
import PriceChart from './PriceChart/PriceChart';
import PriceSlider from './Slider/PriceSlider';

import './PriceFilterPanel.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};

const PriceFilterPanel: React.FC<Props> = ({ mapRef }) => {

  const [isGlobal, setIsGlobal] = useState(false);

  return (
    <FilterTabPanel title="">
      <div className="price-filter-panel__content">
        <div className="title-row">
          <SelectedPriceRangeLabel />
          <LocalGlobalSwitch isGlobal={isGlobal} setIsGlobal={setIsGlobal} />
        </div>
        <PriceChart mapRef={mapRef} isGlobal={isGlobal} />
        <PriceSlider />
      </div>
    </FilterTabPanel>
  );
};

export default PriceFilterPanel;

