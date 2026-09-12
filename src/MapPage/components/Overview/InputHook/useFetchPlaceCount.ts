import { useMemo, useState, useEffect } from 'react';

import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import { useViewportQuery } from '../../../../context/ViewportQueryContext';
import useRequestPlacesCount from '../../../request/useRequestPlacesCount/useRequestPlacesCount';

const useFetchPlaceCount = (): {
  count: number | null;
  tierRep: number | null;
  hasLoadedOnce: boolean;
  isFetching: boolean;
} => {
  const {
    effectiveCuisines,
    effectivePriceRanges,
    venueType,
    scoreBasis,
    scoreTier,
    searchMask,
  } = useSearchFilters();
  const { viewportParams } = useViewportQuery();

  const requestParams = useMemo(() => {
    if (searchMask) {
      return {
        scope: 'nearby' as const,
        lat: searchMask.center.lat,
        lng: searchMask.center.lng,
        radius_m: searchMask.radiusM,
        cuisines: effectiveCuisines,
        costs: effectivePriceRanges,
        venue_type: venueType ?? '',
        score_basis: scoreBasis,
        score_tier: scoreTier,
        requestTierRep: true,
      };
    }

    if (!viewportParams) return null;

    return {
      scope: 'view' as const,
      sw_lat: viewportParams.sw_lat,
      sw_lng: viewportParams.sw_lng,
      ne_lat: viewportParams.ne_lat,
      ne_lng: viewportParams.ne_lng,
      cuisines: effectiveCuisines,
      costs: effectivePriceRanges,
      venue_type: venueType ?? '',
      score_basis: scoreBasis,
      score_tier: scoreTier,
      requestTierRep: true,
    };
  }, [
    effectiveCuisines,
    effectivePriceRanges,
    venueType,
    scoreBasis,
    scoreTier,
    searchMask,
    viewportParams,
  ]);

  const { res, isFetching } = useRequestPlacesCount(requestParams);

  const [hasLoadedOnce, setHasLoadedOnce] = useState(res?.count !== null);
  useEffect(() => {
    if (res?.count !== null) {
      setHasLoadedOnce(true);
    }
  }, [res?.count]);

  return {
    count: res?.count ?? null,
    tierRep: res?.tierRep ?? null,
    hasLoadedOnce,
    isFetching,
  };
};

export default useFetchPlaceCount;
