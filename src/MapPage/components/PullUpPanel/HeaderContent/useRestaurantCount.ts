import { useMemo } from 'react';

import {
  PRICE_RANGE_FILTER_OPTIONS,
  useSearchFilters,
} from '../../../../context/SearchFiltersContext';
import useRequestPriceHistogram from '../../../request/useRequestPriceHistogram/useRequestPriceHistogram';
import getPriceHistRequestParams from '../../FilterTabs/PriceFilter/Input/getPriceHistRequestParams';

interface UseRestaurantCountResult {
  count: number | null;
  isFetching: boolean;
}

const useRestaurantCount = (): UseRestaurantCountResult => {
  const { priceRangeInterval } = useSearchFilters();
  const requestParams = getPriceHistRequestParams();
  const { res: priceHistogramRes, isFetching } = useRequestPriceHistogram(requestParams);

  const count = useMemo(() => {
    if (!priceHistogramRes) {
      return null;
    }

    const countByPrice = new Map<string, number>();
    for (const entry of priceHistogramRes.cost_histogram) {
      countByPrice.set(entry.cost, entry.count);
    }

    const [start, end] = priceRangeInterval ?? [0, PRICE_RANGE_FILTER_OPTIONS.length - 1];
    return PRICE_RANGE_FILTER_OPTIONS
      .slice(start, end + 1)
      .reduce((sum, price) => sum + (countByPrice.get(price) ?? 0), 0);
  }, [priceHistogramRes, priceRangeInterval]);

  return { count, isFetching };
};

export default useRestaurantCount;
