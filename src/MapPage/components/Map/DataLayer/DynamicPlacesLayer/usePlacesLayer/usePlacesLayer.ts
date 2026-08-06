import { useCallback, useMemo, useRef } from 'react';
import L from 'leaflet';

import { type DensityLayer } from '../useDensityLayer/useDensityLayer';
import { type TileDensity, type TilePlacePreview } from '../../../../../request/useRequestTiles/request';
import { usePlaceSelection } from '../../../../../../context/PlaceSelectionContext';
import { cancelLayerRemoval, scheduleLayerRemoval } from '../lifecycle/lifecycle';

import addPlaceMarkers from './placeMarkers/addPlaceMarkers';
import animateLayerEntry from './animateLayerEntry';
import animateMergeOnExit from './markerTransitions/animateMergeOnExit';

export interface PlacesLayer {
  syncLayer: (places: TilePlacePreview[], replaceAll?: boolean) => void,
  removeLayer: (curRes: number, densityTiles: TileDensity[]) => void,
  removeMarkerFromLayer: (placeIds: Set<string>) => void,
  cancelScheduledLayerRemoval: () => void,
  resetLayerState: () => void,
}

/**
 * Manages place markers on the map, including adding/removing markers, 
 * handling transitions from density to places, and syncing with the density layer.
 * Provides a public API for interacting with the places layer.
 */
const usePlacesLayer = (
  mapRef: React.RefObject<L.Map | null>,
  layerRef: React.RefObject<L.LayerGroup | null>,
  density: DensityLayer,
) => {

  const { setSelectedPlaceId } = usePlaceSelection();

  const placesMarkerRef = useRef<Map<string, L.Marker>>(new Map());
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRemovalRef = useRef<L.Marker[]>([]);


  // ── Public API ─────────────────────────────────────────────────────────────

  // CANCEL PENDING REMOVAL
  const cancelScheduledLayerRemoval = useCallback(() => {
    cancelLayerRemoval(layerRef.current, cleanupTimerRef, pendingRemovalRef);
  }, []);
  // RESET LAYER STATE
  const resetLayerState = useCallback(() => {
    placesMarkerRef.current = new Map();
  }, []);

  // DENSITY → PLACES + PLACES PAN
  // First entry: burst density pins, fly place pins in from their host tile, then add all place markers.
  // Subsequent calls while in places mode (panning): only add place IDs not already tracked 
  // — existing markers persist until a res change.
  const syncLayer = useCallback((
    places: TilePlacePreview[],
    replaceAll?: boolean,
  ): void => {

    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    // CLEAR ALL MARKERS
    if (replaceAll && placesMarkerRef.current.size > 0) {
      // Cancel pending removal orders - avoid conflict
      cancelScheduledLayerRemoval();
      // Clear Layer - Instant Removal
      placesMarkerRef.current.forEach((marker) => layer.removeLayer(marker));
      // Clear Marker Ref Map
      placesMarkerRef.current.clear();
    }

    // FIRST ENTRY: DENSITY -> PLACES 
    // TODO: Find new way to detect first entry; 
    // Later we will add singleton markers to places layer, so size check will not work.
    const isFirstEntry = placesMarkerRef.current.size === 0;
    if (isFirstEntry) animateLayerEntry(
      map, layer, places, density, placesMarkerRef, cancelScheduledLayerRemoval, setSelectedPlaceId
    );

    // SUBSEQUENT UPDATE: PLACES → PLACES
    // only add new markers, persist existing ones ─────────
    else {
      // FILTER OUT EXISTING MARKERS
      const newPlaces = places.filter((p) => !placesMarkerRef.current.has(p.id));
      if (!newPlaces.length) return;

      // CREATE REMAINING NEW MARKERS + UPDATE REF MAP
      const newMarkers = addPlaceMarkers(layer, newPlaces, setSelectedPlaceId, undefined);
      newMarkers.forEach(({ PlaceId, Marker }) => placesMarkerRef.current.set(PlaceId, Marker));
    }
  }, [cancelScheduledLayerRemoval, density, setSelectedPlaceId]);

  // PLACES -> DENSITY
  // Places fly back to their host tile
  // New density pins are added immediately alongside the exiting places
  const removeLayer = useCallback((curRes: number, densityTiles: TileDensity[]): void => {

    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    // 1.CANCEL PENDING REMOVALS - Tile + Places
    density.cancelScheduledLayerRemoval();
    cancelScheduledLayerRemoval();

    // 2.EXTRACT + RESET PLACE + TILE LAYER STATE
    const outgoingPlacesMarker = new Map(placesMarkerRef.current);
    placesMarkerRef.current = new Map();
    density.currentResRef.current = curRes;
    density.markerRef.current = new Map();

    // 3. ANIMATION: 
    // Animate Transition by Updating Outgoing Markers CSS State
    animateMergeOnExit(map, curRes, outgoingPlacesMarker);

    // Add new density pins alongside exiting place pins — no gap.
    density.addMarkersToLayer(curRes, densityTiles);

    scheduleLayerRemoval(
      layer, // layer
      Array.from(outgoingPlacesMarker.values()), // markers
      400, // delayMs
      cleanupTimerRef, // timerRef
      pendingRemovalRef, // pendingRef
    );
  }, [cancelScheduledLayerRemoval, density]);

  // REMOVE MARKERS
  const removeMarkerFromLayer = useCallback((placeIds: Set<string>): void => {
    const layer = layerRef.current;
    if (!layer) return;

    placeIds.forEach((placeId) => {
      if (!placesMarkerRef.current.has(placeId)) return;
      const marker = placesMarkerRef.current.get(placeId);
      if (!marker) return;

      layer.removeLayer(marker);
      placesMarkerRef.current.delete(placeId);
    });
  }, []);

  return useMemo(() => ({
    syncLayer,
    removeLayer,
    removeMarkerFromLayer,
    cancelScheduledLayerRemoval,
    resetLayerState,
  }), [
    syncLayer,
    removeLayer,
    removeMarkerFromLayer,
    cancelScheduledLayerRemoval,
    resetLayerState,
  ]);
};

export default usePlacesLayer;
