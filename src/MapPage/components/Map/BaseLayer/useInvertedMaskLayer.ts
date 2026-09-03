import { useEffect, useMemo, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import type { FeatureCollection, Polygon } from 'geojson';
import { useCityContext } from '../../../../context/CityContext';
import { createInvertedMaskGeoJSON } from '../../../../utils/geo/createInvertedMask';

export interface UseInvertedMaskLayerOptions {
  maskData?: FeatureCollection<Polygon>;
  sourceId?: string;
  fillLayerId?: string;
  outlineLayerId?: string;
  fillColor?: string;
  fillOpacity?: number;
  showOutline?: boolean;
  lineColor?: string;
  lineWidth?: number;
  lineOpacity?: number;
  beforeId?: string;
}

const DEFAULT_SOURCE_ID = 'london-inverted-mask-source';
const DEFAULT_FILL_LAYER_ID = 'london-inverted-mask-fill';
const DEFAULT_OUTLINE_LAYER_ID = 'london-inverted-mask-outline';

export const useInvertedMaskLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  options: UseInvertedMaskLayerOptions = {}
) => {
  const { cityBoundary } = useCityContext();

  const generatedMask = useMemo(() => {
    return cityBoundary ? createInvertedMaskGeoJSON(cityBoundary) : undefined;
  }, [cityBoundary]);

  const {
    maskData = generatedMask,
    sourceId = DEFAULT_SOURCE_ID,
    fillLayerId = DEFAULT_FILL_LAYER_ID,
    outlineLayerId = DEFAULT_OUTLINE_LAYER_ID,
    fillColor = '#e0e0e0',
    fillOpacity = 1,
    showOutline = false,
    lineColor = '#3b82f6',
    lineWidth = 1.5,
    lineOpacity = 0.8,
    beforeId
  } = options;

  const currentMaskDataRef = useRef<FeatureCollection<Polygon> | undefined>(undefined);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !maskData) return;

    const setupMask = () => {
      if (!map.getStyle() || !map.isStyleLoaded()) return;

      const layerExists = Boolean(map.getLayer(fillLayerId));
      const dataUnchanged = currentMaskDataRef.current === maskData;

      // If the layer is already set up and data hasn't changed, no work is needed
      if (layerExists && dataUnchanged) {
        return;
      }

      let existingSource = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;

      // Add or update source
      if (!existingSource) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: maskData,
        });
        currentMaskDataRef.current = maskData;
      } else if (!dataUnchanged) {
        existingSource.setData(maskData);
        currentMaskDataRef.current = maskData;
      }

      // Add fill layer above all basemap layers/labels if not present
      if (!map.getLayer(fillLayerId)) {
        map.addLayer(
          {
            id: fillLayerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': fillColor,
              'fill-opacity': fillOpacity,
            },
          },
          beforeId // Omitted/undefined appends layer to the top (above all basemap labels)
        );
      } else {
        map.setPaintProperty(fillLayerId, 'fill-color', fillColor);
        map.setPaintProperty(fillLayerId, 'fill-opacity', fillOpacity);
      }

      // Add or remove outline layer
      if (showOutline) {
        if (!map.getLayer(outlineLayerId)) {
          map.addLayer({
            id: outlineLayerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': lineColor,
              'line-width': lineWidth,
              'line-opacity': lineOpacity,
            },
          });
        } else {
          map.setPaintProperty(outlineLayerId, 'line-color', lineColor);
          map.setPaintProperty(outlineLayerId, 'line-width', lineWidth);
          map.setPaintProperty(outlineLayerId, 'line-opacity', lineOpacity);
        }
      } else if (map.getLayer(outlineLayerId)) {
        map.removeLayer(outlineLayerId);
      }
    };

    if (map.getStyle() && map.isStyleLoaded()) {
      setupMask();
    }

    const handleStyleLoad = () => {
      setupMask();
    };

    map.on('style.load', handleStyleLoad);
    map.on('styledata', setupMask);

    return () => {
      map.off('style.load', handleStyleLoad);
      map.off('styledata', setupMask);
      if (!map.getStyle()) return;
      try {
        if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // Ignore cleanup errors during style teardown
      }
    };
  }, [
    mapRef,
    maskData,
    sourceId,
    fillLayerId,
    outlineLayerId,
    fillColor,
    fillOpacity,
    showOutline,
    lineColor,
    lineWidth,
    lineOpacity,
    beforeId,
  ]);
};

export default useInvertedMaskLayer;
