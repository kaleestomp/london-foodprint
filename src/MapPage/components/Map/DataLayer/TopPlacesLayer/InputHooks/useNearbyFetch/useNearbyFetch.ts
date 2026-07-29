import { useMemo, useState, useEffect } from 'react';

import { useSearchFilters } from '../../../../../../../context/SearchFiltersContext';
import useRequestNearby from '../../../../../../request/useRequestNearby/useRequestNearby';
import { type TopPlaceItem } from '../../../../../../request/useRequestTopPlaces/request';
import selectTopPlaces from './selectTopPlaces';

type Props = {
  limit: number;
  enabled: boolean;
}
type Out = {
  nearbyTopPlaces: TopPlaceItem[];
}

const useNearbyFetch = ( { limit, enabled }: Props ): Out => {

  const { effectiveCuisines, effectivePriceRanges, venueType, scoreBasis, scoreTier, searchMask } = useSearchFilters();
  const nearbyParams = useMemo(() => {
    if (!enabled || !searchMask) return null;
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
    searchMask, effectiveCuisines, effectivePriceRanges,
    venueType, scoreBasis, scoreTier, enabled,
  ]);
  const { res } = useRequestNearby(nearbyParams);

  const [nearbyTopPlaces, setNearbyTopPlaces] = useState<TopPlaceItem[]>([]);
  useEffect(() => {
    if (!enabled || !searchMask || !res) {
      setNearbyTopPlaces([]);
      return;
    }
    const topPlaces = selectTopPlaces(res.data, limit);
    setNearbyTopPlaces(topPlaces);
  }, [ res, searchMask, limit, enabled ]);

  return { nearbyTopPlaces };
}



export default useNearbyFetch;
