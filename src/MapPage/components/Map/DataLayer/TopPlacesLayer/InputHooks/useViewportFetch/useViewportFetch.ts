import { useMemo } from 'react';
import type maplibregl from 'maplibre-gl';

import { useSearchFilters } from '../../../../../../../context/SearchFiltersContext';
import { type TopPlaceItem } from '../../../../../../request/useRequestTopPlaces/request';
import useRequestTopPlaces, { type TopPlacesParams } from '../../../../../../request/useRequestTopPlaces/useRequestTopPlaces';
import useTopPlacesViewport from './useTopPlacesViewport';
// import useDebugViewportRect from './useDebugViewportRect';


const useViewportFetch = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  limit: number = 10,
  enabled: boolean = true,
): {
  viewportTopPlaces: TopPlaceItem[];
} => {

  const { effectiveCuisines, effectivePriceRanges, venueType, scoreBasis, scoreTier } = useSearchFilters();
  const viewportParams = useTopPlacesViewport(mapRef, enabled);
  // useDebugViewportRect(mapRef, viewportParams, enabled);
  const topPlacesParams = useMemo<TopPlacesParams | null>(() => {
    if (!enabled || !viewportParams) return null;
    return {
      sw_lat: viewportParams.sw_lat,
      sw_lng: viewportParams.sw_lng,
      ne_lat: viewportParams.ne_lat,
      ne_lng: viewportParams.ne_lng,
      cuisines: effectiveCuisines,
      cost: effectivePriceRanges,
      venue_type: venueType ?? undefined,
      score_basis: scoreBasis,
      score_tier: scoreTier,
      limit,
    };
  }, [
    viewportParams, effectiveCuisines, effectivePriceRanges,
    venueType, scoreBasis, scoreTier, enabled,
  ]);
  const { res } = useRequestTopPlaces(topPlacesParams, { debounceMs: 0 });
  const viewportTopPlaces = enabled && res ? res.data : [];

  return { viewportTopPlaces };
}

export default useViewportFetch;
