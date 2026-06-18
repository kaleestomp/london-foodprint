import { useRef } from 'react';
import { type ScoreBasis, type ScoreTierFilterOption, type CuisineSelectionMode, type CuisineFilterOption, type VenueTypeFilterOption, type PriceRangeFilterOption } from '../../../../../context/SearchFiltersContext';

/**
 * Hook that owns a ref tracking the previous filter key and returns
 * whether the filter state has changed by computing a new key.
 */
const useBuildFilterKey = () => {
  const prevFilterKeyRef = useRef<string>('');

  const buildFilterKey = (
    cuisineSelectionMode: CuisineSelectionMode,
    effectiveCuisines: CuisineFilterOption[],
    venueType: VenueTypeFilterOption | null,
    effectivePriceRanges: PriceRangeFilterOption[],
    scoreBasis: ScoreBasis,
    scoreTier: ScoreTierFilterOption,
  ): { key: string; changed: boolean } => {
    const nextKey = JSON.stringify({
      cuisineSelectionMode,
      cuisines: [...effectiveCuisines].sort((l, r) => l.localeCompare(r)),
      venueType: venueType ?? '',
      priceRanges: [...effectivePriceRanges],
      scoreBasis,
      scoreTier,
    });

    const changed = prevFilterKeyRef.current !== nextKey;
    prevFilterKeyRef.current = nextKey;

    return { key: nextKey, changed };
  };

  return buildFilterKey;
};

export default useBuildFilterKey;
