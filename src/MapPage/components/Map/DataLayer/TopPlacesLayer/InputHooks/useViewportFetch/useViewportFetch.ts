import { useMemo } from 'react';
import L from 'leaflet';

import { useSearchFilters } from '../../../../../../../context/SearchFiltersContext';
import { type TopPlaceItem } from '../../../../../../request/useRequestTopPlaces/request';
import useRequestTopPlaces, { type TopPlacesParams } from '../../../../../../request/useRequestTopPlaces/useRequestTopPlaces';
import useTopPlacesViewport from './useTopPlacesViewport';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
  limit?: number;
  enabled: boolean;
};
type Out = {
  viewportTopPlaces: TopPlaceItem[];
}

const useViewportFetch = ({ mapRef, limit = 10, enabled }: Props): Out => {

  const { effectiveCuisines, effectivePriceRanges, venueType, scoreBasis, scoreTier } = useSearchFilters();
  const viewportParams = useTopPlacesViewport(mapRef, enabled);
  const topPlacesParams = useMemo<TopPlacesParams | null>(() => {
    if (!enabled || !viewportParams) return null;
    return {
      sw_lat: viewportParams.sw_lat,
      sw_lng: viewportParams.sw_lng,
      ne_lat: viewportParams.ne_lat,
      ne_lng: viewportParams.ne_lng,
      res: viewportParams.res,
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
