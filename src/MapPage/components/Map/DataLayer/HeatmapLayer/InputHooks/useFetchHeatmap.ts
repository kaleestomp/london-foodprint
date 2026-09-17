import { useMemo } from 'react';

import { useSearchFilters } from '../../../../../../context/SearchFiltersContext';
import useRequestHeatmap, { type HeatmapParams } from '../../../../../request/useRequestHeatmap/useRequestHeatmap';
import heatmapGeojson from './heatmapGeojson';

import type GeoJSON from 'geojson';

const useFetchHeatmap = (
  enabled: boolean = true,
): { status: string; geojson: GeoJSON.FeatureCollection<GeoJSON.Point> } => {

  const { effectiveCuisines, effectivePriceRanges, venueType, scoreBasis, scoreTier, wilsonBasis } = useSearchFilters();
  const heatmapParams = useMemo<HeatmapParams | null>(() => {
    if (!enabled) return null;
    return {
      cuisines: effectiveCuisines,
      cost: effectivePriceRanges,
      venue_type: venueType ?? undefined,
      score_basis: scoreBasis,
      wilson_basis: wilsonBasis,
      score_tier: scoreTier,
    };
  }, [
    effectiveCuisines, effectivePriceRanges,
    venueType, scoreBasis, scoreTier, wilsonBasis, enabled,
  ]);
  const { status, res } = useRequestHeatmap(heatmapParams);
  
  const geojson = useMemo(() => {
    const coordinates = res?.data ?? [];
    // const filteredCoordinates = coordinates.filter(({ id }) => !maskIds.has(id));
    return heatmapGeojson(coordinates);
  }, [res]);
  
  return { status, geojson };
};

export default useFetchHeatmap;
