import { useEffect, useRef } from 'react';
import L from 'leaflet';

import callRequestTiles from './inputHooks/callRequestTiles';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import createPersistentLayer from './LayerStates/createPersistentLayer';
import usePinAnimations from './pinAnimations/usePinAnimations';
import { type SearchMask, filterPlacesOutsideMask } from './LayerStates/filterTileOutsideMask';
import addDebugTileOverlay from './utils/addDebugTileOverlay';
import useBuildFilterKey from './LayerStates/buildFilterKey';
import { useTileQuery } from '../../../../context/TileQueryContext';
import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';

// DEBUG Layers that only shows in local dev
const DEBUG_TILE_OVERLAY = (import.meta.env as Record<string, string | undefined>).VITE_DEBUG_TILE_OVERLAY === 'true';

const DataLayer = (
  mapRef: React.RefObject<L.Map | null>,
  searchMask: SearchMask | null = null,
  enabled = true,
): void => {

  const { 
    cuisineSelectionMode, // Include / Exclude
    effectiveCuisines, // Sorted array of cuisines
    venueType, // Placeholder (string or null)
    effectivePriceRanges, // Array of selected price ranges - empty on default
    scoreBasis, scoreTier 
  } = useSearchFilters();

  const { status, res, queryKey, responseKey, requestParams } = callRequestTiles(mapRef, enabled);
  const { setLastTilesParams } = useTileQuery();
  const { setSelectedPlaceId } = usePlaceSelection();
  useEffect(() => {
    setLastTilesParams(requestParams);
  }, [requestParams, setLastTilesParams]);
  // console.log(responseKey)

  // Create a persistent LayerGroup for Markers
  const layerRef = createPersistentLayer(mapRef);

  // Get a animation functions
  const { 
    currentResRef, 
    addPins, 
    setMaskVisibility,
    transitionRes, 
    transitionToPlaces, 
    transitionFromPlaces, 
    clearAll 
  } = usePinAnimations(mapRef, layerRef, {
    onPlaceClick: (placeId) => setSelectedPlaceId(placeId),
  });

  // Tracks the last rendered mode so we can detect places → tiles transitions.
  const prevModeRef = useRef<'tiles' | 'places' | null>(null);
  const buildFilterKey = useBuildFilterKey();

  
  useEffect(() => {
    if (!enabled) return;
    if (!mapRef.current || status !== 'success' || !res || !layerRef.current) return;
    if (responseKey !== queryKey) return;

    const { changed: filterChanged } = buildFilterKey(
      cuisineSelectionMode, effectiveCuisines,
      venueType, effectivePriceRanges,
      scoreBasis, scoreTier,
    );

    // Places mode — mask out pins inside the bubble radius to avoid duplicates with BubbleAvatar.
    if (res.mode === 'places') {
      prevModeRef.current = 'places';
      const filteredPlaces = filterPlacesOutsideMask(res.data, searchMask);
      transitionToPlaces(filteredPlaces, { replaceAll: filterChanged });
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
    } else {
      if (filterChanged) {
        transitionRes(res.resolution, densityTiles);
      } else {
        addPins(densityTiles, res.resolution);
      }
    }

    setMaskVisibility(searchMask);

  }, [
    enabled, res, status, searchMask, cuisineSelectionMode, 
    effectiveCuisines, venueType, effectivePriceRanges, 
    scoreBasis, scoreTier, queryKey, responseKey, setMaskVisibility
  ]);

};

export default DataLayer;
