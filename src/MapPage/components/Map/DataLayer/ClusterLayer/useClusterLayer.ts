import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';

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

  const { geojson } = useFetchHeatmap(enabled);
  const latestGeojsonRef = useRef(geojson);
  const { selectedPlaceId, selectedLayer } = usePlaceSelection();
  const suppressedSingletonId = (selectedLayer === 'list')
    ? selectedPlaceId
    : null;

  useEffect(() => {
    latestGeojsonRef.current = geojson;
  }, [geojson]);

  useHandleSelectedMarker(mapRef, PLACES_HIT_LAYER_ID);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const hasStyle = (): boolean => {
      try {
        return Boolean(map.getStyle());
      } catch {
        return false;
      }
    };

    const isStyleReady = (): boolean => {
      try {
        return hasStyle() && map.isStyleLoaded() === true;
      } catch {
        return false;
      }
    };

    const removeLayer = () => {
      const currentMap = mapRef.current;
      if (!currentMap) return;
      try {
        if (currentMap.getLayer(COUNT_LAYER_ID)) currentMap.removeLayer(COUNT_LAYER_ID);
        if (currentMap.getLayer(PLACES_HIT_LAYER_ID)) currentMap.removeLayer(PLACES_HIT_LAYER_ID);
        if (currentMap.getLayer(PLACES_HIGHLIGHT_LAYER_ID)) currentMap.removeLayer(PLACES_HIGHLIGHT_LAYER_ID);
        if (currentMap.getLayer(PLACES_LAYER_ID)) currentMap.removeLayer(PLACES_LAYER_ID);
        if (currentMap.getLayer(PLACES_SHADOW_LAYER_ID)) currentMap.removeLayer(PLACES_SHADOW_LAYER_ID);
        if (currentMap.getSource(SOURCE_ID)) currentMap.removeSource(SOURCE_ID);
      } catch {
        // Style already torn down (e.g. city switch) — nothing to remove
      }
    };
    
    const handleStateChange = () => {
      updateTextSize(map, COUNT_LAYER_ID);
      sortLayerOrder(map, [COUNT_LAYER_ID, PLACES_SHADOW_LAYER_ID, PLACES_LAYER_ID, PLACES_HIGHLIGHT_LAYER_ID, PLACES_HIT_LAYER_ID]);
    }

    // const maybeMarkInitialLoadComplete = () => {
    //   if (!enabled || !isStyleReady()) return;

    //   const source = map.getSource(SOURCE_ID);
    //   const hasRequiredLayers = Boolean(
    //     map.getLayer(COUNT_LAYER_ID) &&
    //     map.getLayer(PLACES_SHADOW_LAYER_ID) &&
    //     map.getLayer(PLACES_LAYER_ID) &&
    //     map.getLayer(PLACES_HIGHLIGHT_LAYER_ID) &&
    //     map.getLayer(PLACES_HIT_LAYER_ID)
    //   );

    //   if (!source || !hasRequiredLayers || !map.isSourceLoaded(SOURCE_ID)) return;

    //   markInitialLoadItemComplete('clusterLayer');
    // };

    const ensureLayer = () => {
      if (!enabled || !isStyleReady()) return;

      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: latestGeojsonRef.current,
          cluster: true,
          clusterMaxZoom: 15,
          clusterRadius: 40,
        });
      }
      if (!map.getLayer(COUNT_LAYER_ID))
        map.addLayer(clusterCountLayer(COUNT_LAYER_ID, SOURCE_ID, false));
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

      handleStateChange();
      // maybeMarkInitialLoadComplete();
    };
    
    if (!enabled) removeLayer();
    map.on('load', ensureLayer);
    map.on('styledata', ensureLayer);
    map.on('idle', ensureLayer);
    // map.on('sourcedata', maybeMarkInitialLoadComplete);
    // Maplibre internal race bug: 
    // Heatmap layer need to load first for both to show
    // hence on 'idle' event instead of 'load' event

    ensureLayer();
    // maybeMarkInitialLoadComplete();

    return () => {
      map.off('load', ensureLayer);
      map.off('styledata', ensureLayer);
      map.off('idle', ensureLayer);
      // map.off('sourcedata', maybeMarkInitialLoadComplete);

      removeLayer();
    };
  }, [enabled, mapRef]); //markInitialLoadItemComplete

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !enabled) return;

    try {
      if (!map.getStyle() || !map.isStyleLoaded()) return;
    } catch {
      return;
    }

    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    source.setData(geojson);
    maybeUpdateStyleOrder(map);
  }, [geojson, enabled, mapRef]);

  const maybeUpdateStyleOrder = (map: maplibregl.Map) => {
    updateTextSize(map, COUNT_LAYER_ID);
    sortLayerOrder(map, [COUNT_LAYER_ID, PLACES_SHADOW_LAYER_ID, PLACES_LAYER_ID, PLACES_HIGHLIGHT_LAYER_ID, PLACES_HIT_LAYER_ID]);
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      if (!map.getStyle()) return;
    } catch {
      return;
    }

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
