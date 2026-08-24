import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../../../context/AppUIContext';
import useFetchHeatmap from './InputHooks/useFetchHeatmap';
import heatmapLayer from './heatmapLayer';
import sortLayerOrder from './sortLayerOrder';

const SOURCE_ID = 'heatmap-source';
const LAYER_ID = 'heatmap-layer';

const useHeatmapLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
): void => {

  const { heatmapEnabled: enabled } = useAppUI();
  const { geojson } = useFetchHeatmap(enabled);
  
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const removeLayer = () => {
      const currentMap = mapRef.current;
      if (!currentMap) return;
      if (currentMap.getLayer(LAYER_ID)) currentMap.removeLayer(LAYER_ID);
      if (currentMap.getSource(SOURCE_ID)) currentMap.removeSource(SOURCE_ID);
    };

    const refreshLayer = () => {
      
      if (!enabled || !map.isStyleLoaded()) return;

      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(geojson);
      } else {
        map.addSource(SOURCE_ID, { 
          type: 'geojson', 
          data: geojson 
        });
      }

      if (!map.getLayer(LAYER_ID)) 
        map.addLayer(heatmapLayer(LAYER_ID, SOURCE_ID));
      sortLayerOrder(map, LAYER_ID);
    };

    if (!enabled) removeLayer();
    map.on('idle', refreshLayer);
    map.on('styledata', refreshLayer);
    map.on('pitch', refreshLayer);

    return () => {
      map.off('idle', refreshLayer);
      map.off('styledata', refreshLayer);
      map.off('pitch', refreshLayer);
      removeLayer();
    };
  }, [enabled, mapRef, geojson]);

};

export default useHeatmapLayer;