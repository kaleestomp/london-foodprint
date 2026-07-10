import { useEffect, useMemo, useRef } from 'react';
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
import useRequestTopPlaces from '../../../request/useRequestTopPlaces/useRequestTopPlaces';
import addTopPlaceMarkers from './addTopPlacePins/addTopPlaceMarkers';
import './addTopPlacePins/topPlacePin.css';

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
  const { selectedPlaceId, setSelectedPlaceId } = usePlaceSelection();
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
  const topPlacesLayerRef = useRef<L.LayerGroup | null>(null);
  const topPlaceMarkersRef = useRef<Map<string, L.Marker>>(new Map());

  const topPlacesParams = useMemo(() => {
    if (!enabled || !requestParams) return null;

    return {
      sw_lat: requestParams.sw_lat,
      sw_lng: requestParams.sw_lng,
      ne_lat: requestParams.ne_lat,
      ne_lng: requestParams.ne_lng,
      res: requestParams.res,
      cuisines: requestParams.cuisines,
      cost: requestParams.cost,
      venue_type: requestParams.venue_type,
      score_basis: requestParams.score_basis,
      score_tier: requestParams.score_tier,
      limit: 10,
    };
  }, [enabled, requestParams]);

  const {
    status: topPlacesStatus,
    res: topPlacesRes,
    queryKey: topPlacesQueryKey,
    responseKey: topPlacesResponseKey,
  } = useRequestTopPlaces(topPlacesParams, { debounceMs: 150 });

  useEffect(() => {
    if (!enabled) return;
    const map = mapRef.current;
    if (!map) return;

    const layer = L.layerGroup().addTo(map);
    topPlacesLayerRef.current = layer;

    return () => {
      topPlaceMarkersRef.current.clear();
      topPlacesLayerRef.current = null;
      layer.remove();
    };
  }, [enabled, mapRef]);

  useEffect(() => {
    const layer = topPlacesLayerRef.current;
    if (!enabled || !layer) return;
    if (topPlacesStatus !== 'success' || !topPlacesRes) {
      layer.clearLayers();
      topPlaceMarkersRef.current.clear();
      return;
    }
    if (topPlacesResponseKey !== topPlacesQueryKey) return;

    layer.clearLayers();
    const created = addTopPlaceMarkers(layer, topPlacesRes.data, (placeId) => setSelectedPlaceId(placeId));
    topPlaceMarkersRef.current = new Map(created.map(({ id, marker }) => [id, marker]));
  }, [
    enabled,
    topPlacesStatus,
    topPlacesRes,
    topPlacesQueryKey,
    topPlacesResponseKey,
    setSelectedPlaceId,
  ]);

  useEffect(() => {
    topPlaceMarkersRef.current.forEach((marker, placeId) => {
      const motion = marker.getElement()?.querySelector<HTMLElement>('.top-place-pin-motion');
      if (!motion) return;

      motion.classList.remove('is-jumping', 'is-floating');
      if (!selectedPlaceId || placeId !== selectedPlaceId) return;

      // Restart jump animation whenever this place is selected.
      void motion.offsetWidth;
      motion.classList.add('is-jumping');
      motion.addEventListener('animationend', () => {
        motion.classList.remove('is-jumping');
        motion.classList.add('is-floating');
      }, { once: true });
    });
  }, [selectedPlaceId, topPlacesResponseKey]);

  
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
