import Chip from '@mui/material/Chip';
import {
  PRICE_RANGE_FILTER_OPTIONS,
  useSearchFilters,
} from '../../../../../context/SearchFiltersContext';
import FilterTabPanel from './FilterTabPanel';

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
    </FilterTabPanel>
  );
};

export default PriceFilterPanel;
