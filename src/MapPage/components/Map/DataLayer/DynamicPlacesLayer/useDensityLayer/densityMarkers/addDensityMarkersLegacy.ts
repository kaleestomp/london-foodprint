import L from 'leaflet';
import { cellToLatLng } from 'h3-js';
import { type TileDensity } from '../../../../../../request/useRequestTiles/request';
import densityMarkerIcon from './densityMarkerIcon';
import placeMarkerIcon from '../../usePlacesLayer/placeMarkers/placeMarkerIcon';

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
const addDensityMarkers = (
  layer: L.Map | L.LayerGroup,
  tiles: TileDensity[],
  resolution: number,
  checkedTiles: Set<string>,
  topPlaceIds?: Set<string>,
  startOffsets?: Map<string, { dx: number; dy: number }>,
  
): Array<{ tile: string; marker: L.Marker; isSingleton: boolean }> => {


  const newTiles = tiles.filter(d => !checkedTiles.has(d.tile));
  if (!newTiles.length) return [];

  // maxCount from the full response batch keeps sizes consistent across the viewport.
  // Exclude singletons from the maxCount so they don't deflate density-marker sizing.
  const maxCount = tiles.reduce((m, d) => d.count > 1 ? Math.max(m, d.count) : m, 1);
  const newMarkers: Array<{ tile: string; marker: L.Marker; isSingleton: boolean }> = [];

  newTiles.forEach((d) => {
    checkedTiles.add(d.tile);
    
    // SINGLETON MARKER
    // plot a place marker at the actual place location.
    if (d.count === 1 && d.singleton) {
      if (topPlaceIds?.has(d.singleton.id)) return;
      // Skip if this singleton place is already shown as a top place marker.
      const { lat, lon } = d.singleton;
      const icon = placeMarkerIcon(); //staggerMs = 0 for singleton place pins
      const marker = L.marker([lat, lon], { icon }).addTo(layer);
      newMarkers.push({ tile: d.tile, marker, isSingleton: true });
      // Don't apply startOffset: it is tile-centroid-relative (explode/merge), but this
      // marker sits at the actual place lat/lon — applying a centroid offset would send
      // it flying in from the wrong screen position.
      return;
    }

    // DENSITY MARKER
    // plot density marker at H3 centroid.
    const [lat, lng] = cellToLatLng(d.tile);
    const startOffset = startOffsets?.get(d.tile); 
    const icon = densityMarkerIcon(d.count, resolution, maxCount, { staggerMs: 0, startOffset });
    const marker = L.marker([lat, lng], { icon }).addTo(layer);
    newMarkers.push({ tile: d.tile, marker, isSingleton: false });
  });

  return newMarkers;
};

export default addDensityMarkers;

