import { useMemo } from 'react';

import { useSearchFilters } from '../../../../../../context/SearchFiltersContext';
import { useTileQuery } from '../../../../../../context/TileQueryContext';


const getCuisineHistRequestParams = () => {
  const {
    effectivePriceRanges,
    venueType,
    scoreTier,
    scoreBasis,
  } = useSearchFilters();
  const { viewportParams } = useTileQuery();

  const requestParams = useMemo(() => {
    if (!viewportParams) return null;
    return {
      scope: 'view' as const,
      sw_lat: viewportParams.sw_lat,
      sw_lng: viewportParams.sw_lng,
      ne_lat: viewportParams.ne_lat,
      ne_lng: viewportParams.ne_lng,
      cost: effectivePriceRanges,
      venue_type: venueType ?? '',
      score_basis: scoreBasis,
      score_tier: scoreTier,
    };
  }, [viewportParams, effectivePriceRanges, venueType, scoreBasis, scoreTier]);

  return requestParams;
};

export default getCuisineHistRequestParams;
