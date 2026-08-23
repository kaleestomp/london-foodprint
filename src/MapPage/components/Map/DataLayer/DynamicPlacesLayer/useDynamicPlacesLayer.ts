import { useCallback, useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

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


const useDynamicPlacesLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>, 
  topPlaceIdSet: Set<string> | undefined, 
  enabled?: boolean
): void => {

  // DENSITY / PLACES DATA FETCH
  const { status, res, isPlaceholderData } = useFetchTiles(enabled);

  // CREATE PERSISTENT LAYER
  const layerRef = createPersistentLayer( mapRef );
  const densityLayer = useDensityLayer( mapRef, layerRef );
  const placesLayer = usePlacesLayer( mapRef, layerRef, densityLayer );

  // Tracks the last rendered mode so we can detect places -> tiles transitions.
  const prevModeRef = useRef<'tiles' | 'places' | null>(null);
  const filterKeyChanged = useFilterKeyChange(isPlaceholderData);
  const topPlaceIdsChanged = useTopPlacesChange(topPlaceIdSet);

  const handleZoomThresholdCross = useCallback(() => {
    densityLayer.currentResRef.current = null;
  }, [densityLayer.currentResRef]);

  // Manage zoom-based marker suppression with smooth fade-out
  // Force re-render by resetting resolution tracking
  useZoomThreshold( mapRef, layerRef, handleZoomThresholdCross, enabled );

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
      const dedupPlaces = topPlaceIdSet
        ? maskedPlaces.filter((place) => !topPlaceIdSet.has(place.id))
        : maskedPlaces;

      // 2.RENDER
      const isFirstEntry = prevModeRef.current !== 'places';
      placesLayer.syncLayer(dedupPlaces, filterKeyChanged, isFirstEntry); 
      prevModeRef.current = 'places';

      // 3.DEDUP MARKER AFTER RENDER
      if (topPlaceIdsChanged && topPlaceIdSet?.size)
        placesLayer.removeMarkerFromLayer(topPlaceIdSet);
      
    }

    // DENSITY MODE
    else {
      const densityTiles = res.data;

      // 1.DEDUP DATA BEFORE RENDER
      const dedupTiles = topPlaceIdSet
        ? densityTiles.filter((d) => {
          const SingletonId = d.singleton?.id;
          if (!SingletonId) return true;
          return !topPlaceIdSet.has(SingletonId);
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
      if (topPlaceIdsChanged && topPlaceIdSet?.size)
        densityLayer.dedupSingletons(topPlaceIdSet);
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
    topPlaceIdSet, enabled,
  ]);
};

export default useDynamicPlacesLayer;
