import L from 'leaflet';
import { cellToParent, cellToLatLng } from 'h3-js';
import { type TileDensity } from '../../../../../request/useRequestTiles/request';

/**
 * Computes per-tile screen-space fly-in offsets for the zoom-in "explode" effect.
 *
 * For each new (child) tile, finds its parent at `oldRes`, looks up the parent
 * marker's screen position, and returns the pixel offset the child pin must START
 * at so its tip begins exactly on the parent's tip at t=0.
 *
 * Returns undefined if the conditions for the effect aren't met.
 *
 * To disable the effect entirely, simply stop calling this function and pass
 * `undefined` as `startOffsets` to `addDensityPins`.
 */
const computeExplodeOffsets = (
  map: L.Map,
  newData: TileDensity[],
  oldRes: number,
  outgoing: Map<string, L.Marker>,
): Map<string, { dx: number; dy: number }> | undefined => {
  if (!outgoing.size) return undefined;

  const offsets = new Map<string, { dx: number; dy: number }>();

  newData.forEach((d) => {
    try {
      const parentTile   = cellToParent(d.tile, oldRes);
      const parentMarker = outgoing.get(parentTile);
      if (!parentMarker) return;

      const parentPt     = map.latLngToContainerPoint(parentMarker.getLatLng());
      const [cLat, cLng] = cellToLatLng(d.tile);
      const childPt      = map.latLngToContainerPoint(L.latLng(cLat, cLng));

      offsets.set(d.tile, {
        dx: parentPt.x - childPt.x,
        dy: parentPt.y - childPt.y,
      });
    } catch {
      // cellToParent can throw for edge cells — skip silently.
    }
  });

  return offsets.size > 0 ? offsets : undefined;
};

export default computeExplodeOffsets;
