import { useRef } from 'react';
import L from 'leaflet';

import { type TileDensity } from '../../../../../request/useRequestTiles/request';
import addDensityPins from './addDensityPins';
import computeExplodeOffsets from '../animation/computeExplodeOffsets'; // remove import to disable explode
import computeMergeOffsets from '../animation/computeMergeOffsets';   // remove import to disable merge
import { type SearchMask } from '../../LayerStates/maskResults';
import {
  cancelDeferredLayerRemoval,
  scheduleDeferredLayerRemoval,
} from '../lifecycle/densityPlacesMarkerLifecycle';

const EXIT_DELAY = 280;
// EXIT_DELAY is really about DOM cleanup (memory/performance), not visual animation timing.
// Testing different values won't show visible changes because the animation styling already finished by then.

/**
 * Manages the density-pin layer: incremental adds and animated resolution
 * transitions (zoom-in explode / zoom-out merge).
 *
 * Exposes `markersByTileRef`, `cancelTimer`, and `resetState` so the place-pin
 * layer can coordinate transitions that cross both layers.
 *
 * @param activeTopPlaceIds - Set of place IDs already shown as top place markers.
 *                            Used to filter singleton places to prevent duplicates.
 */
const useDensityPinLayer = (
  mapRef:   React.RefObject<L.Map | null>,
  layerRef: React.RefObject<L.LayerGroup | null>,
  activeTopPlaceIds?: Set<string>,
) => {
  
  const renderedTilesRef    = useRef<Set<string>>(new Set());
  const currentResRef       = useRef<number | null>(null);
  const markersByTileRef    = useRef<Map<string, L.Marker>>(new Map());
  const singletonTileIdsRef = useRef<Set<string>>(new Set()); // tiles rendered as singleton place markers
  const cleanupTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRemovalRef   = useRef<L.Marker[]>([]);

  const cancelTimer = () => {
    cancelDeferredLayerRemoval({
      layer: layerRef.current,
      timerRef: cleanupTimerRef,
      pendingRef: pendingRemovalRef,
    });
  };

  const resetState = () => {
    renderedTilesRef.current    = new Set();
    currentResRef.current       = null;
    markersByTileRef.current    = new Map();
    singletonTileIdsRef.current = new Set();
  };

  /** Incremental add on pan — new pins radiate from map center. */
  const addPins = (tiles: TileDensity[], resolution: number): void => {
    const layer = layerRef.current;
    const map   = mapRef.current;
    if (!layer || !map) return;

    const created = addDensityPins(
      layer, tiles, resolution, renderedTilesRef.current,
      undefined, map.getCenter(), activeTopPlaceIds,
    );
    created.forEach(({ tile, marker, isSingleton }) => {
      markersByTileRef.current.set(tile, marker);
      if (isSingleton) singletonTileIdsRef.current.add(tile);
    });
  };

  const setMaskVisibility = (searchMask: SearchMask | null): void => {
    const center = searchMask ? L.latLng(searchMask.center.lat, searchMask.center.lng) : null;

    markersByTileRef.current.forEach((marker) => {
      if (!searchMask || !center) {
        marker.setOpacity(1);
        return;
      }

      const distance = marker.getLatLng().distanceTo(center);
      const hidden = distance <= searchMask.radiusM;
      marker.setOpacity(hidden ? 0 : 1);
    });
  };

  /**
   * Animated resolution transition.
   * Zoom-in: old pins burst outward, new child pins fly in from parent position.
   * Zoom-out: old pins merge toward parent centroid, new parent pins pop in.
   */
  const transitionRes = (newRes: number, newData: TileDensity[]): void => {
    const map   = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    cancelTimer();

    const oldRes    = currentResRef.current;
    const zoomingIn = oldRes !== null && newRes > oldRes;
    const outgoing  = new Map(markersByTileRef.current);
    const outgoingSingletonTileIds = new Set(singletonTileIdsRef.current);

    currentResRef.current       = newRes;
    renderedTilesRef.current    = new Set();
    markersByTileRef.current    = new Map();
    singletonTileIdsRef.current = new Set();

    const startOffsets = zoomingIn && oldRes !== null
      ? computeExplodeOffsets(map, newData, oldRes, outgoing)
      : undefined;

    const mergeOffsets = !zoomingIn && oldRes !== null
      ? computeMergeOffsets(map, outgoing, newRes)
      : undefined;

    outgoing.forEach((marker, tile) => {
      const pin = marker.getElement()?.querySelector<HTMLElement>('.density-pin');
      if (!pin) return;
      pin.classList.remove('density-pin-enter', 'density-pin-fly-in');
      if (zoomingIn) {
        pin.classList.add('density-pin-burst');
      } else if (outgoingSingletonTileIds.has(tile)) {
        // Singleton markers sit at actual place lat/lon, not the H3 centroid.
        // Skipping merge fly-out (which targets centroid) — just fade out.
        pin.classList.add('density-pin-exit');
      } else {
        const offset = mergeOffsets?.get(tile);
        if (offset) {
          pin.style.setProperty('--merge-dx', `${offset.dx.toFixed(1)}px`);
          pin.style.setProperty('--merge-dy', `${offset.dy.toFixed(1)}px`);
          pin.classList.add('density-pin-fly-out');
        } else {
          pin.classList.add('density-pin-exit');
        }
      }
    });

    const created = addDensityPins(
      layer, newData, newRes, renderedTilesRef.current,
      startOffsets, map.getCenter(), activeTopPlaceIds,
    );
    created.forEach(({ tile, marker, isSingleton }) => {
      markersByTileRef.current.set(tile, marker);
      if (isSingleton) singletonTileIdsRef.current.add(tile);
    });

    const exitDelay = zoomingIn ? 0 : EXIT_DELAY;
    scheduleDeferredLayerRemoval({
      layer,
      markers: Array.from(outgoing.values()),
      delayMs: exitDelay,
      timerRef: cleanupTimerRef,
      pendingRef: pendingRemovalRef,
    });
  };

  return {
    currentResRef,
    renderedTilesRef,
    markersByTileRef,
    singletonTileIdsRef,
    cancelTimer,
    resetState,
    addPins,
    setMaskVisibility,
    transitionRes,
  };
};

export default useDensityPinLayer;
