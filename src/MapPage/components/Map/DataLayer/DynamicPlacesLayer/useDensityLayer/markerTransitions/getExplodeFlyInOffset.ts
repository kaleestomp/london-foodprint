import type maplibregl from 'maplibre-gl';
import { cellToParent, cellToLatLng } from 'h3-js';
import { type TileDensity } from '../../../../../../request/useRequestTiles/request';
import { type TileMarkerRegistry } from '../useDensityLayer';

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
const getExplodeFlyInOffset = (
  map: maplibregl.Map,
  parentMarkers: TileMarkerRegistry,
  parentRes: number,
  tiles: TileDensity[],
): Map<string, { dx: number; dy: number }> | undefined => { 
  if (!parentMarkers.size) return undefined;

  const offsets = new Map<string, { dx: number; dy: number }>();
  tiles.forEach((d) => {
    try {
      const parentTile   = cellToParent(d.tile, parentRes);
      const parentMarker = parentMarkers.get(parentTile)?.Marker;
      if (!parentMarker) return;

      const [childLat, childLon] = d.count === 1 
      && typeof d.singleton?.lat === 'number' 
      && typeof d.singleton?.lon === 'number' 
        ? [d.singleton.lat, d.singleton.lon] 
        : cellToLatLng(d.tile);
      const childPt      = map.project([childLon, childLat]);
      const parentPt     = map.project(parentMarker.getLngLat());

      offsets.set(d.tile, { dx: parentPt.x - childPt.x, dy: parentPt.y - childPt.y });
    } catch {
      // cellToParent can throw for edge cells — skip silently.
    }
  });

  return offsets.size > 0 ? offsets : undefined;
};

export default getExplodeFlyInOffset;
