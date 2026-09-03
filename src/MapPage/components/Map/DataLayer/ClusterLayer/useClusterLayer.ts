import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../../../context/AppUIContext';
import { usePlaceSelection } from '../../../../../context/PlaceSelectionContext';
import useFetchHeatmap from '../HeatmapLayer/InputHooks/useFetchHeatmap';
import { clusterCountLayer, unclusteredPointHighlightLayer, unclusteredPointHitLayer, unclusteredPointLayer, unclusteredPointShadowLayer } from './clusterLayers';
import sortLayerOrder from './sortLayerOrder';
import updateTextSize from './updateTextSize';
import useHandleSelectedMarker from './useHandleSelectedMarker/useHandleSelectedMarker';

import '../TopPlacesLayer/syncMarkers/markers/TopPlacePin.css';

const SOURCE_ID = 'cluster-source';
const PLACES_SHADOW_LAYER_ID = 'unclustered-point-shadow';
const PLACES_LAYER_ID = 'unclustered-point';
const PLACES_HIGHLIGHT_LAYER_ID = 'unclustered-point-highlight';
const PLACES_HIT_LAYER_ID = 'unclustered-point-hit-area';
const COUNT_LAYER_ID = 'cluster-count';

// Hide only the currently list-owned place from singleton cluster circles.
// We match by properties.id because place ids are expected to be stable there.
const getSingletonFilter = (suppressedPlaceId: string | null): maplibregl.FilterSpecification => {
  if (!suppressedPlaceId) {
    return ['!', ['has', 'point_count']];
  }

  return [
    'all',
    ['!', ['has', 'point_count']],
    ['!=', ['to-string', ['get', 'id']], suppressedPlaceId],
  ];
};

const useClusterLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  enabled: boolean = true,
) => {

  const { mapMode } = useAppUI();
  const { geojson } = useFetchHeatmap(enabled);
  const { selectedPlaceId, selectedLayer } = usePlaceSelection();
  const suppressedSingletonId = (selectedLayer === 'list')
    ? selectedPlaceId
    : null;

  useHandleSelectedMarker(mapRef, PLACES_HIT_LAYER_ID);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const removeLayer = () => {
      const currentMap = mapRef.current;
      if (!currentMap) return;
      if (currentMap.getLayer(COUNT_LAYER_ID)) currentMap.removeLayer(COUNT_LAYER_ID);
      if (currentMap.getLayer(PLACES_HIT_LAYER_ID)) currentMap.removeLayer(PLACES_HIT_LAYER_ID);
      if (currentMap.getLayer(PLACES_HIGHLIGHT_LAYER_ID)) currentMap.removeLayer(PLACES_HIGHLIGHT_LAYER_ID);
      if (currentMap.getLayer(PLACES_LAYER_ID)) currentMap.removeLayer(PLACES_LAYER_ID);
      if (currentMap.getLayer(PLACES_SHADOW_LAYER_ID)) currentMap.removeLayer(PLACES_SHADOW_LAYER_ID);
      if (currentMap.getSource(SOURCE_ID)) currentMap.removeSource(SOURCE_ID);
    };
    
    const handleStateChange = () => {
      updateTextSize(map, COUNT_LAYER_ID);
      sortLayerOrder(map, [COUNT_LAYER_ID, PLACES_SHADOW_LAYER_ID, PLACES_LAYER_ID, PLACES_HIGHLIGHT_LAYER_ID, PLACES_HIT_LAYER_ID]);
    }

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
          clusterMaxZoom: 15,
          clusterRadius: 40,
        });
      }
      if (!map.getLayer(COUNT_LAYER_ID)) 
        map.addLayer(clusterCountLayer(COUNT_LAYER_ID, SOURCE_ID, mapMode === 'dark'));
      if (!map.getLayer(PLACES_SHADOW_LAYER_ID))
        map.addLayer(unclusteredPointShadowLayer(PLACES_SHADOW_LAYER_ID, SOURCE_ID));
      if (!map.getLayer(PLACES_LAYER_ID)) 
        map.addLayer(unclusteredPointLayer(PLACES_LAYER_ID, SOURCE_ID));
      if (!map.getLayer(PLACES_HIGHLIGHT_LAYER_ID))
        map.addLayer(unclusteredPointHighlightLayer(PLACES_HIGHLIGHT_LAYER_ID, SOURCE_ID));
      if (!map.getLayer(PLACES_HIT_LAYER_ID))
        map.addLayer(unclusteredPointHitLayer(PLACES_HIT_LAYER_ID, SOURCE_ID));

      const singletonFilter = getSingletonFilter(suppressedSingletonId);
      map.setFilter(PLACES_SHADOW_LAYER_ID, singletonFilter);
      map.setFilter(PLACES_LAYER_ID, singletonFilter);
      map.setFilter(PLACES_HIGHLIGHT_LAYER_ID, singletonFilter);
      map.setFilter(PLACES_HIT_LAYER_ID, singletonFilter);

      handleStateChange()
    };
    
    if (!enabled) removeLayer();
    map.on('load', refreshLayer); 
    map.on('styledata', refreshLayer);
    map.on('pitch', refreshLayer);
    map.on('idle', handleStateChange);
    // Maplibre internal race bug: 
    // Heatmap layer need to load first for both to show
    // hence on 'idle' event instead of 'load' event

    return () => {
      map.off('load', refreshLayer);
      map.off('styledata', refreshLayer);
      map.off('pitch', refreshLayer);
      map.off('idle', handleStateChange);

      removeLayer();
    };
  }, [geojson, enabled, mapMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Selection changes should only update singleton visibility filters;
    // do not recreate cluster layers/source on every selection transition.
    const singletonFilter = getSingletonFilter(suppressedSingletonId);
    if (map.getLayer(PLACES_SHADOW_LAYER_ID)) map.setFilter(PLACES_SHADOW_LAYER_ID, singletonFilter);
    if (map.getLayer(PLACES_LAYER_ID)) map.setFilter(PLACES_LAYER_ID, singletonFilter);
    if (map.getLayer(PLACES_HIGHLIGHT_LAYER_ID)) map.setFilter(PLACES_HIGHLIGHT_LAYER_ID, singletonFilter);
    if (map.getLayer(PLACES_HIT_LAYER_ID)) map.setFilter(PLACES_HIT_LAYER_ID, singletonFilter);
  }, [mapRef, suppressedSingletonId]);

};

export default useClusterLayer;
