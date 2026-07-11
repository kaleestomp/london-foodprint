import L from 'leaflet';
import { cellToLatLng } from 'h3-js';
import { type TileDensity } from '../../../../../request/useRequestTiles/request';
import makePinIcon, {countToSize, PIN_RANGE_BY_RESOLUTION, DEFAULT_PIN_RANGE} from './makePinIcon';
import makePlacePinIcon from '../addPlacePins/makePlacePinIcon';

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
 * @param topPlaceIds  - Set of place IDs that are already shown as top place markers.
 *                       Singleton places in this set will be skipped to avoid duplicates.
 */
const addDensityPins = (
  layer: L.Map | L.LayerGroup,
  tiles: TileDensity[],
  resolution: number,
  rendered: Set<string>,
  startOffsets?: Map<string, { dx: number; dy: number }>,
  mapCenter?: L.LatLng | null,
  topPlaceIds?: Set<string>,
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
  // Exclude singletons from the maxCount so they don't deflate density-marker sizing.
  const maxCount = tiles.reduce((m, d) => d.count > 1 ? Math.max(m, d.count) : m, 1);
  const created: Array<{ tile: string; marker: L.Marker }> = [];

  newTiles.forEach((d, i) => {
    rendered.add(d.tile);
    const staggerMs = Math.min(i, STAGGER_CAP) * STAGGER_STEP_MS;
    const startOffset = startOffsets?.get(d.tile);

    // Singleton tile: plot a place marker at the actual place location.
    // Skip if this singleton place is already shown as a top place marker.
    if (d.count === 1 && d.singleton) {
      if (topPlaceIds?.has(d.singleton.id)) {
        // Singleton place already shown as top place marker — skip to avoid duplicate
        return;
      }
      const { lat, lon } = d.singleton;
      const icon = makePlacePinIcon({ staggerMs, startOffset });
      const marker = L.marker([lat, lon], { icon }).addTo(layer);
      created.push({ tile: d.tile, marker });
      return;
    }

    // Multi-count tile: plot density marker at H3 centroid.
    const [lat, lng] = cellToLatLng(d.tile);
    const [w, h] = countToSize(d.count, maxCount, minW, maxW);
    const marker = L.marker([lat, lng], {
      icon: makePinIcon(d.count, w, h, { staggerMs, startOffset }),
    });
    marker.addTo(layer);
    created.push({ tile: d.tile, marker });
  });

  return created;
};

export default addDensityPins;
