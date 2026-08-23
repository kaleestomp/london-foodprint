import { useMemo } from 'react';

import { useSearchFilters } from '../../../../../../context/SearchFiltersContext';
import useRequestHeatmap, { type HeatmapParams } from '../../../../../request/useRequestHeatmap/useRequestHeatmap';

const useFetchCoordinates = (
  enabled = true,
): void => {

  const { effectiveCuisines, effectivePriceRanges, venueType, scoreBasis, scoreTier } = useSearchFilters();
  const heatmapParams = useMemo<HeatmapParams | null>(() => {
      if (!enabled ) return null;
      return {
        cuisines: effectiveCuisines,
        cost: effectivePriceRanges,
        venue_type: venueType ?? undefined,
        score_basis: scoreBasis,
        score_tier: scoreTier,
      };
    }, [
      effectiveCuisines, effectivePriceRanges,
      venueType, scoreBasis, scoreTier, enabled,
    ]);
  const { res } = useRequestHeatmap(heatmapParams);
  console.log(res);
  
};

export default useFetchCoordinates;
