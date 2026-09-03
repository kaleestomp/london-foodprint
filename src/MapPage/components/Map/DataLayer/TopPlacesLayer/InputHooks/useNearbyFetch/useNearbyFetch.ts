import { useMemo, useState, useEffect } from 'react';

import { useSearchFilters } from '../../../../../../../context/SearchFiltersContext';
import { type TopPlaceItem } from '../../../../../../request/useRequestTopPlaces/request';
import useRequestTopPlaces, { type TopPlacesParams } from '../../../../../../request/useRequestTopPlaces/useRequestTopPlaces';

const useNearbyFetch = (
  limit: number,
  enabled?: boolean,
): TopPlaceItem[] => {

  const { effectiveCuisines, effectivePriceRanges, venueType, scoreBasis, scoreTier, searchMask } = useSearchFilters();
  const radiusTopPlacesParams = useMemo<TopPlacesParams | null>(() => {
    if (!enabled || !searchMask) return null;
    return {
      lat: searchMask.center.lat,
      lng: searchMask.center.lng,
      radius_m: searchMask.radiusM,
      cuisines: effectiveCuisines,
      venue_type: venueType ?? undefined,
      cost: effectivePriceRanges,
      score_basis: scoreBasis,
      score_tier: scoreTier,
      limit,
    };
  }, [
    searchMask, effectiveCuisines, effectivePriceRanges,
    venueType, scoreBasis, scoreTier, enabled, limit,
  ]);
  const { res, queryKey, responseKey } = useRequestTopPlaces(radiusTopPlacesParams, { debounceMs: 0 });

  const [nearbyTopPlaces, setNearbyTopPlaces] = useState<TopPlaceItem[]>([]);
  useEffect(() => {
    // IsPlaceholderData does not indicate 
    // whether the data matches the latest UNDEBOUNCED params
    if (!enabled || !searchMask || !res || responseKey !== queryKey) {
      setNearbyTopPlaces([]);
      return;
    }
    setNearbyTopPlaces(res.data);
  }, [res, queryKey, responseKey, searchMask, enabled]);

  return nearbyTopPlaces;
}



export default useNearbyFetch;
