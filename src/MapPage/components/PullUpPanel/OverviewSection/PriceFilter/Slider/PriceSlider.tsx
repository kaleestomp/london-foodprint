import Slider from '@mui/material/Slider';

import {
  PRICE_RANGE_FILTER_OPTIONS,
  useSearchFilters,
} from '../../../../../../context/SearchFiltersContext';
import './PriceSlider.css';


const PriceSlider: React.FC = () => {

  const {
    priceRangeInterval,
    setPriceRangeInterval,
  } = useSearchFilters();

  const sliderMax = PRICE_RANGE_FILTER_OPTIONS.length - 1;
  const sliderValue = priceRangeInterval ?? [0, sliderMax];

  return (
    <div className="price-filter-panel__slider-wrap">
      <Slider
        aria-label="Price category interval"
        value={sliderValue}
        min={0}
        max={sliderMax}
        step={1}
        marks={PRICE_RANGE_FILTER_OPTIONS.map((label, value) => ({ value, label }))}
        valueLabelDisplay="off"
        onChange={(_, value) => {
          if (!Array.isArray(value)) return;
          const next: [number, number] = [Math.min(value[0], value[1]), Math.max(value[0], value[1])];
          if (next[0] === 0 && next[1] === sliderMax) {
            setPriceRangeInterval(null);
            return;
          }
          setPriceRangeInterval(next);
        }}
      />
    </div>
  );
};

export default PriceSlider;

