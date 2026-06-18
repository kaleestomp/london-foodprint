import { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import {
  PRICE_RANGE_FILTER_OPTIONS,
  useSearchFilters,
} from '../../../../../context/SearchFiltersContext';
import './SelectedPriceRangeLabel.css';

const formatPriceLabel = (label: string) => {
  if (label.startsWith('<')) return `<£${label.slice(1)}`;
  return `£${label}`;
};

const formatStartLabel = (label: string) => label.replace('<', '').replace('+', '');

const SelectedPriceRangeLabel: React.FC = () => {
  const { priceRangeInterval } = useSearchFilters();

  const selectedRangeText = useMemo(() => {
    const maxIndex = PRICE_RANGE_FILTER_OPTIONS.length - 1;
    const [startIndex, endIndex] = priceRangeInterval ?? [0, maxIndex];
    const startLabel = PRICE_RANGE_FILTER_OPTIONS[startIndex] ?? PRICE_RANGE_FILTER_OPTIONS[0];
    const endLabel = PRICE_RANGE_FILTER_OPTIONS[endIndex] ?? PRICE_RANGE_FILTER_OPTIONS[maxIndex];

    return endLabel.startsWith('<')
      ? `<£${formatStartLabel(endLabel)}`
      : `£${formatStartLabel(startLabel)} - ${formatPriceLabel(endLabel)}`;
  }, [priceRangeInterval]);

  return (
    <div>
      <Typography variant="caption" className="selected-price-range-label">
        Budget:
      </Typography>
      <Typography variant="h5" className="selected-price-range-label">
        {selectedRangeText}
      </Typography>
    </div>
  );
};

export default SelectedPriceRangeLabel;
