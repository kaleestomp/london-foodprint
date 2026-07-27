import { useMemo } from 'react';
import {
  PRICE_RANGE_FILTER_OPTIONS,
  useSearchFilters,
} from '../../../context/SearchFiltersContext';
import getPriceHistRequestParams from '../PullUpPanel/OverviewSection/PriceFilter/Input/getPriceHistRequestParams';
import useRequestPriceHistogram from '../../request/useRequestPriceHistogram/useRequestPriceHistogram';

const formatPriceLabel = (label: string) => {
  if (label.startsWith('<')) return `<${label.slice(1)}`; //£
  return `${label}`;
};
const formatStartLabel = (label: string) => label.replace('<', '').replace('+', '');

const getPriceRangeLabel = () => {

  // Get BBox based price data
  const priceRequestParams = getPriceHistRequestParams();
  const { res } = useRequestPriceHistogram(priceRequestParams);
  const priceData = res?.cost_histogram ?? [];

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
    const startLabel = priceRange[0] !== PRICE_RANGE_FILTER_OPTIONS[0] ? priceRange[0] : null;
    const endLabel = priceRange[priceRange.length - 1] ?? PRICE_RANGE_FILTER_OPTIONS[PRICE_RANGE_FILTER_OPTIONS.length - 1];
    if (endLabel.startsWith('<')) {
      return `<${formatStartLabel(endLabel)}`;
    } else {
      return startLabel
        ? `${formatStartLabel(startLabel)}-${formatPriceLabel(endLabel)}`
        : `~${formatPriceLabel(endLabel)}`;
    }
  }, [priceRange]);

  return priceRangeLabel;
};

export default getPriceRangeLabel;
