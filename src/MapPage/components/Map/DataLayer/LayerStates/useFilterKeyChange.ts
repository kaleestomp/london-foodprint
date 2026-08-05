import { useRef, useMemo, useEffect } from 'react';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';

/**
 * Hook that owns a ref tracking the previous filter key and returns
 * whether the filter state has changed by computing a new key.
 */
const useFilterKeyChange = (): boolean => {

  const prevFilterKeyRef = useRef<string>('');
  
  const { cuisineSelectionMode, effectiveCuisines, venueType, effectivePriceRanges, scoreBasis, scoreTier } = useSearchFilters();
  const nextKey = useMemo(() => {
    return JSON.stringify({
      cuisineSelectionMode,
      cuisines: [...effectiveCuisines].sort((l, r) => l.localeCompare(r)),
      venueType: venueType ?? '',
      priceRanges: [...effectivePriceRanges],
      scoreBasis,
      scoreTier,
    });
  }, [cuisineSelectionMode, effectiveCuisines, venueType, effectivePriceRanges, scoreBasis, scoreTier]);

  const changed = prevFilterKeyRef.current !== nextKey;
  useEffect(() => {
    prevFilterKeyRef.current = nextKey;
  }, [nextKey]);
  
  return changed;
};

export default useFilterKeyChange;
