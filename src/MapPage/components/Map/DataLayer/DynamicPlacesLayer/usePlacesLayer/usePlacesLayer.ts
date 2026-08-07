import { useCallback, useMemo, useRef } from 'react';
import L from 'leaflet';

import { type DensityLayer } from '../useDensityLayer/useDensityLayer';
import { type TileDensity, type TilePlacePreview } from '../../../../../request/useRequestTiles/request';
import { usePlaceSelection } from '../../../../../../context/PlaceSelectionContext';
import { cancelLayerRemoval, scheduleLayerRemoval } from '../lifecycle/lifecycle';

import addPlaceMarkers from './placeMarkers/addPlaceMarkers';
import animateLayerEntry from './markerTransitions/animateLayerEntry';
import animateLayerExit from './markerTransitions/animateLayerExit';
import sortTileMarkerRegistry from './sortTileMarkerRegistry';
import sortPlaceMarkerRegistry from './sortPlaceMarkerRegistry';

export type PlaceMarkerRegistry = Map<string, L.Marker>;
export interface PlacesLayer {
  syncLayer: (places: TilePlacePreview[], replaceAll?: boolean, firstEntry?: boolean) => void,
  removeLayer: (curRes: number, densityTiles: TileDensity[]) => void,
  removeMarkerFromLayer: (placeIds: Set<string>) => void,
  cancelScheduledRemoval: () => void,
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
) : PlacesLayer => {

  const { setSelectedPlaceId } = usePlaceSelection();

  const markerRef = useRef<PlaceMarkerRegistry>(new Map());
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRemovalRef = useRef<L.Marker[]>([]);


  // ── Public API ─────────────────────────────────────────────────────────────

  // CANCEL PENDING REMOVAL
  const cancelScheduledRemoval = useCallback(() => {
    cancelLayerRemoval(layerRef.current, cleanupTimerRef, pendingRemovalRef);
  }, []);
  // SCHEDULE REMOVAL
  const scheduleRemoval = useCallback((layer:L.LayerGroup, markers: L.Marker[], delayMs: number) => {
    scheduleLayerRemoval(
      layer, markers, delayMs, // delayMs
      cleanupTimerRef, // timerRef
      pendingRemovalRef, // pendingRef
    );
  }, []);
  // RESET LAYER STATE
  const resetLayerState = useCallback(() => {
    markerRef.current = new Map();
  }, []);

  // DENSITY → PLACES + PLACES PAN
  // First entry: burst density pins, fly place pins in from their host tile, then add all place markers.
  // Subsequent calls while in places mode (panning): only add place IDs not already tracked 
  // — existing markers persist until a res change.
  const syncLayer = useCallback((
    places: TilePlacePreview[],
    replaceAll?: boolean,
    firstEntry?: boolean,
  ): void => {

    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    // CLEAR ALL PLACE MARKERS
    if ((replaceAll || firstEntry) && markerRef.current.size > 0) {
      // Cancel pending removal orders - avoid conflict
      cancelScheduledRemoval();
      // Clear Layer - Instant Removal
      markerRef.current.forEach((marker) => layer.removeLayer(marker));
      // Clear Marker Ref Map
      markerRef.current.clear();
    }

    // FIRST ENTRY: DENSITY -> PLACES 
    if (firstEntry) {

      // 1.CANCEL PENDING REMOVALS - Tile + Places
      cancelScheduledRemoval();
      density.cancelScheduledRemoval();

      // 2.EXTRACT + RESET DENSITY LAYER
      // const outgoings = new Map(density.markerRef.current);
      const { outgoings, retained } = sortTileMarkerRegistry(density.markerRef.current);
      const outgoingRes = density.currentResRef.current;
      density.resetLayerState();

      // 3.INITIALIZE PLACE MARKER REGISTRY
      markerRef.current = new Map(retained);
      
      // 4. ANIMATE TRANSITION
      const incomingPlaces = places.filter((p) => !markerRef.current.has(p.id));
      animateLayerEntry({
        map, layer, places: incomingPlaces, markerRef,
        outgoingTileMarker: outgoings, outgoingRes,
        onPlaceClick: setSelectedPlaceId,
      });

      // 5.SCHEDULE REMOVAL OF DENSITY MARKERS
      // immediately after paint and not before
      const outgoingMarkers = Array.from(outgoings.values()).map(v => v.Marker);
      scheduleRemoval( layer, outgoingMarkers, 0 );
    }

    // SUBSEQUENT UPDATE: PLACES → PLACES
    // only add new markers, persist existing ones ─────────
    else {
      // FILTER OUT EXISTING MARKERS
      const newPlaces = places.filter((p) => !markerRef.current.has(p.id));
      if (!newPlaces.length) return;

      // CREATE REMAINING NEW MARKERS + UPDATE REF MAP
      const newMarkers = addPlaceMarkers(layer, newPlaces, setSelectedPlaceId, undefined);
      newMarkers.forEach(({ PlaceId, Marker }) => markerRef.current.set(PlaceId, Marker));
    }
  }, [
    density.markerRef,
    density.currentResRef,
    density.resetLayerState, 
    density.cancelScheduledRemoval, 
    cancelScheduledRemoval, 
    setSelectedPlaceId, 
    scheduleRemoval
  ]);

  // PLACES -> DENSITY
  // Places fly back to their host tile
  // New density pins are added immediately alongside the exiting places
  const removeLayer = useCallback((resolution: number, incomingTiles: TileDensity[]): void => {

    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    // 1.CANCEL PENDING REMOVALS - Tile + Places
    density.cancelScheduledRemoval();
    cancelScheduledRemoval();
    
    // 2.EXTRACT + RESET PLACE + TILE LAYER STATE
    // const outgoings = new Map(markerRef.current);
    const { outgoings, retained } = sortPlaceMarkerRegistry(incomingTiles, markerRef.current);
    resetLayerState();
    density.resetLayerState();
    density.currentResRef.current = resolution;


    // 3. HANDOFF RETAINED MARKERS TO DENSITY LAYER
    density.markerRef.current = retained;    

    // 4. ANIMATE TRANSITION: PLACES -> DENSITY 
    // Animate Transition by Updating Outgoing Markers CSS State
    animateLayerExit(map, resolution, outgoings);

    // 5. ADD NEW DENSITY MARKERS
    density.addMarkersToLayer(resolution, incomingTiles);
    
    // 6. SCHEDULE REMOVAL OF PLACE MARKERS
    const outgoingMarkers = Array.from(outgoings.values());
    scheduleRemoval( layer, outgoingMarkers, 400 );
  }, [
    density.currentResRef,
    density.markerRef,
    density.resetLayerState,
    density.addMarkersToLayer,
    density.cancelScheduledRemoval,
    resetLayerState,
    cancelScheduledRemoval, 
    scheduleRemoval
  ]);

  // REMOVE MARKERS
  const removeMarkerFromLayer = useCallback((placeIds: Set<string>): void => {
    const layer = layerRef.current;
    if (!layer) return;

    placeIds.forEach((placeId) => {
      if (!markerRef.current.has(placeId)) return;
      const marker = markerRef.current.get(placeId);
      if (!marker) return;

      layer.removeLayer(marker);
      markerRef.current.delete(placeId);
    });
  }, []);

  return useMemo(() => ({
    syncLayer,
    removeLayer,
    removeMarkerFromLayer,
    cancelScheduledRemoval,
    resetLayerState,
  }), [
    syncLayer,
    removeLayer,
    removeMarkerFromLayer,
    cancelScheduledRemoval,
    resetLayerState,
  ]);
};

export default usePlacesLayer;
