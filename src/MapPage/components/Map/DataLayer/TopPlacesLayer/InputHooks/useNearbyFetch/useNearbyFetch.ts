import { useMemo, useState, useEffect } from 'react';

import { useSearchFilters } from '../../../../../../../context/SearchFiltersContext';
import { type TopPlaceItem } from '../../../../../../request/useRequestTopPlaces/request';
import useRequestTopPlaces, { type TopPlacesParams } from '../../../../../../request/useRequestTopPlaces/useRequestTopPlaces';

type Props = {
  limit: number;
  enabled?: boolean;
}
type Out = {
  nearbyTopPlaces: TopPlaceItem[];
}

const useNearbyFetch = ( { limit, enabled = true }: Props ): Out => {

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
  const { res } = useRequestTopPlaces(radiusTopPlacesParams, { debounceMs: 0 });

  const [nearbyTopPlaces, setNearbyTopPlaces] = useState<TopPlaceItem[]>([]);
  useEffect(() => {
    if (!enabled || !searchMask || !res) {
      setNearbyTopPlaces([]);
      return;
    }
    setNearbyTopPlaces(res.data);
  }, [res, searchMask, enabled]);

  return { nearbyTopPlaces };
}



export default useNearbyFetch;
