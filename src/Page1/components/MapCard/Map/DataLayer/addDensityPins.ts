import L from 'leaflet';
import { cellToLatLng } from 'h3-js';
import { type TileDensity } from '../../../../request/useRequestTiles/request';

// Per-resolution pin size range [minW, maxW] in pixels. Height = width * 1.25.
// Coarser resolutions cover larger areas so can afford bigger pins.
const PIN_RANGE_BY_RESOLUTION: Record<number, [number, number]> = {
  7:  [28, 60],
  8:  [24, 52],
  9:  [20, 44],
  10: [18, 36],
};
const DEFAULT_PIN_RANGE: [number, number] = [20, 48];

/**
 * Map a count onto [minW, maxW] using sqrt scaling so that visual pin area is
 * proportional to count (doubling count → ~41% larger pin, not 2× larger).
 * `maxCount` is the max across the current tile batch (relative sizing).
 */
const countToSize = (count: number, maxCount: number, minW: number, maxW: number): [number, number] => {
  const t = maxCount > 1 ? Math.sqrt(count / maxCount) : 1;
  const w = Math.round(minW + t * (maxW - minW));
  const h = Math.round(w * 1.25);
  return [w, h];
};

// Teardrop SVG pin with the count embedded. viewBox is always 40×50;
// width/height attributes scale it to the requested pixel size.
const makePinIcon = (count: number, w: number, h: number): L.DivIcon => {
  const label = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
  const fs = label.length > 3 ? 10 : label.length > 2 ? 12 : 14;

  return L.divIcon({
    className: '',
    iconSize:    [w, h],
    iconAnchor:  [w / 2, h],   // tip of the pin = geo point
    popupAnchor: [0, -h],
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 40 50" style="overflow:visible">
      <path d="M20,2 C10,2 2,10 2,20 C2,30 10,40 20,48 C30,40 38,30 38,20 C38,10 30,2 20,2 Z"
            fill="#1a936f" stroke="white" stroke-width="2.5"/>
      <text x="20" y="21" text-anchor="middle" dominant-baseline="central"
            fill="white" font-family="system-ui,sans-serif" font-size="${fs}" font-weight="700">${label}</text>
    </svg>`,
  });
};

/**
 * Incrementally adds a pin marker at each H3 centroid for tiles not yet in
 * `rendered`. Updates `rendered` in place. Returns true if any pin was added.
 *
 * Pin size scales with count relative to the max count in the current batch —
 * cells with more restaurants get visually larger pins.
 */
const addDensityPins = (
  layer: L.Map | L.LayerGroup,
  tiles: TileDensity[],
  resolution: number,
  rendered: Set<string>,
): boolean => {
  if (!tiles.length) return false;

  const [minW, maxW] = PIN_RANGE_BY_RESOLUTION[resolution] ?? DEFAULT_PIN_RANGE;

  // Use the max count across ALL currently accumulated tiles so that size
  // comparisons remain stable as the user pans and new tiles are added.
  const maxCount = tiles.reduce((m, d) => Math.max(m, d.count), 1);

  let added = false;

  tiles.forEach((d) => {
    if (rendered.has(d.tile)) return;
    rendered.add(d.tile);
    added = true;

    const [lat, lng] = cellToLatLng(d.tile);
    const [w, h] = countToSize(d.count, maxCount, minW, maxW);
    L.marker([lat, lng], { icon: makePinIcon(d.count, w, h) }).addTo(layer);
  });

  return added;
};

export default addDensityPins;
