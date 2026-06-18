import { useRef } from 'react';
import L from 'leaflet';

import { type TileDensity } from '../../../../request/useRequestTiles/request';
import addDensityPins from '../addDensityPins/addDensityPins';
import computeExplodeOffsets from './computeExplodeOffsets'; // remove import to disable explode
import computeMergeOffsets from './computeMergeOffsets';   // remove import to disable merge

const EXIT_DELAY = 280;

/**
 * Manages the density-pin layer: incremental adds and animated resolution
 * transitions (zoom-in explode / zoom-out merge).
 *
 * Exposes `markersByTileRef`, `cancelTimer`, and `resetState` so the place-pin
 * layer can coordinate transitions that cross both layers.
 */
const useDensityPinLayer = (
  mapRef:   React.RefObject<L.Map | null>,
  layerRef: React.RefObject<L.LayerGroup | null>,
) => {
  
  const renderedTilesRef = useRef<Set<string>>(new Set());
  const currentResRef    = useRef<number | null>(null);
  const markersByTileRef = useRef<Map<string, L.Marker>>(new Map());
  const cleanupTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRemovalRef  = useRef<L.Marker[]>([]);

  const cancelTimer = () => {
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
      // Flush any markers that were waiting on the deferred cleanup.
      const layer = layerRef.current;
      if (layer) pendingRemovalRef.current.forEach((m) => layer.removeLayer(m));
      pendingRemovalRef.current = [];
    }
  };

  const resetState = () => {
    renderedTilesRef.current = new Set();
    currentResRef.current    = null;
    markersByTileRef.current = new Map();
  };

  /** Incremental add on pan — new pins radiate from map center. */
  const addPins = (tiles: TileDensity[], resolution: number): void => {
    const layer = layerRef.current;
    const map   = mapRef.current;
    if (!layer || !map) return;

    const created = addDensityPins(
      layer, tiles, resolution, renderedTilesRef.current,
      undefined, map.getCenter(),
    );
    created.forEach(({ tile, marker }) => markersByTileRef.current.set(tile, marker));
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

    currentResRef.current    = newRes;
    renderedTilesRef.current = new Set();
    markersByTileRef.current = new Map();

    const startOffsets = zoomingIn && oldRes !== null
      ? computeExplodeOffsets(map, newData, oldRes, outgoing)
      : undefined;

    const mergeOffsets = !zoomingIn
      ? computeMergeOffsets(map, outgoing, newRes)
      : undefined;

    outgoing.forEach((marker, tile) => {
      const pin = marker.getElement()?.querySelector<HTMLElement>('.density-pin');
      if (!pin) return;
      pin.classList.remove('density-pin-enter', 'density-pin-fly-in');
      if (zoomingIn) {
        pin.classList.add('density-pin-burst');
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
      startOffsets, map.getCenter(),
    );
    created.forEach(({ tile, marker }) => markersByTileRef.current.set(tile, marker));

    const exitDelay = zoomingIn ? 0 : EXIT_DELAY;
    pendingRemovalRef.current = Array.from(outgoing.values());
    cleanupTimerRef.current = setTimeout(() => {
      outgoing.forEach((marker) => layer.removeLayer(marker));
      pendingRemovalRef.current = [];
      cleanupTimerRef.current = null;
    }, exitDelay);
  };

  return {
    currentResRef,
    renderedTilesRef,
    markersByTileRef,
    cancelTimer,
    resetState,
    addPins,
    transitionRes,
  };
};

export default useDensityPinLayer;
