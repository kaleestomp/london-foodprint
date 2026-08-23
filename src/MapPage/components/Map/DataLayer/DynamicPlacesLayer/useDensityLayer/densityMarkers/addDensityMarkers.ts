import maplibregl from 'maplibre-gl';
import { cellToLatLng } from 'h3-js';

import densityMarkerIcon from './densityMarkerIcon';
import { type TileDensity } from '../../../../../../request/useRequestTiles/request';

/**
 * Adds a marker at each H3 centroid not yet in `rendered`. Returns the newly
 * created {tile, marker} pairs.
 *
 * @param resolution   - Current map h3 resolution level (required for density marker sizing).
 * 
 * @param startOffsets - Per-tile screen-space offset from which the pin flies in
 *                       (used for zoom-in explode effect). Triggers `density-pin-fly-in`.
 */
const addDensityMarkers = (
  map: maplibregl.Map,
  tiles: TileDensity[],
  resolution: number,
  startOffsets?: Map<string, { dx: number; dy: number }>,
  iconColor?: [number, number, number],
): Array<{ TileId: string; Marker: maplibregl.Marker }> => {
  // maxCount from the full response batch keeps sizes consistent across the viewport.
  // Exclude singletons from the maxCount so they don't deflate density-marker sizing.
  const maxCount = tiles.reduce((m, d) => d.count > 1 ? Math.max(m, d.count) : m, 1);
  const newMarkers: Array<{ TileId: string; Marker: maplibregl.Marker }> = [];

  // DENSITY MARKER
  // plot density marker at H3 centroid.
  tiles.forEach((d) => {
    const [lat, lng] = cellToLatLng(d.tile);
    const startOffset = startOffsets?.get(d.tile); 
    const icon = densityMarkerIcon(d.count, resolution, maxCount, { staggerMs: 0, startOffset }, iconColor);
    const marker = new maplibregl.Marker({ element: icon, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(map);
    newMarkers.push({ TileId: d.tile, Marker: marker });
  });

  return newMarkers;
};

export default addDensityMarkers;

