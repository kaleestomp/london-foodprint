import L from 'leaflet';
import { cellToBoundary } from 'h3-js';
import { type TileDensity } from '../../../../../request/useRequestTiles/request';

// Count thresholds considered "high density" per resolution — same logic as heatmap.
const HIGH_COUNT_BY_RESOLUTION: Record<number, number> = {
  7: 300,
  8: 80,
  9: 20,
  10: 8,
};
const DEFAULT_HIGH_COUNT = 50;

// Interpolate between two hex colours by fraction t ∈ [0, 1].
const lerpColour = (from: string, to: string, t: number): string => {
  const f = parseInt(from.slice(1), 16);
  const e = parseInt(to.slice(1), 16);
  const r = Math.round(((f >> 16) & 0xff) + (((e >> 16) & 0xff) - ((f >> 16) & 0xff)) * t);
  const g = Math.round(((f >> 8) & 0xff) + (((e >> 8) & 0xff) - ((f >> 8) & 0xff)) * t);
  const b = Math.round((f & 0xff) + ((e & 0xff) - (f & 0xff)) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Colour scale: low → high density (blue → green → yellow → orange → red)
const SCALE: Array<{ stop: number; colour: string }> = [
  { stop: 0.0,  colour: '#2b83ba' },
  { stop: 0.25, colour: '#abdda4' },
  { stop: 0.5,  colour: '#ffffbf' },
  { stop: 0.75, colour: '#fdae61' },
  { stop: 1.0,  colour: '#d7191c' },
];

const intensityToColour = (t: number): string => {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 1; i < SCALE.length; i++) {
    if (clamped <= SCALE[i].stop) {
      const range = SCALE[i].stop - SCALE[i - 1].stop;
      const local = (clamped - SCALE[i - 1].stop) / range;
      return lerpColour(SCALE[i - 1].colour, SCALE[i].colour, local);
    }
  }
  return SCALE[SCALE.length - 1].colour;
};

// Shared Canvas renderer — all H3 grid layers use the same canvas context,
// which is far faster than SVG (no DOM node per polygon).
const canvasRenderer = L.canvas({ padding: 0.5 });

// Apply multiply blend mode so the map basemap shows through the hex fills.
// _container is the underlying <canvas> DOM element.
(canvasRenderer as any)._initContainer = function () {
  (L.Canvas.prototype as any)._initContainer.call(this);
  this._container.style.mixBlendMode = 'multiply';
};

const addH3Grid = (layer: L.Map | L.LayerGroup, data: TileDensity[], resolution: number): void => {
  if (!data.length) return;

  const highCount = HIGH_COUNT_BY_RESOLUTION[resolution] ?? DEFAULT_HIGH_COUNT;

  data.forEach((d) => {
    const intensity = Math.min(d.count / highCount, 1);
    const colour = intensityToColour(intensity);

    // cellToBoundary returns [lat, lng] pairs
    const boundary = cellToBoundary(d.tile);
    const latLngs: L.LatLngTuple[] = boundary.map(([lat, lng]) => [lat, lng]);

    L.polygon(latLngs, {
      renderer: canvasRenderer,
      color: colour,
      fillColor: colour,
      fillOpacity: 0.25,
      weight: 0.0,
      opacity: 0.0,
    }).addTo(layer);
  });
};

export default addH3Grid;
