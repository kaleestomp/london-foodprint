import { useEffect, useRef } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../../../context/AppUIContext';
import useFetchHeatmap from './InputHooks/useFetchHeatmap';
import heatmapLayer from './heatmapLayer';
import sortLayerOrder from './sortLayerOrder';

const SOURCE_ID = 'heatmap-source';
const LAYER_ID = 'heatmap-layer';

const useHeatmapLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
): void => {

  const { heatmapEnabled: enabled } = useAppUI(); //markInitialLoadItemComplete
  const { geojson } = useFetchHeatmap(enabled);
  const latestGeojsonRef = useRef(geojson);
  const appliedGeojsonRef = useRef<typeof geojson | null>(null);

  useEffect(() => {
    latestGeojsonRef.current = geojson;
  }, [geojson]);
  
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const removeLayer = () => {
      const currentMap = mapRef.current;
      if (!currentMap) return;
      try {
        if (currentMap.getLayer(LAYER_ID)) currentMap.removeLayer(LAYER_ID);
        if (currentMap.getSource(SOURCE_ID)) currentMap.removeSource(SOURCE_ID);
      } catch {
        // Style already torn down (e.g. city switch) â€” nothing to remove
      }
    };

    // const maybeMarkInitialLoadComplete = () => {
    //   const source = map.getSource(SOURCE_ID);
    //   if (!source || !map.getLayer(LAYER_ID) || !map.isSourceLoaded(SOURCE_ID)) return;
    //   markInitialLoadItemComplete('heatmapLayer');
    // };

    const ensureLayer = () => {
      if (!map.isStyleLoaded()) return;
      if (!enabled) {
        removeLayer();
        return;
      }

      let source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (!source) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: latestGeojsonRef.current,
        });
        source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
        appliedGeojsonRef.current = null;
      }

      if (!map.getLayer(LAYER_ID)) {
        map.addLayer(heatmapLayer(LAYER_ID, SOURCE_ID));
      }
      if (source && appliedGeojsonRef.current !== latestGeojsonRef.current) {
        source.setData(latestGeojsonRef.current);
        appliedGeojsonRef.current = latestGeojsonRef.current;
      }
      sortLayerOrder(map, LAYER_ID);
    };

    if (!enabled) removeLayer();
    map.on('load', ensureLayer);
    map.on('styledata', ensureLayer);
    map.on('idle', ensureLayer);
    // map.on('sourcedata', maybeMarkInitialLoadComplete);

    ensureLayer();
    // maybeMarkInitialLoadComplete();

    return () => {
      map.off('load', ensureLayer);
      map.off('styledata', ensureLayer);
      map.off('idle', ensureLayer);
      // map.off('sourcedata', maybeMarkInitialLoadComplete);
      removeLayer();
      appliedGeojsonRef.current = null;
    };
  }, [enabled, mapRef ]); //markInitialLoadItemComplete

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !enabled || !map.isStyleLoaded()) return;

    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    source.setData(geojson);
    appliedGeojsonRef.current = geojson;
  }, [geojson, enabled, mapRef]); //markInitialLoadItemComplete

};

export default useHeatmapLayer;