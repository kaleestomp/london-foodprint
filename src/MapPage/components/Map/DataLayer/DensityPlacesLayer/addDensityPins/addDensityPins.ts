import L from 'leaflet';
import { cellToLatLng } from 'h3-js';
import { type TileDensity } from '../../../../../request/useRequestTiles/request';
import densityMarkerIcon from './makePinIcon';
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
  renderedTiles: Set<string>,
  startOffsets?: Map<string, { dx: number; dy: number }>,
  mapCenter?: L.LatLng | null,
  topPlaceIds?: Set<string>,
): Array<{ tile: string; marker: L.Marker; isSingleton: boolean }> => {

  // 1. FILTER OUT ALREADY-RENDERED TILES
  const newTiles = tiles.filter(d => !renderedTiles.has(d.tile));
  if (!newTiles.length) return [];

  // 2. SORT BY DISTANCE TO MAP CENTER
  if (mapCenter) {
    newTiles.sort((a, b) => {
      const [aLat, aLng] = cellToLatLng(a.tile);
      const [bLat, bLng] = cellToLatLng(b.tile);
      const aDist = L.latLng(aLat, aLng).distanceTo(mapCenter);
      const bDist = L.latLng(bLat, bLng).distanceTo(mapCenter);
      return aDist - bDist;
    });
  }

  // maxCount (HIGHIEST DENSITY) from the full response batch keeps sizes consistent across the viewport.
  // Exclude singletons from the maxCount so they don't deflate density-marker sizing.
  const maxCount = tiles.reduce((m, d) => d.count > 1 ? Math.max(m, d.count) : m, 1);
  const newMarkers: Array<{ tile: string; marker: L.Marker; isSingleton: boolean }> = [];
  newTiles.forEach((d, i) => {

    renderedTiles.add(d.tile);
    const staggerMs = Math.min(i, STAGGER_CAP) * STAGGER_STEP_MS;
    const startOffset = startOffsets?.get(d.tile);

    // SINGLETON MARKER: plot a place marker at the actual place location.
    if (d.count === 1 && d.singleton) {
      // SKIP IF ALREADY SHOWN AS TOP PLACE MARKER
      if (topPlaceIds?.has(d.singleton.id)) return;

      // PLACE ICON FOR SINGLETONS: no stagger, no startOffset.
      // Don't apply startOffset: it is tile-centroid-relative (explode/merge), but this
      // marker sits at the actual place lat/lon — applying a centroid offset would send
      // it flying in from the wrong screen position.
      const icon = makePlacePinIcon({ staggerMs: 0 }); 

      // ADD MARKER AT PLACE LOCATION
      const { lat, lon } = d.singleton;
      const singletonMarker = L.marker([lat, lon], { icon })
      singletonMarker.addTo(layer);
      newMarkers.push({ tile: d.tile, marker: singletonMarker, isSingleton: true });
      return;
    }

    // DENSITY MARKER: plot density marker at H3 centroid.
    const [lat, lng] = cellToLatLng(d.tile);
    const icon = densityMarkerIcon(d.count, resolution, maxCount, { staggerMs, startOffset });
    const marker = L.marker([lat, lng], { icon });
    marker.addTo(layer);
    newMarkers.push({ tile: d.tile, marker, isSingleton: false });
  });

  return newMarkers;
};

export default addDensityPins;
