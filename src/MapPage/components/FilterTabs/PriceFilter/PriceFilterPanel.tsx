import Chip from '@mui/material/Chip';
import {
  PRICE_RANGE_FILTER_OPTIONS,
  useSearchFilters,
} from '../../../../context/SearchFiltersContext';
import FilterTabPanel from '../FilterTabPanel';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

const PriceFilterPanel: React.FC = () => {
  const { priceRange, setPriceRange } = useSearchFilters();

  return (
    <FilterTabPanel title="Price Range">
      <Chip
        label="Any"
        clickable
        color={priceRange === null ? 'primary' : 'default'}
        variant={priceRange === null ? 'filled' : 'outlined'}
        onClick={() => setPriceRange(null)}
      />
      {PRICE_RANGE_FILTER_OPTIONS.map((price) => {
        const selected = priceRange === price;
        return (
          <Chip
            key={price}
            label={price}
            clickable
            color={selected ? 'primary' : 'default'}
            variant={selected ? 'filled' : 'outlined'}
            onClick={() => setPriceRange(selected ? null : price)}
          />
        );
      })}
      <div className="rating-filter-panel__sample-slider">
        <Typography className="rating-filter-panel__sample-slider-label">
          Sample slider
        </Typography>
        <Slider
          aria-label="Sample rating range slider"
          defaultValue={[1, 3]}
          min={0}
          max={4}
          step={1}
          marks
          valueLabelDisplay="auto"
        />
      </div>
    </FilterTabPanel>
  );
};

export default PriceFilterPanel;
