import type maplibregl from 'maplibre-gl';
import { cellToParent, cellToLatLng } from 'h3-js';
import { type TileMarkerRegistry } from '../useDensityLayer';

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
const getMergeOffsetOnExit = (
  map: maplibregl.Map,
  outgoingTiles: TileMarkerRegistry,
  mergeRes: number,
): Map<string, { dx: number; dy: number }> | undefined => {
  if (!outgoingTiles.size) return undefined;

  const offsets = new Map<string, { dx: number; dy: number }>();

  outgoingTiles.forEach(({Marker}, tileId) => { //tile is map id
    try {
      const parentTile        = cellToParent(tileId, mergeRes);
      const [pLat, pLng]      = cellToLatLng(parentTile);
      const parentPt          = map.project([pLng, pLat]);
      const childPt           = map.project(Marker.getLngLat());
            
      offsets.set(tileId, { dx: parentPt.x - childPt.x, dy: parentPt.y - childPt.y });
    } catch {
      // cellToParent can throw for edge cells — skip silently.
    }
  });

  return offsets.size > 0 ? offsets : undefined;
};

export default getMergeOffsetOnExit;
