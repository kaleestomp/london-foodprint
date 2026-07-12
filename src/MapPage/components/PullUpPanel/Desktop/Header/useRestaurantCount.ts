import { useMemo } from 'react';

import { useTileQuery } from '../../../../../context/TileQueryContext';
import { useSearchFilters } from '../../../../../context/SearchFiltersContext';

interface UseRestaurantCountResult {
  count: number | null;
  isLoading: boolean;
}

/**
 * Calculates the total restaurant count based on viewport or search bubble.
 * - When search bubble is active: counts nearby places from the nearby search response
 * - When no bubble: sums tile density counts from map's tiles mode response
 */
const useRestaurantCount = (): UseRestaurantCountResult => {
  const { lastTilesResponse, lastNearbyResponse } = useTileQuery();
  const { searchMask } = useSearchFilters();

  const count = useMemo(() => {
    // If search bubble is active, count nearby places
    if (searchMask && lastNearbyResponse) {
      return lastNearbyResponse.data.length;
    }

    // If no bubble, sum counts from tiles mode
    if (!searchMask && lastTilesResponse && lastTilesResponse.mode === 'tiles') {
      return lastTilesResponse.data.reduce((sum, tile) => sum + tile.count, 0);
    }

    return null;
  }, [searchMask, lastTilesResponse, lastNearbyResponse]);

  // isLoading is determined by tile/nearby layer loading state
  // (we don't track separate loading state here since we use already-fetched data)
  const isLoading = false;

  return { count, isLoading };
};

export default useRestaurantCount;
