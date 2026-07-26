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


const getPriceRangeLabel = ( priceData: Array<{ cost: string; count: number }> ) => {

  const availableCategories = useMemo(() => {
    return PRICE_RANGE_FILTER_OPTIONS.filter((label) => {
      const entry = priceData.find((entry) => entry.cost === label);
      return entry && entry.count > 0;
    });
  }, [priceData]);

  const { priceRangeInterval } = useSearchFilters();
  const priceRange = useMemo(() => {
    if (!priceRangeInterval) return availableCategories;
    const selectedCategories = PRICE_RANGE_FILTER_OPTIONS.slice(priceRangeInterval[0], priceRangeInterval[1] + 1);
    return selectedCategories.filter((label) => availableCategories.includes(label));
  }, [availableCategories, priceRangeInterval]);


  const priceRangeLabel = useMemo(() => {
    if (priceRange.length === 0 || !priceRange) return 'N/A';
    if (priceRange.length === 1) return formatPriceLabel(priceRange[0]);

    const startLabel = priceRange[0] ?? PRICE_RANGE_FILTER_OPTIONS[0];
    const endLabel = priceRange[priceRange.length - 1] ?? PRICE_RANGE_FILTER_OPTIONS[PRICE_RANGE_FILTER_OPTIONS.length - 1];

    return endLabel.startsWith('<')
      ? `<£${formatStartLabel(endLabel)}`
      : `£${formatStartLabel(startLabel)} - ${formatPriceLabel(endLabel)}`;
  }, [priceRange]);

  return `${priceRangeLabel}`;
};

export default getPriceRangeLabel;
