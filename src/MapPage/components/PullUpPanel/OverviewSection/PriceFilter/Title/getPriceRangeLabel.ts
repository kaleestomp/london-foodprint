import { useMemo } from 'react';
import {
  PRICE_RANGE_FILTER_OPTIONS,
  useSearchFilters,
} from '../../../../../../context/SearchFiltersContext';

const formatPriceLabel = (label: string) => {
  if (label.startsWith('<')) return `<£${label.slice(1)}`;
  return `£${label}`;
};

const formatStartLabel = (label: string) => label.replace('<', '').replace('+', '');

const getPriceRangeLabel = () => {
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

  return selectedRangeText;
};

export default getPriceRangeLabel;
