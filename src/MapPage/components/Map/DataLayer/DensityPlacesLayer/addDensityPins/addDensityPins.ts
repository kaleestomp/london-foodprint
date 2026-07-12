import L from 'leaflet';
import { cellToLatLng } from 'h3-js';
import { type TileDensity } from '../../../../../request/useRequestTiles/request';
import makePinIcon from './makePinIcon';
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
 * @param zoom         - Current map zoom level (required for density marker sizing).
 */
const addDensityPins = (
  layer: L.Map | L.LayerGroup,
  tiles: TileDensity[],
  resolution: number,
  rendered: Set<string>,
  startOffsets?: Map<string, { dx: number; dy: number }>,
  mapCenter?: L.LatLng | null,
  topPlaceIds?: Set<string>,
  zoom: number = 12,
): Array<{ tile: string; marker: L.Marker; isSingleton: boolean }> => {
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

  // maxCount from the full response batch keeps sizes consistent across the viewport.
  // Exclude singletons from the maxCount so they don't deflate density-marker sizing.
  const maxCount = tiles.reduce((m, d) => d.count > 1 ? Math.max(m, d.count) : m, 1);
  const created: Array<{ tile: string; marker: L.Marker; isSingleton: boolean }> = [];

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
      // Don't apply startOffset: it is tile-centroid-relative (explode/merge), but this
      // marker sits at the actual place lat/lon — applying a centroid offset would send
      // it flying in from the wrong screen position.
      const icon = makePlacePinIcon({ staggerMs: 0 }); //staggerMs = 0 for singleton place pins
      const marker = L.marker([lat, lon], { icon }).addTo(layer);
      created.push({ tile: d.tile, marker, isSingleton: true });
      return;
    }

    // Multi-count tile: plot density marker at H3 centroid.
    // console.log(zoom)
    const [lat, lng] = cellToLatLng(d.tile);
    const marker = L.marker([lat, lng], {
      icon: makePinIcon(d.count, resolution, maxCount, { staggerMs, startOffset }),
    });
    marker.addTo(layer);
    created.push({ tile: d.tile, marker, isSingleton: false });
  });

  return created;
};

export default addDensityPins;
