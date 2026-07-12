import { useEffect, useRef } from 'react';
import L from 'leaflet';

import { useSearchFilters } from '../../../../../context/SearchFiltersContext';
import { useTileQuery } from '../../../../../context/TileQueryContext';
import createPersistentLayer from '../LayerStates/createPersistentLayer';
import usePinAnimations from './animation/usePinAnimations';
import { type SearchMask, filterPlacesOutsideMask } from '../LayerStates/filterTileOutsideMask';
import addDebugTileOverlay from '../utils/addDebugTileOverlay';
import useBuildFilterKey from '../LayerStates/buildFilterKey';
import callRequestTiles from '../inputHooks/callRequestTiles';
import useZoomThreshold from './hooks/useZoomThreshold';

// DEBUG Layers that only shows in local dev
const DEBUG_TILE_OVERLAY = (import.meta.env as Record<string, string | undefined>).VITE_DEBUG_TILE_OVERLAY === 'true';

type UseDensityPlacesLayerArgs = {
  mapRef: React.RefObject<L.Map | null>;
  searchMask: SearchMask | null;
  enabled: boolean;
  activeTopPlaceIds: string[];
  setSelectedPlaceId: (placeId: string | null) => void;
};

const useDensityPlacesLayer = ({
  mapRef,
  searchMask,
  enabled,
  activeTopPlaceIds,
  setSelectedPlaceId,
}: UseDensityPlacesLayerArgs): void => {

  // Data Request
  const { cuisineSelectionMode, effectiveCuisines, venueType, effectivePriceRanges, scoreBasis, scoreTier } = useSearchFilters();
  const { setLastTilesParams } = useTileQuery();
  const { status, res, queryKey, responseKey, requestParams } = callRequestTiles(mapRef, enabled);
  useEffect(() => { setLastTilesParams(requestParams); }, [requestParams, setLastTilesParams]);
  // Create a persistent LayerGroup for Markers
  const layerRef = createPersistentLayer(mapRef);

  // Get animation functions
  const topPlaceIdSet = activeTopPlaceIds.length ? new Set(activeTopPlaceIds) : undefined;
  const {
    currentResRef,
    addPins,
    setMaskVisibility,
    transitionRes,
    transitionToPlaces,
    transitionFromPlaces,
    removePlaceMarkersByIds,
    clearAll,
  } = usePinAnimations(mapRef, layerRef, {
    onPlaceClick: (placeId) => setSelectedPlaceId(placeId),
    activeTopPlaceIds: topPlaceIdSet,
  });

  // Tracks the last rendered mode so we can detect places -> tiles transitions.
  const prevModeRef = useRef<'tiles' | 'places' | null>(null);
  const prevTopPlaceIdsKeyRef = useRef('');
  
  const buildFilterKey = useBuildFilterKey();

  // Manage zoom-based marker suppression with smooth fade-out
  useZoomThreshold({
    enabled,
    mapRef,
    layerRef,
    onThresholdCross: () => { currentResRef.current = null; }, 
    // Force re-render by resetting resolution tracking
  });
  // Clear all markers when the request is suppressed (e.g. zoomed out past threshold).
  // useEffect(() => {
  //   if (!enabled || requestParams !== null) return;
  //   clearAll();
  //   prevModeRef.current = null;
  //   prevTopPlaceIdsKeyRef.current = '';
  // }, [enabled, requestParams, clearAll]);

  useEffect(() => {
    if (!enabled) return;
    if (!mapRef.current || status !== 'success' || !res || !layerRef.current) return;
    if (mapRef.current.getZoom() < 12) return; // Don't render markers below zoom 12
    if (responseKey !== queryKey) return;

    const { changed: filterChanged } = buildFilterKey(
      cuisineSelectionMode,
      effectiveCuisines,
      venueType,
      effectivePriceRanges,
      scoreBasis,
      scoreTier,
    );

    const topPlaceIdsKey = activeTopPlaceIds.length
      ? [...activeTopPlaceIds].sort((left, right) => left.localeCompare(right)).join('|')
      : '';
    const topPlaceIdsChanged = prevTopPlaceIdsKeyRef.current !== topPlaceIdsKey;
    prevTopPlaceIdsKeyRef.current = topPlaceIdsKey;

    // Places mode — mask out pins inside the bubble radius to avoid duplicates with BubbleAvatar.
    // Mask out pins that are already in the activeTopPlaceIds set to avoid duplicates with TopPlacesLayer.
    if (res.mode === 'places') {
      prevModeRef.current = 'places';
      const filteredPlaces = filterPlacesOutsideMask(res.data, searchMask);
      const topPlaceIdSet = activeTopPlaceIds.length ? new Set(activeTopPlaceIds) : null;
      const maskedPlaces = topPlaceIdSet
        ? filteredPlaces.filter((place) => !topPlaceIdSet.has(place.id))
        : filteredPlaces;

      if (topPlaceIdsChanged && activeTopPlaceIds.length) {
        removePlaceMarkersByIds(activeTopPlaceIds);
      }

      transitionToPlaces(maskedPlaces, { replaceAll: filterChanged });
      return;
    }

    const densityTiles = res.data;

    // Coming back from places mode — animate place markers out, then show density pins.
    if (!DEBUG_TILE_OVERLAY && prevModeRef.current === 'places') {
      transitionFromPlaces(res.resolution, densityTiles);
      setMaskVisibility(searchMask);
      prevModeRef.current = 'tiles';
      return;
    } else if (DEBUG_TILE_OVERLAY) {
      // Reset pin-layer refs too — otherwise places mode can skip rendering stale markers.
      clearAll();
      addDebugTileOverlay(mapRef.current, layerRef.current, densityTiles);
      prevModeRef.current = 'tiles';
      return;
    }
    prevModeRef.current = 'tiles';

    if (res.resolution !== currentResRef.current) {
      transitionRes(res.resolution, densityTiles);
    } else if (filterChanged) {
      transitionRes(res.resolution, densityTiles);
    } else {
      addPins(densityTiles, res.resolution);
    }

    setMaskVisibility(searchMask);
  }, [
    enabled,
    res,
    status,
    searchMask,
    cuisineSelectionMode,
    effectiveCuisines,
    venueType,
    effectivePriceRanges,
    scoreBasis,
    scoreTier,
    queryKey,
    responseKey,
    setMaskVisibility,
    mapRef,
    layerRef,
    buildFilterKey,
    transitionToPlaces,
    transitionFromPlaces,
    removePlaceMarkersByIds,
    clearAll,
    currentResRef,
    transitionRes,
    addPins,
    activeTopPlaceIds,
  ]);
};

export default useDensityPlacesLayer;
