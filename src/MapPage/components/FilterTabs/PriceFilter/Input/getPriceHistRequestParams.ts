import { useMemo } from 'react';

import {
  useSearchFilters,
} from '../../../../../context/SearchFiltersContext';
import { useViewportQuery } from '../../../../../context/ViewportQueryContext';


const getPriceHistRequestParams = () => {
  
  const { effectiveCuisines, venueType, scoreTier, scoreBasis, searchMask } = useSearchFilters();
  const { viewportParams } = useViewportQuery();

  const requestParams = useMemo(() => {
    if (searchMask) {
      return {
        scope: 'nearby' as const,
        lat: searchMask.center.lat,
        lng: searchMask.center.lng,
        radius_m: searchMask.radiusM,
        cuisines: effectiveCuisines,
        venue_type: venueType ?? '',
        score_basis: scoreBasis,
        score_tier: scoreTier,
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
      venue_type: venueType ?? '',
      score_basis: scoreBasis,
      score_tier: scoreTier,
    };
  }, [searchMask, viewportParams, effectiveCuisines, venueType, scoreBasis, scoreTier]);

  return requestParams;
};

export default getPriceHistRequestParams;

