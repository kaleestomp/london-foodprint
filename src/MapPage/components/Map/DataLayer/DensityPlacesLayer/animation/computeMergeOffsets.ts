import L from 'leaflet';
import { cellToParent, cellToLatLng } from 'h3-js';

/**
 * Computes per-tile screen-space fly-out offsets for the zoom-out "merge" effect.
 *
 * For each outgoing (child) marker, finds its parent centroid at `newRes` and
 * returns the pixel vector the child pin must travel so its tip ends at the
 * parent's geo position at t=1.
 *
 * To disable the effect, stop calling this function and pass `undefined` for
 * mergeOffsets in usePinAnimations — the exit will fall back to `pin-collapse`.
 */
const computeMergeOffsets = (
  map: L.Map,
  outgoing: Map<string, L.Marker>,
  newRes: number,
): Map<string, { dx: number; dy: number }> | undefined => {
  if (!outgoing.size) return undefined;

  const offsets = new Map<string, { dx: number; dy: number }>();

  outgoing.forEach((marker, tile) => {
    try {
      const parentTile        = cellToParent(tile, newRes);
      const [pLat, pLng]      = cellToLatLng(parentTile);
      const parentPt          = map.latLngToContainerPoint(L.latLng(pLat, pLng));
      const childPt           = map.latLngToContainerPoint(marker.getLatLng());

      offsets.set(tile, {
        dx: parentPt.x - childPt.x,
        dy: parentPt.y - childPt.y,
      });
    } catch {
      // cellToParent can throw for edge cells — skip silently.
    }
  });

  return offsets.size > 0 ? offsets : undefined;
};

export default computeMergeOffsets;
