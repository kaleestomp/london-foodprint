import { useEffect, useRef } from 'react';
import L from 'leaflet';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { maskPlaces } from '../LayerStates/maskResults';

import createPersistentLayer from '../LayerStates/createPersistentLayer';
import useDensityLayer from './useDensityLayer/useDensityLayer';
import usePlacesLayer from './usePlacesLayer/usePlacesLayer';
import useFilterKeyChange from '../LayerStates/useFilterKeyChange';
import useTopPlacesChange from '../LayerStates/useTopPlacesChange';
import useFetchTiles from './InputHooks/useFetchTiles';
import useZoomThreshold from './useZoomThreshold/useZoomThreshold';

// DEBUG Layers that only shows in local dev
// import addDebugTileOverlay from '../utils/addDebugTileOverlay';
// const DEBUG_TILE_OVERLAY = (import.meta.env as Record<string, string | undefined>).VITE_DEBUG_TILE_OVERLAY === 'true';

type UseDensityPlacesLayerArgs = {
  mapRef: React.RefObject<L.Map | null>;
  enabled: boolean;
  activeTopPlaceIds: string[];
};

const useDensityPlacesLayer = ({ mapRef, activeTopPlaceIds, enabled }: UseDensityPlacesLayerArgs): void => {

  // DENSITY / PLACES DATA FETCH
  const { status, res, isPlaceholderData } = useFetchTiles(enabled);

  // CREATE PERSISTENT LAYER
  const layerRef = createPersistentLayer(mapRef);
  const activeTopPlaceIdSet = activeTopPlaceIds.length ? new Set(activeTopPlaceIds) : undefined;
  const densityLayer = useDensityLayer(mapRef, layerRef, activeTopPlaceIdSet);
  const placesLayer = usePlacesLayer(mapRef, layerRef, densityLayer);

  // Tracks the last rendered mode so we can detect places -> tiles transitions.
  const prevModeRef = useRef<'tiles' | 'places' | null>(null);
  const filterKeyChanged = useFilterKeyChange();
  const topPlaceIdsChanged = useTopPlacesChange(activeTopPlaceIds);

  // Manage zoom-based marker suppression with smooth fade-out
  useZoomThreshold({ 
    mapRef, layerRef, enabled,
    onThresholdCross: () => { densityLayer.currentResRef.current = null; }, 
    // Force re-render by resetting resolution tracking
  });

  const { searchMask } = useSearchFilters();
  useEffect(() => {
    if (!enabled) return;
    if (!mapRef.current || status !== 'success' || !res || !layerRef.current) return;
    if (mapRef.current.getZoom() < 12) return; // Don't render markers below zoom 12
    if (isPlaceholderData) return; // Previously responseKey !== queryKey

    // PLACES MODE
    // mask out pins inside the bubble radius to avoid duplicates with BubbleAvatar.
    // Mask out pins that are already in the activeTopPlaceIds set to avoid duplicates with TopPlacesLayer.
    if (res.mode === 'places') {
      prevModeRef.current = 'places';
      const places = res.data;
      const maskedPlaces = maskPlaces(places, searchMask);
      const topPlaceIdSet = activeTopPlaceIds.length ? new Set(activeTopPlaceIds) : null;
      const newPlaces = topPlaceIdSet ? maskedPlaces.filter((place) => !topPlaceIdSet.has(place.id)) : maskedPlaces;
      placesLayer.syncLayer(newPlaces, filterKeyChanged); //replace all if filter key changed

      if (topPlaceIdsChanged && activeTopPlaceIds.length) placesLayer.removeMarkerFromLayer(activeTopPlaceIds);

      return;
    }

    // TILES MODE
    const densityTiles = res.data;
    // Coming back from places mode — animate place markers out, then show density pins.
    if (prevModeRef.current === 'places') {
      placesLayer.removeLayer(res.resolution, densityTiles);
      densityLayer.setMaskVisibility(searchMask);
      prevModeRef.current = 'tiles';
      return;
    } else {
      // ELSE prevModeRef.current === 'tiles'
      prevModeRef.current = 'tiles';
      if (res.resolution !== densityLayer.currentResRef.current || filterKeyChanged) {
        densityLayer.refreshLayer(res.resolution, densityTiles);
      } else {
        densityLayer.addMarkersToLayer(res.resolution, densityTiles);
      }
      densityLayer.setMaskVisibility(searchMask);
    }

    // // DEBUG OVERLAY
    // if (true) {
    //   // CLEAR ALL
    //   densityLayer.cancelScheduledLayerRemoval();
    //   placesLayer.cancelScheduledLayerRemoval();
    //   layerRef.current?.clearLayers();
    //   densityLayer.resetLayerState();
    //   placesLayer.resetLayerState();
    //   // ADD DEBUG OVERLAY
    //   addDebugTileOverlay(mapRef.current, layerRef.current, densityTiles);
    //   prevModeRef.current = 'tiles';
    //   return;
    // }

  }, [ 
    mapRef, layerRef, res, status, 
    densityLayer, placesLayer, prevModeRef,
    filterKeyChanged, isPlaceholderData, searchMask, 
    activeTopPlaceIds, enabled,
  ]);
};

export default useDensityPlacesLayer;
