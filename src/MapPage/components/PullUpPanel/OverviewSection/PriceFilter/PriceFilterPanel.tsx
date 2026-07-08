import type L from 'leaflet';

import getPriceRangeLabel from './Title/getPriceRangeLabel';
import PriceChart from './PriceChart/PriceChart';
import PriceSlider from './Slider/PriceSlider';

import Typography from '@mui/material/Typography';
import './PriceFilterPanel.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};

const PriceFilterPanel: React.FC<Props> = ({ mapRef }) => {
  // const priceRangeLabel = getPriceRangeLabel();
  return (
    <div className="price-filter-panel">
      <Typography className="title-label">
        Budget
      </Typography>
      <div className="price-filter-content">
        <PriceChart mapRef={mapRef} />
        <PriceSlider />
      </div>
    </div>
  );
};

export default PriceFilterPanel;

