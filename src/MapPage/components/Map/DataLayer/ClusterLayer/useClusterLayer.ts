import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../../../context/AppUIContext';
import { usePlaceSelection } from '../../../../../context/PlaceSelectionContext';
import useFetchHeatmap from '../HeatmapLayer/InputHooks/useFetchHeatmap';
import { clusterCountLayer, unclusteredPointHighlightLayer, unclusteredPointHitLayer, unclusteredPointLayer, unclusteredPointShadowLayer } from './clusterLayers';
import sortLayerOrder from './sortLayerOrder';
import updateTextSize from './updateTextSize';
import showPlaceMarker from './showPlaceMarker';

import '../TopPlacesLayer/syncMarkers/markers/TopPlacePin.css';

const SOURCE_ID = 'cluster-source';
const PLACES_SHADOW_LAYER_ID = 'unclustered-point-shadow';
const PLACES_LAYER_ID = 'unclustered-point';
const PLACES_HIGHLIGHT_LAYER_ID = 'unclustered-point-highlight';
const PLACES_HIT_LAYER_ID = 'unclustered-point-hit-area';
const COUNT_LAYER_ID = 'cluster-count';

const useClusterLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  enabled: boolean = true,
): React.RefObject<Set<string>> => {

  const { selectedPlaceId, setSelectedPlaceId } = usePlaceSelection();
  const { geojson } = useFetchHeatmap(enabled);
  const singletonIdsRef = useRef<Set<string>>(new Set());
  const selectedSingletonMarkerRef = useRef<maplibregl.Marker | null>(null);
  const selectedSingletonIdRef = useRef<string | null>(null);

  useEffect(() => {
    const selectedSingletonId = selectedSingletonIdRef.current;
    if (!selectedSingletonId || selectedSingletonId === selectedPlaceId) return;

    selectedSingletonMarkerRef.current?.remove();
    selectedSingletonMarkerRef.current = null;
    selectedSingletonIdRef.current = null;
  }, [selectedPlaceId]);

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
      // singletonIdsRef.current = getSingletonIds(map, PLACES_LAYER_ID);
    }
    
    const handleSingletonClick = (event: maplibregl.MapLayerMouseEvent) => {

      const feature = event.features?.[0];
      const placeId = feature?.properties?.id ?? feature?.id;
      if (placeId == null) return;
      if (feature?.geometry.type !== 'Point') return;

      event.originalEvent.stopPropagation();
      showPlaceMarker(map, feature, selectedSingletonMarkerRef);

      selectedSingletonIdRef.current = String(placeId);
      setSelectedPlaceId(String(placeId));
    };

    const handleSingletonMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleSingletonMouseLeave = () => {
      map.getCanvas().style.cursor = '';
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
          clusterMaxZoom: 15,
          clusterRadius: 40,
        });
      }

      if (!map.getLayer(COUNT_LAYER_ID)) 
        map.addLayer(clusterCountLayer(COUNT_LAYER_ID, SOURCE_ID));
      if (!map.getLayer(PLACES_SHADOW_LAYER_ID))
        map.addLayer(unclusteredPointShadowLayer(PLACES_SHADOW_LAYER_ID, SOURCE_ID));
      if (!map.getLayer(PLACES_LAYER_ID)) 
        map.addLayer(unclusteredPointLayer(PLACES_LAYER_ID, SOURCE_ID));
      if (!map.getLayer(PLACES_HIGHLIGHT_LAYER_ID))
        map.addLayer(unclusteredPointHighlightLayer(PLACES_HIGHLIGHT_LAYER_ID, SOURCE_ID));
      if (!map.getLayer(PLACES_HIT_LAYER_ID))
        map.addLayer(unclusteredPointHitLayer(PLACES_HIT_LAYER_ID, SOURCE_ID));
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
    
    map.on('click', PLACES_HIT_LAYER_ID, handleSingletonClick);
    map.on('mouseenter', PLACES_HIT_LAYER_ID, handleSingletonMouseEnter);
    map.on('mouseleave', PLACES_HIT_LAYER_ID, handleSingletonMouseLeave);

    return () => {
      map.off('load', refreshLayer);
      map.off('styledata', refreshLayer);
      map.off('pitch', refreshLayer);
      map.off('idle', handleStateChange);

      map.off('click', PLACES_HIT_LAYER_ID, handleSingletonClick);
      map.off('mouseenter', PLACES_HIT_LAYER_ID, handleSingletonMouseEnter);
      map.off('mouseleave', PLACES_HIT_LAYER_ID, handleSingletonMouseLeave);
      selectedSingletonMarkerRef.current?.remove();
      selectedSingletonMarkerRef.current = null;
      selectedSingletonIdRef.current = null;
      removeLayer();
      singletonIdsRef.current = new Set();
      map.getCanvas().style.cursor = '';
    };
  }, [geojson, enabled, setSelectedPlaceId]);

  return singletonIdsRef;
};

export default useClusterLayer;
