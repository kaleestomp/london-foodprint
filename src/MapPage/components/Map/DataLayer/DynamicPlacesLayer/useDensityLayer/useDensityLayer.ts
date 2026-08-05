import { useRef } from 'react';
import L from 'leaflet';

import { type TileDensity } from '../../../../../request/useRequestTiles/request';
import addDensityMarkers from './densityMarkers/addDensityMarkers';
import getFlyInOffsetOnEntry from './markerTransitions/getFlyInOffsetOnEntry'; // remove import to disable explode
import animateLayerClear from './animateLayerClear';
import { type SearchMask } from '../../LayerStates/maskResults';
import { cancelLayerRemoval, scheduleLayerRemoval } from '../lifecycle/lifecycle';

export interface DensityLayer {
  checkedTilesRef: React.RefObject<Set<string>>;
  densityMarkerRef: React.RefObject<Map<string, L.Marker>>;
  singletonMarkerRef: React.RefObject<Set<string>>;
  currentResRef: React.RefObject<number | null>;
  refreshLayer: (res: number, tiles: TileDensity[]) => void;
  addMarkersToLayer: (res: number, tiles: TileDensity[]) => void;
  setMaskVisibility: (searchMask: SearchMask | null) => void;
  cancelScheduledLayerRemoval: () => void;
  resetLayerState: () => void;
}

/**
 * Manages density markers on the map, including adding/removing markers, handling zoom transitions, and masking.
 * Provides a public API for interacting with the density layer.
 */
const useDensityLayer = (
  mapRef: React.RefObject<L.Map | null>,
  layerRef: React.RefObject<L.LayerGroup | null>,
  activeTopPlaceIds?: Set<string>,
): DensityLayer => {

  const checkedTilesRef = useRef<Set<string>>(new Set()); // TRACK 'CHECKED' tiles 
  // REGARDLESS of if a marker was created from it - e.g top places suppression
  const densityMarkerRef = useRef<Map<string, L.Marker>>(new Map()); // TRACK ALL TILE MARKERS
  const singletonMarkerRef = useRef<Set<string>>(new Set()); // TRACK SINGLETON MARKERS ONLY
  const currentResRef = useRef<number | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRemovalRef = useRef<L.Marker[]>([]);

  // ── Public API ─────────────────────────────────────────────────────────────
  // CANCEL PENDING REMOVAL (e.g. when switching to place markers)
  const cancelScheduledLayerRemoval = () => {
    cancelLayerRemoval( layerRef.current, cleanupTimerRef, pendingRemovalRef );
  };

  // RESET LAYER STATE (e.g. when switching to place markers)
  const resetLayerState = () => {
    densityMarkerRef.current = new Map();
    singletonMarkerRef.current = new Set();
    checkedTilesRef.current = new Set();
    currentResRef.current = null;
  };

  // REFRESH LAYER ON ZOOM / SPECIFIED CALL
  // ZOOM-IN: Old pins burst outward, new child pins fly in from parent position.
  // ZOOM-OUT: Old pins merge toward parent centroid, new parent pins pop in.
  const refreshLayer = (res: number, tiles: TileDensity[]): void => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    // Every Render is a complete reset of density layer;
    cancelScheduledLayerRemoval();

    // Check if refresh is triggered by zooming in;
    const prevRes = currentResRef.current;
    const zoomingIn = prevRes !== null && res > prevRes;
    const outgoingDensityMarkers = new Map(densityMarkerRef.current);
    const outgoingSingletonMarkers = new Set(singletonMarkerRef.current);

    // Reset state for new render
    currentResRef.current = res;
    checkedTilesRef.current = new Set();
    densityMarkerRef.current = new Map();
    singletonMarkerRef.current = new Set();

    // Animate Marker Exit: burst, merge, or fade out CSS Class
    animateLayerClear(map, res, prevRes, outgoingDensityMarkers, outgoingSingletonMarkers);

    // Add New Markers + Fly-In Entry
    const startOffsets = zoomingIn ? getFlyInOffsetOnEntry(map, outgoingDensityMarkers, prevRes, tiles) : undefined;
    const newMarkers = addDensityMarkers(layer, tiles, res, checkedTilesRef.current, activeTopPlaceIds, startOffsets);
    newMarkers.forEach(({ tile, marker, isSingleton }) => {
      densityMarkerRef.current.set(tile, marker);
      if (isSingleton) singletonMarkerRef.current.add(tile);
    });

    // Schedule Removal of Outgoing Markers After Animation Delay
    scheduleLayerRemoval(
      layer, // layer
      Array.from(outgoingDensityMarkers.values()), // markers
      zoomingIn ? 0 : 280, // delayMs
      cleanupTimerRef, // timerRef
      pendingRemovalRef, // pendingRef
    );

  };

  // ADD MARKERS ON PAN
  const addMarkersToLayer = (res: number, tiles: TileDensity[]): void => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    const created = addDensityMarkers(layer, tiles, res, checkedTilesRef.current, activeTopPlaceIds);
    created.forEach(({ tile, marker, isSingleton }) => {
      densityMarkerRef.current.set(tile, marker);
      if (isSingleton) singletonMarkerRef.current.add(tile);
    });
  };

  // MASK MARKERS
  const setMaskVisibility = (searchMask: SearchMask | null): void => {
    const center = searchMask ? L.latLng(searchMask.center.lat, searchMask.center.lng) : null;
    densityMarkerRef.current.forEach((marker) => {
      if (!searchMask || !center) {
        marker.setOpacity(1);
        return;
      }

      const distance = marker.getLatLng().distanceTo(center);
      const hidden = distance <= searchMask.radiusM;
      marker.setOpacity(hidden ? 0 : 1);
    });
  };

  return {
    checkedTilesRef,
    densityMarkerRef,
    singletonMarkerRef,
    currentResRef,
    refreshLayer,
    addMarkersToLayer,
    setMaskVisibility,
    cancelScheduledLayerRemoval,
    resetLayerState,
  };
};

export default useDensityLayer;
