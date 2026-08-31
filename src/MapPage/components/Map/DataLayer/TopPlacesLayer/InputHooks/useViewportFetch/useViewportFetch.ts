import { useMemo } from 'react';

import { useSearchFilters } from '../../../../../../../context/SearchFiltersContext';
import { useTileQuery } from '../../../../../../../context/TileQueryContext';
import { type TopPlaceItem } from '../../../../../../request/useRequestTopPlaces/request';
import useRequestTopPlaces, { type TopPlacesParams } from '../../../../../../request/useRequestTopPlaces/useRequestTopPlaces';
import resolveConstraint from './resolveConstraint';
import useMaskFilter from './useMaskFilter';

const useViewportFetch = (
  limit: number = 10,
  enabled: boolean = true,
): {
  viewportTopPlaces: TopPlaceItem[];
} => {

  const { effectiveCuisines, effectivePriceRanges, venueType, scoreBasis, scoreTier, searchMask } = useSearchFilters();
  const { viewportParams } = useTileQuery();
  const geoParams = resolveConstraint(viewportParams, searchMask);
  const topPlacesParams = useMemo<TopPlacesParams | null>(() => {
    if (!enabled || !geoParams) return null;
    return {
      sw_lat: geoParams.sw_lat,
      sw_lng: geoParams.sw_lng,
      ne_lat: geoParams.ne_lat,
      ne_lng: geoParams.ne_lng,
      cuisines: effectiveCuisines,
      cost: effectivePriceRanges,
      venue_type: venueType ?? undefined,
      score_basis: scoreBasis,
      score_tier: scoreTier,
      limit,
    };
  }, [
    geoParams, effectiveCuisines, effectivePriceRanges,
    venueType, scoreBasis, scoreTier, enabled,
  ]);
  
  const { res } = useRequestTopPlaces(topPlacesParams, { debounceMs: 0 });
  const viewportTopPlaces = enabled && res ? res.data : [];
  const masked = useMaskFilter(viewportTopPlaces, searchMask); 

  return { viewportTopPlaces: masked };
}

export default useViewportFetch;
