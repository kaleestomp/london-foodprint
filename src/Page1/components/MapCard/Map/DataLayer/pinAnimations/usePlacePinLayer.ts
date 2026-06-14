import { useRef } from 'react';
import L from 'leaflet';
import { latLngToCell, cellToLatLng } from 'h3-js';

import { type TileDensity, type TilePlacePreview } from '../../../../../request/useRequestTiles/request';
import addDensityPins from '../addDensityPins/addDensityPins';
import addPlaceMarkers from '../addPlacePins/addPlaceMarkers';

interface DensityRefs {
  currentResRef:    React.RefObject<number | null>;
  renderedTilesRef: React.RefObject<Set<string>>;
  markersByTileRef: React.RefObject<Map<string, L.Marker>>;
  cancelTimer:      () => void;
  resetState:       () => void;
}

/**
 * Manages place-marker transitions: fly-in from host tile, and fly-out back
 * to tile centroid when zooming out.
 *
 * Receives density refs so it can read/reset density state during mode switches.
 */
const usePlacePinLayer = (
  mapRef:      React.RefObject<L.Map | null>,
  layerRef:    React.RefObject<L.LayerGroup | null>,
  density:     DensityRefs,
) => {
  const placeMarkersByIdRef  = useRef<Map<string, L.Marker>>(new Map());
  const cleanupTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRemovalRef    = useRef<L.Marker[]>([]);

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
    placeMarkersByIdRef.current = new Map();
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const computeFlyInOffsets = (
    map:        L.Map,
    places:     TilePlacePreview[],
    resolution: number,
    outgoing:   Map<string, L.Marker>,
  ): Map<string, { dx: number; dy: number }> | undefined => {
    if (!outgoing.size) return undefined;

    const offsets = new Map<string, { dx: number; dy: number }>();
    places.forEach((place) => {
      try {
        const tile       = latLngToCell(place.lat, place.lon, resolution);
        const tileMarker = outgoing.get(tile);
        if (!tileMarker) return;

        const tilePt  = map.latLngToContainerPoint(tileMarker.getLatLng());
        const placePt = map.latLngToContainerPoint(L.latLng(place.lat, place.lon));
        offsets.set(place.id, { dx: tilePt.x - placePt.x, dy: tilePt.y - placePt.y });
      } catch { /* skip edge cells */ }
    });
    return offsets.size > 0 ? offsets : undefined;
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Handles both the initial density→places transition and subsequent pans
   * while in places mode.
   *
   * First call (placeMarkersByIdRef empty): burst density pins, fly place
   * pins in from their host tile, then add all place markers.
   *
   * Subsequent calls while in places mode (panning): only add place IDs not
   * already tracked — existing markers persist until a res change.
   */
  const transitionToPlaces = (
    places: TilePlacePreview[],
    options: { replaceAll?: boolean } = {},
  ): void => {
    const map   = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    const replaceAll = options.replaceAll === true;
    if (replaceAll && placeMarkersByIdRef.current.size > 0) {
      cancelTimer();
      placeMarkersByIdRef.current.forEach((marker) => layer.removeLayer(marker));
      placeMarkersByIdRef.current.clear();
    }

    const isFirstEntry = placeMarkersByIdRef.current.size === 0;

    if (isFirstEntry) {
      // ── Density → places ────────────────────────────────────────────────
      density.cancelTimer();
      cancelTimer();

      const resolution = density.currentResRef.current;
      const outgoing   = new Map(density.markersByTileRef.current);
      density.resetState();

      outgoing.forEach((marker) => {
        const pin = marker.getElement()?.querySelector<HTMLElement>('.density-pin');
        if (!pin) return;
        pin.classList.remove('density-pin-enter', 'density-pin-fly-in');
        pin.classList.add('density-pin-burst');
      });

      const startOffsets = resolution !== null
        ? computeFlyInOffsets(map, places, resolution, outgoing)
        : undefined;

      // Remove density pins immediately (burst is visual-only).
      setTimeout(() => outgoing.forEach((m) => layer.removeLayer(m)), 0);

      const created = addPlaceMarkers(layer, places, startOffsets);
      created.forEach(({ id, marker }) => placeMarkersByIdRef.current.set(id, marker));
    } else {
      // ── Places pan: only add new markers, persist existing ones ─────────
      const newPlaces = places.filter((p) => !placeMarkersByIdRef.current.has(p.id));
      if (!newPlaces.length) return;
      const created = addPlaceMarkers(layer, newPlaces, undefined);
      created.forEach(({ id, marker }) => placeMarkersByIdRef.current.set(id, marker));
    }
  };

  /**
   * Places → density: place pins fly back toward their H3 tile centroid;
   * new density pins are added immediately alongside the exiting places.
   */
  const transitionFromPlaces = (newRes: number, newData: TileDensity[]): void => {
    const map   = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    density.cancelTimer();
    cancelTimer();

    const outgoingPlaces = new Map(placeMarkersByIdRef.current);
    placeMarkersByIdRef.current = new Map();

    density.currentResRef.current    = newRes;
    density.markersByTileRef.current = new Map();

    outgoingPlaces.forEach((marker) => {
      const pin = marker.getElement()?.querySelector<HTMLElement>('.density-pin');
      if (!pin) return;
      try {
        const latlng         = marker.getLatLng();
        const tileId         = latLngToCell(latlng.lat, latlng.lng, newRes);
        const [tLat, tLng]   = cellToLatLng(tileId);
        const tileCentroidPt = map.latLngToContainerPoint(L.latLng(tLat, tLng));
        const placePt        = map.latLngToContainerPoint(latlng);
        pin.style.setProperty('--merge-dx', `${(tileCentroidPt.x - placePt.x).toFixed(1)}px`);
        pin.style.setProperty('--merge-dy', `${(tileCentroidPt.y - placePt.y).toFixed(1)}px`);
      } catch { /* skip */ }
      pin.classList.remove('density-pin-enter', 'density-pin-fly-in');
      pin.classList.add('density-pin-fly-out');
    });

    // Add new density pins alongside exiting place pins — no gap.
    const renderedSet = new Set<string>();
    const created = addDensityPins(layer, newData, newRes, renderedSet, undefined, map.getCenter());
    density.markersByTileRef.current = new Map(created.map(({ tile, marker }) => [tile, marker]));
    // Sync renderedTilesRef so subsequent addPins calls skip already-rendered tiles.
    // Without this, addPins sees an empty set and re-creates duplicate markers for
    // every tile, orphaning the originals in the layer with no way to remove them.
    density.renderedTilesRef.current = renderedSet;

    pendingRemovalRef.current = Array.from(outgoingPlaces.values());
    cleanupTimerRef.current = setTimeout(() => {
      outgoingPlaces.forEach((m) => layer.removeLayer(m));
      pendingRemovalRef.current = [];
      cleanupTimerRef.current = null;
    }, 400);
  };

  return { transitionToPlaces, transitionFromPlaces, cancelTimer, resetState };
};

export default usePlacePinLayer;
