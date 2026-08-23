import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../../../context/AppUIContext';
import useFetchHeatmap from '../HeatmapLayer/InputHooks/useFetchHeatmap';
import { clusterCountLayer, clusterTextSize } from './clusterLayers';
import sortLayerOrder from './sortLayerOrder';

const SOURCE_ID = 'cluster-source';
// const CIRCLE_LAYER_ID = 'cluster-circles';
const COUNT_LAYER_ID = 'cluster-count';

const useClusterLayer = (
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
      if (currentMap.getLayer(COUNT_LAYER_ID)) currentMap.removeLayer(COUNT_LAYER_ID);
      if (currentMap.getSource(SOURCE_ID)) currentMap.removeSource(SOURCE_ID);
    };

    const updateTextSize = () => {
      if (!map.getLayer(COUNT_LAYER_ID)) return;

      const clusters = map.queryRenderedFeatures(undefined, { layers: [COUNT_LAYER_ID] });
      const highestCount = clusters.reduce((highest, feature) => {
        const count = Number(feature.properties?.point_count ?? 0);
        return Math.max(highest, count);
      }, 0);
      map.setLayoutProperty( COUNT_LAYER_ID, 'text-size', clusterTextSize(highestCount) );
    };

    const refreshLayer = () => {

      if (!enabled) return;
      if (!map.isStyleLoaded()) return;

      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(geojson);
      } else {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 16,
          clusterRadius: 50,
        });
      }

      if (!map.getLayer(COUNT_LAYER_ID)) {
        map.addLayer(clusterCountLayer(COUNT_LAYER_ID, SOURCE_ID));
      } else { updateTextSize() };
      sortLayerOrder(map, [COUNT_LAYER_ID]);
    };
    
    if (!enabled) removeLayer();
    map.on('idle', refreshLayer); 
    map.on('styledata', refreshLayer);
    map.on('pitch', refreshLayer);
    // Maplibre internal race bug: 
    // Heatmap layer need to load first for both to show
    // hence on 'idle' event instead of 'load' event

    map.on('zoom', updateTextSize);
    map.on('load', updateTextSize);

    return () => {
      map.off('idle', refreshLayer);
      map.off('styledata', refreshLayer);
      map.off('pitch', refreshLayer);

      map.off('zoom', updateTextSize);
      map.off('load', updateTextSize);
      removeLayer();
    };
  }, [geojson, enabled]);

};

export default useClusterLayer;
