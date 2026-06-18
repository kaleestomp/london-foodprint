import { useEffect, useRef } from 'react';
import L from 'leaflet';

import callRequestTiles from './inputHooks/callRequestTiles';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import createPersistentLayer from './LayerStates/createPersistentLayer';
import usePinAnimations from './pinAnimations/usePinAnimations';
import { type SearchMask, filterDensityOutsideMask, filterPlacesOutsideMask } from './LayerStates/filterTileOutsideMask';
import addDebugTileOverlay from './utils/addDebugTileOverlay';
import useCheckMaskChanged from './LayerStates/checkMaskChanged';
import useBuildFilterKey from './LayerStates/buildFilterKey';
import { usePlacesQuery } from '../../../context/PlacesQueryContext';

// DEBUG Layers that only shows in local dev
const DEBUG_TILE_OVERLAY = (import.meta.env as Record<string, string | undefined>).VITE_DEBUG_TILE_OVERLAY === 'true';

const DataLayer = (mapRef: React.RefObject<L.Map | null>, searchMask: SearchMask | null = null): void => {

  const { 
    cuisineSelectionMode, // Include / Exclude
    effectiveCuisines, // Sorted array of cuisines
    venueType, // Placeholder (string or null)
    effectivePriceRanges, // Array of selected price ranges - empty on default
    scoreBasis, scoreTier 
  } = useSearchFilters();

  const { status, res, queryKey, responseKey, requestParams } = callRequestTiles(mapRef);
  const { setLastTilesParams, setSelectedPlaceId } = usePlacesQuery();
  // console.log(responseKey)

  // Create a persistent LayerGroup for Markers
  const layerRef = createPersistentLayer(mapRef);

  // Get a animation functions
  const { 
    currentResRef, 
    addPins, 
    transitionRes, 
    transitionToPlaces, 
    transitionFromPlaces, 
    clearAll 
  } = usePinAnimations(mapRef, layerRef, {
    onPlaceClick: (placeId) => setSelectedPlaceId(placeId),
  });

  // Tracks the last rendered mode so we can detect places → tiles transitions.
  const prevModeRef = useRef<'tiles' | 'places' | null>(null);

  // Owns refs for mask and filter change detection
  const checkMaskChanged = useCheckMaskChanged();
  const buildFilterKey = useBuildFilterKey();

  useEffect(() => {
    setLastTilesParams(requestParams);
  }, [requestParams, setLastTilesParams]);

  useEffect(() => {
    if (!mapRef.current || status !== 'success' || !res || !layerRef.current) return;
    if (responseKey !== queryKey) return;

    const maskChanged = checkMaskChanged(searchMask);
    const { changed: filterChanged } = buildFilterKey(
      cuisineSelectionMode, effectiveCuisines,
      venueType, effectivePriceRanges,
      scoreBasis, scoreTier,
    );
    const reconcileLayer = maskChanged || filterChanged;

    // Places mode — mask out pins inside the bubble radius to avoid duplicates with BubbleAvatar.
    if (res.mode === 'places') {
      prevModeRef.current = 'places';
      const filteredPlaces = filterPlacesOutsideMask(res.data, searchMask);
      transitionToPlaces(filteredPlaces, { replaceAll: reconcileLayer });
      return;
    }

    const filteredTiles = filterDensityOutsideMask(res.data, searchMask);
    
    // Coming back from places mode — animate place markers out, then show density pins.
    if (!DEBUG_TILE_OVERLAY && prevModeRef.current === 'places') {
      transitionFromPlaces(res.resolution, filteredTiles);
      prevModeRef.current = 'tiles';
      return;
    } else if (DEBUG_TILE_OVERLAY) {
      // Reset pin-layer refs too — otherwise places mode can skip rendering stale markers.
      clearAll();
      addDebugTileOverlay(mapRef.current, layerRef.current, filteredTiles);
      prevModeRef.current = 'tiles';
      return;
    }
    prevModeRef.current = 'tiles';

    // Force full reconcile on mask/filter change so stale in-radius markers are removed.
    if (reconcileLayer) {
      transitionRes(res.resolution, filteredTiles);
      return;
    }
    if (res.resolution !== currentResRef.current) {
      transitionRes(res.resolution, filteredTiles);
    } else {
      addPins(filteredTiles, res.resolution);
    }

  }, [
    res, status, searchMask, cuisineSelectionMode, 
    effectiveCuisines, venueType, effectivePriceRanges, 
    scoreBasis, scoreTier, queryKey, responseKey
  ]);

};

export default DataLayer;
