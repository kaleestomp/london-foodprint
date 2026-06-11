import L from 'leaflet';
import { cellToLatLng } from 'h3-js';
import { type TileDensity } from '../../../../request/useRequestTiles/request';

// Screen pixel size [width, height] — fixed at all zoom levels (L.divIcon is pixel-space).
const PIN_SIZE_BY_RESOLUTION: Record<number, [number, number]> = {
  7:  [44, 56],
  8:  [38, 48],
  9:  [32, 40],
  10: [28, 36],
};
const DEFAULT_PIN_SIZE: [number, number] = [32, 40];

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
 */
const addDensityPins = (
  layer: L.Map | L.LayerGroup,
  tiles: TileDensity[],
  resolution: number,
  rendered: Set<string>,
): boolean => {
  if (!tiles.length) return false;

  const [w, h] = PIN_SIZE_BY_RESOLUTION[resolution] ?? DEFAULT_PIN_SIZE;
  let added = false;

  tiles.forEach((d) => {
    if (rendered.has(d.tile)) return;
    rendered.add(d.tile);
    added = true;

    const [lat, lng] = cellToLatLng(d.tile);
    L.marker([lat, lng], { icon: makePinIcon(d.count, w, h) }).addTo(layer);
  });

  return added;
};

export default addDensityPins;
