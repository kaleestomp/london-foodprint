import { useMemo } from 'react';

import {
  useSearchFilters,
} from '../../../../../context/SearchFiltersContext';
import { useViewportQuery } from '../../../../../context/ViewportQueryContext';
import { buildSearchMaskParams } from '../../../../request/params/buildSearchMaskParams';


const getPriceHistRequestParams = () => {
  
  const { effectiveCuisines, venueType, scoreTier, scoreBasis, wilsonBasis, searchMask } = useSearchFilters();
  const { viewportParams } = useViewportQuery();

  const requestParams = useMemo(() => {
    if (searchMask) {
      return {
        scope: 'nearby' as const,
        ...buildSearchMaskParams(searchMask),
        cuisines: effectiveCuisines,
        venue_type: venueType ?? '',
        score_basis: scoreBasis,
        wilson_basis: wilsonBasis,
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
      wilson_basis: wilsonBasis,
      score_tier: scoreTier,
    };
  }, [searchMask, viewportParams, effectiveCuisines, venueType, scoreBasis, scoreTier, wilsonBasis]);

  return requestParams;
};

export default getPriceHistRequestParams;
