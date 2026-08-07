import { useCallback, useEffect, useMemo, useRef } from 'react';
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

import './useDensityLayer/densityMarkers/densityMarker.css';

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
  const activeTopPlaceIdSet = useMemo(
    () => (activeTopPlaceIds.length ? new Set(activeTopPlaceIds) : undefined),
    [activeTopPlaceIds],
  );
  const densityLayer = useDensityLayer(mapRef, layerRef, activeTopPlaceIdSet);
  const placesLayer = usePlacesLayer(mapRef, layerRef, densityLayer);

  // Tracks the last rendered mode so we can detect places -> tiles transitions.
  const prevModeRef = useRef<'tiles' | 'places' | null>(null);
  const filterKeyChanged = useFilterKeyChange(isPlaceholderData);
  const topPlaceIdsChanged = useTopPlacesChange(activeTopPlaceIds);

  const handleZoomThresholdCross = useCallback(() => {
    densityLayer.currentResRef.current = null;
  }, [densityLayer.currentResRef]);

  // Manage zoom-based marker suppression with smooth fade-out
  useZoomThreshold({ 
    mapRef, layerRef, enabled,
    onThresholdCross: handleZoomThresholdCross,
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
      
      const places = res.data;

      // 1.DEDUP DATA BEFORE RENDER
      const maskedPlaces = maskPlaces(places, searchMask); 
      const dedupPlaces = activeTopPlaceIdSet 
        ? maskedPlaces.filter((place) => !activeTopPlaceIdSet.has(place.id)) 
        : maskedPlaces;

      // 2.RENDER
      const isFirstEntry = prevModeRef.current !== 'places';
      placesLayer.syncLayer(dedupPlaces, filterKeyChanged, isFirstEntry); //replace all if filter key changed
      prevModeRef.current = 'places';

      // 3.DEDUP MARKER AFTER RENDER
      if (topPlaceIdsChanged && activeTopPlaceIdSet?.size) 
        placesLayer.removeMarkerFromLayer(activeTopPlaceIdSet);

    }

    // DENSITY MODE
    else {
      const densityTiles = res.data;

      // 1.DEDUP DATA BEFORE RENDER
      const dedupTiles = activeTopPlaceIdSet 
        ? densityTiles.filter((d) => {
          const SingletonId = d.singleton?.id;
          if (!SingletonId ) return true;
          return !activeTopPlaceIdSet.has(SingletonId);
        }) : densityTiles;
      
      // 2.RENDER
      if (prevModeRef.current === 'places') {
        // PLACES -> DENSITY
        // animate place markers out, then show density pins.
        placesLayer.removeLayer(res.resolution, dedupTiles);
      } else {
        // DENSITY -> DENSITY
        const fullRefresh = res.resolution !== densityLayer.currentResRef.current || filterKeyChanged; 
        if (fullRefresh) densityLayer.refreshLayer(res.resolution, dedupTiles);
        else densityLayer.addMarkersToLayer(res.resolution, dedupTiles);
      }
      // MASK MARKERS (VIA OPACITY)
      densityLayer.setMaskVisibility(searchMask);
      prevModeRef.current = 'tiles';

      // 3.DEDUP MARKER AFTER RENDER
      if (topPlaceIdsChanged && activeTopPlaceIdSet?.size) 
        densityLayer.dedupSingletons(activeTopPlaceIdSet);
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
    res, status, 
    densityLayer.currentResRef,
    densityLayer.refreshLayer,
    densityLayer.addMarkersToLayer,
    densityLayer.setMaskVisibility,
    placesLayer.syncLayer,
    placesLayer.removeLayer,
    placesLayer.removeMarkerFromLayer,
    filterKeyChanged, isPlaceholderData, searchMask, 
    activeTopPlaceIds, enabled,
  ]);
};

export default useDensityPlacesLayer;
