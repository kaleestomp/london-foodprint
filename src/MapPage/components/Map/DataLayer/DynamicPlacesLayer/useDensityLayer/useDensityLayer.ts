import { useCallback, useMemo, useRef } from 'react';
import L from 'leaflet';

import { useAppUI } from '../../../../../../context/AppUIContext';
import { type SearchMask } from '../../LayerStates/maskResults';
import { type TileDensity } from '../../../../../request/useRequestTiles/request';
import { cancelLayerRemoval, scheduleLayerRemoval } from '../lifecycle/lifecycle';
import addMarkers from './densityMarkers/addMarkers';
import getExplodeFlyInOffset from './markerTransitions/getExplodeFlyInOffset'; // remove import to disable explode
import animateLayerClear from './animateLayerClear';
import sortMarkerRegistry from './sortMarkerRegistry';
import getIncomingMarkers from './getIncomingMarkers';

export type TileMarkerRegistry = Map<string, { Marker: L.Marker, SingletonId: string | null }>;
export interface DensityLayer {
  markerRef: React.RefObject<TileMarkerRegistry>;
  currentResRef: React.RefObject<number | null>;
  refreshLayer: (res: number, tiles: TileDensity[]) => void;
  addMarkersToLayer: (res: number, tiles: TileDensity[]) => void;
  setMaskVisibility: (searchMask: SearchMask | null) => void;
  dedupSingletons: (placeIds: Set<string>) => void;
  cancelScheduledRemoval: () => void;
  resetLayerState: () => void;
}
/**
 * Manages density markers on the map, including adding/removing markers, handling zoom transitions, and masking.
 * Provides a public API for interacting with the density layer.
 */
const useDensityLayer = (
  mapRef: React.RefObject<L.Map | null>,
  layerRef: React.RefObject<L.LayerGroup | null>,
): DensityLayer => {
  const { mapMode } = useAppUI();
  const densityIconColor: [number, number, number] = mapMode === 'dark' ? [255, 255, 255] : [0, 0, 0];
  
  const markerRef = useRef<TileMarkerRegistry>(new Map()); // TRACK ALL TILE MARKERS
  const currentResRef = useRef<number | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRemovalRef = useRef<L.Marker[]>([]);

  // ── Public API ─────────────────────────────────────────────────────────────
  // CANCEL PENDING REMOVAL (e.g. when switching to place markers)
  const cancelScheduledRemoval = useCallback(() => {
    cancelLayerRemoval(layerRef.current, cleanupTimerRef, pendingRemovalRef);
  }, []);
  // SCHEDULE REMOVAL
  const scheduleRemoval = useCallback((layer: L.LayerGroup, markers: L.Marker[], delayMs: number) => {
    scheduleLayerRemoval(
      layer, markers, delayMs, // delayMs
      cleanupTimerRef, // timerRef
      pendingRemovalRef, // pendingRef
    );
  }, []);

  // RESET LAYER STATE (e.g. when switching to place markers)
  const resetLayerState = useCallback(() => {
    markerRef.current = new Map();
    currentResRef.current = null;
  }, []);

  // REFRESH LAYER ON ZOOM / SPECIFIED CALL
  // ZOOM-IN: Old pins burst outward, new child pins fly in from parent position.
  // ZOOM-OUT: Old pins merge toward parent centroid, new parent pins pop in.
  const refreshLayer = useCallback((resolution: number, tiles: TileDensity[]): void => {

    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    // Every Render is a complete reset of density layer;
    cancelScheduledRemoval();

    // Check if refresh is triggered by zooming in;
    const prevRes = currentResRef.current;
    const zoomingIn = prevRes !== null && resolution > prevRes;
    // const outgoingMarkers = new Map(markerRef.current);

    // FOR SINGLETONS ONLY:
    // If an old marker sees identical new marker coming in, old marker stays.
    // If a new marker sees identical old marker already exists, new marker is ignored
    const prevMarkers = markerRef.current;
    const { outgoings, retained } = sortMarkerRegistry(tiles, prevMarkers);
    const incomingTiles = getIncomingMarkers(tiles, prevMarkers);

    // RESET LAYER + HANDOFF RETAINED MARKERS TO NEW LAYER
    resetLayerState();
    markerRef.current = retained;
    currentResRef.current = resolution;

    // Animate Marker Exit: burst, merge, or fade out CSS Class
    animateLayerClear(map, resolution, prevRes, outgoings);
    
    // Add New Markers + Fly-In Entry
    const startOffsets = zoomingIn ? getExplodeFlyInOffset(map, outgoings, prevRes, incomingTiles) : undefined;
    addMarkers({
      layer, tiles: incomingTiles, resolution: resolution, startOffsets, iconColor: densityIconColor,
      markerRegistry: markerRef.current
    });

    // Schedule Removal of Outgoing Markers After Animation Delay
    const outgoingMarkers = Array.from(outgoings.values()).map(v => v.Marker);
    const delayMs = zoomingIn ? 0 : 280;
    scheduleRemoval(layer, outgoingMarkers, delayMs);

  }, [cancelScheduledRemoval, densityIconColor, resetLayerState, scheduleRemoval]);

  // ADD MARKERS ON PAN
  const addMarkersToLayer = useCallback((resolution: number, tiles: TileDensity[]): void => {

    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    addMarkers({
      layer, tiles, resolution: resolution, iconColor: densityIconColor,
      markerRegistry: markerRef.current
    });
    if (currentResRef.current !== resolution)
      currentResRef.current = resolution;

  }, [densityIconColor]);

  // DEDUP MARKERS
  // eg.singletons against top places id
  const dedupSingletons = useCallback((placeIds: Set<string>): void => {
    const layer = layerRef.current;
    if (!layer) return;

    markerRef.current.forEach(({ Marker, SingletonId }, tile) => {
      if (!(SingletonId && placeIds.has(SingletonId)))
        return;
      layer.removeLayer(Marker);
      markerRef.current.delete(tile);
    });
  }, []);

  // MASK MARKERS
  // When nearby search is active, density markers are hidden
  const setMaskVisibility = useCallback((searchMask: SearchMask | null): void => {
    const center = searchMask ? L.latLng(searchMask.center.lat, searchMask.center.lng) : null;
    markerRef.current.forEach(({ Marker }) => {
      if (!searchMask || !center) {
        Marker.setOpacity(1);
        return;
      }

      const distance = Marker.getLatLng().distanceTo(center);
      const hidden = distance <= searchMask.radiusM;
      Marker.setOpacity(hidden ? 0 : 1);
    });
  }, []);

  return useMemo(() => ({
    markerRef,
    currentResRef,
    refreshLayer,
    addMarkersToLayer,
    setMaskVisibility,
    dedupSingletons,
    cancelScheduledRemoval,
    resetLayerState,
  }), [
    refreshLayer,
    addMarkersToLayer,
    setMaskVisibility,
    dedupSingletons,
    cancelScheduledRemoval,
    resetLayerState,
  ]);
};

export default useDensityLayer;
