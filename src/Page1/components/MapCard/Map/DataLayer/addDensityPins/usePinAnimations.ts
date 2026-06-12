import { useRef } from 'react';
import L from 'leaflet';

import { type TileDensity } from '../../../../../request/useRequestTiles/request';
import addDensityPins from './addDensityPins';
import computeExplodeOffsets from './computeExplodeOffsets'; // remove import to disable explode

/** Duration of exit animations — old markers are removed from the DOM after this. */
const EXIT_MS = 280;

/**
 * Manages all density-pin animation state and transitions.
 *
 * Returns three stable functions:
 * - `addPins`      — incremental add when the user pans (same resolution)
 * - `transitionRes` — animated resolution change (explode in / collapse out)
 * - `clearAll`     — instant wipe when switching to places mode
 */
const usePinAnimations = (
  mapRef: React.RefObject<L.Map | null>,
  layerRef: React.RefObject<L.LayerGroup | null>,
) => {
  const renderedTilesRef  = useRef<Set<string>>(new Set());
  const currentResRef     = useRef<number | null>(null);
  /** Reverse lookup: tile ID → marker, used to compute parent screen positions. */
  const markersByTileRef  = useRef<Map<string, L.Marker>>(new Map());
  const cleanupTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelTimer = () => {
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
  };

  /**
   * Incremental add: called on pan, same resolution.
   * New pins radiate outward from the current map center.
   */
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
   *
   * Zoom-in (finer res): old pins burst outward; new child pins fly in FROM
   * their parent pin's screen position (explode effect), then settle at their
   * own geo centroid.
   *
   * Zoom-out (coarser res): old pins collapse down; new parent pins pop in
   * with center-radial stagger.
   *
   * New pins are added IMMEDIATELY so there is no gap between old disappearing
   * and new appearing.
   */
  const transitionRes = (newRes: number, newData: TileDensity[]): void => {
    const map   = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    cancelTimer();

    const oldRes     = currentResRef.current;
    const zoomingIn  = oldRes !== null && newRes > oldRes;
    const outgoing   = new Map(markersByTileRef.current);

    // Update tracking state immediately so incremental adds during the
    // transition don't collide with the outgoing set.
    currentResRef.current    = newRes;
    renderedTilesRef.current = new Set();
    markersByTileRef.current = new Map();

    // ── Compute per-tile fly-in offsets for zoom-in explode ──────────────────
    // const startOffsets = undefined; // disable explode by always passing undefined
    const startOffsets = zoomingIn && oldRes !== null
      ? computeExplodeOffsets(map, newData, oldRes, outgoing)
      : undefined;

    // ── Exit animation on outgoing pins ──────────────────────────────────────
    outgoing.forEach((marker) => {
      const pin = marker.getElement()?.querySelector<HTMLElement>('.density-pin');
      if (!pin) return;
      pin.classList.remove('density-pin-enter', 'density-pin-fly-in');
      pin.classList.add(zoomingIn ? 'density-pin-burst' : 'density-pin-exit');
    });

    // ── Add new pins immediately (no gap) ────────────────────────────────────
    const created = addDensityPins(
      layer, newData, newRes, renderedTilesRef.current,
      startOffsets, map.getCenter(),
    );
    created.forEach(({ tile, marker }) => markersByTileRef.current.set(tile, marker));

    // ── Remove outgoing markers after exit animation ──────────────────────────
    cleanupTimerRef.current = setTimeout(() => {
      outgoing.forEach((marker) => layer.removeLayer(marker));
      cleanupTimerRef.current = null;
    }, EXIT_MS);
  };

  /** Instant wipe — used when switching to places mode. */
  const clearAll = (): void => {
    cancelTimer();
    layerRef.current?.clearLayers();
    renderedTilesRef.current = new Set();
    currentResRef.current    = null;
    markersByTileRef.current = new Map();
  };

  return { currentResRef, addPins, transitionRes, clearAll };
};

export default usePinAnimations;
