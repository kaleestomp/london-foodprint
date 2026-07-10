import L from 'leaflet';
import { cellToLatLng } from 'h3-js';
import { type TileDensity } from '../../../../../request/useRequestTiles/request';
import makePinIcon, {countToSize, PIN_RANGE_BY_RESOLUTION, DEFAULT_PIN_RANGE} from './makePinIcon';

const STAGGER_STEP_MS = 0; //25
const STAGGER_CAP    = 20; // stagger capped at the 20th pin → max 500ms //20
/**
 * Adds a marker at each H3 centroid not yet in `rendered`. Returns the newly
 * created {tile, marker} pairs.
 *
 * @param startOffsets - Per-tile screen-space offset from which the pin flies in
 *                       (used for zoom-in explode effect). Triggers `density-pin-fly-in`.
 * @param mapCenter    - If provided, tiles are sorted by distance from center so
 *                       pins radiate outward on reveal.
 */
const addDensityPins = (
  layer: L.Map | L.LayerGroup,
  tiles: TileDensity[],
  resolution: number,
  rendered: Set<string>,
  startOffsets?: Map<string, { dx: number; dy: number }>,
  mapCenter?: L.LatLng | null,
): Array<{ tile: string; marker: L.Marker }> => {
  const newTiles = tiles.filter(d => !rendered.has(d.tile));
  if (!newTiles.length) return [];

  // Radial sort: pins closest to the map center appear first.
  if (mapCenter) {
    newTiles.sort((a, b) => {
      const [aLat, aLng] = cellToLatLng(a.tile);
      const [bLat, bLng] = cellToLatLng(b.tile);
      return (
        L.latLng(aLat, aLng).distanceTo(mapCenter) -
        L.latLng(bLat, bLng).distanceTo(mapCenter)
      );
    });
  }

  const [minW, maxW] = PIN_RANGE_BY_RESOLUTION[resolution] ?? DEFAULT_PIN_RANGE;
  // maxCount from the full response batch keeps sizes consistent across the viewport.
  const maxCount = tiles.reduce((m, d) => Math.max(m, d.count), 1);
  const created: Array<{ tile: string; marker: L.Marker }> = [];

  newTiles.forEach((d, i) => {
    rendered.add(d.tile);
    const [lat, lng] = cellToLatLng(d.tile);
    const [w, h] = countToSize(d.count, maxCount, minW, maxW);
    const staggerMs = Math.min(i, STAGGER_CAP) * STAGGER_STEP_MS;
    const marker = L.marker([lat, lng], {
      icon: makePinIcon(d.count, w, h, { staggerMs, startOffset: startOffsets?.get(d.tile) }),
    });
    marker.addTo(layer);
    created.push({ tile: d.tile, marker });
  });

  return created;
};

export default addDensityPins;
