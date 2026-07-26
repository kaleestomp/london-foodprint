import { useMemo } from 'react';

import { useTileQuery } from '../../../../context/TileQueryContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import useRequestNearby from '../../../request/useRequestNearby/useRequestNearby';
import useRequestTiles from '../../../request/useRequestTiles/useRequestTiles';

interface UseRestaurantCountResult {
  count: number | null;
  isFetching: boolean;
}

/**
 * Calculates the total restaurant count based on viewport or search bubble.
 * - When search bubble is active: counts nearby places from the nearby search response
 * - When no bubble: sums tile density counts from map's tiles mode response
 */
const useRestaurantCount = (): UseRestaurantCountResult => {
  const { lastTilesParams } = useTileQuery();
  const {
    searchMask,
    effectiveCuisines,
    effectivePriceRanges,
    venueType,
    scoreBasis,
    scoreTier,
  } = useSearchFilters();

  const nearbyParams = useMemo(() => {
    if (!searchMask) return null;
    return {
      lat: searchMask.center.lat,
      lng: searchMask.center.lng,
      radius_m: searchMask.radiusM,
      cuisines: effectiveCuisines,
      venue_type: venueType ?? '',
      cost: effectivePriceRanges,
      score_basis: scoreBasis,
      score_tier: scoreTier,
    };
  }, [
    searchMask,
    effectiveCuisines,
    effectivePriceRanges,
    venueType,
    scoreBasis,
    scoreTier,
  ]);

  const {
    res: nearbyRes,
    isFetching: nearbyIsFetching,
  } = useRequestNearby(nearbyParams);
  const {
    res: tilesRes,
    isFetching: tilesIsFetching,
  } = useRequestTiles(lastTilesParams);

  const count = useMemo(() => {
    // If search bubble is active, count nearby places
    if (searchMask && nearbyRes) {
      return nearbyRes.data.length;
    }

    // If no bubble, sum counts from tiles mode
    if (!searchMask && tilesRes && tilesRes.mode === 'tiles') {
      return tilesRes.data.reduce((sum, tile) => sum + tile.count, 0);
    }

    return null;
  }, [searchMask, nearbyRes, tilesRes]);

  const isFetching = nearbyIsFetching || tilesIsFetching;

  return { count, isFetching };
};

export default useRestaurantCount;
