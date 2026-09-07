import { useEffect, useMemo, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import type { FeatureCollection, Polygon } from 'geojson';

import { useCityContext } from '../../../../../context/CityContext';
import { createInvertedMaskGeoJSON } from '../../../../../utils/geo/createInvertedMask';
import applyMask from './applyMask';
import { MASK_LAYER_IDS } from './config';

export const useInvertedMaskLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
) => {

  const { cityBoundary } = useCityContext();
  const mask = useMemo(() => (
    cityBoundary ? createInvertedMaskGeoJSON(cityBoundary) : undefined
  ), [cityBoundary]);
  const currentMaskDataRef = useRef<FeatureCollection<Polygon> | undefined>(undefined);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mask) return;

    const setupMask = () => applyMask(map, mask, currentMaskDataRef);
    if (map.getStyle() && map.isStyleLoaded()) setupMask();

    map.on('load', setupMask);

    return () => {
      map.off('load', setupMask);
      if (!map.getStyle()) return;
      try {
        if (map.getLayer(MASK_LAYER_IDS.outlineLayerId)) map.removeLayer(MASK_LAYER_IDS.outlineLayerId);
        if (map.getLayer(MASK_LAYER_IDS.fillLayerId)) map.removeLayer(MASK_LAYER_IDS.fillLayerId);
        if (map.getSource(MASK_LAYER_IDS.sourceId)) map.removeSource(MASK_LAYER_IDS.sourceId);
      } catch {
        // Ignore cleanup errors during style teardown
      }
    };
  }, [mapRef, mask]);
};

export default useInvertedMaskLayer;
