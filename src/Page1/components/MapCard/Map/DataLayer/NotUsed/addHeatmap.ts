import L from 'leaflet';
import 'leaflet.heat';
import { cellToLatLng } from 'h3-js';
import { type TileDensity } from '../../../../../request/useRequestTiles/request';

type HeatmapConfig = {
  radius: number;
  blur: number;
  maxZoom: number;
  highCount: number;
  max: number;
};

// H3 resolution → heatmap params.
// maxZoom = top of each resolution's active zoom range (from map_common.py):
//   res 7 → zoom ≤ 9,  res 8 → zoom ≤ 12,  res 9 → zoom ≤ 16
const CONFIG_BY_RESOLUTION: Record<number, HeatmapConfig> = {
  7:  { radius: 80, blur: 70, maxZoom: 9,  highCount: 980, max: 0.30 },  // res9 × 1.8² radius/blur; × 7² highCount
  8:  { radius: 45, blur: 40, maxZoom: 12, highCount: 140, max: 0.25 },  // res9 × 1.8 radius/blur; × 7 highCount
  9:  { radius: 25, blur: 25, maxZoom: 16, highCount: 20,  max: 0.25 },  // reference
  10: { radius: 14, blur: 14, maxZoom: 18, highCount: 3,   max: 0.20 },  // res9 ÷ 1.8 radius/blur; ÷ 7 highCount
};
const DEFAULT_CONFIG: HeatmapConfig = { radius: 25, blur: 20, maxZoom: 12, highCount: 50, max: 0.2 };

// Accepts the full accumulated tile dataset (all panned-to tiles at current res).
// Returns the L.HeatLayer so DataLayer can track and replace it.
const addHeatmap = (
  layer: L.Map | L.LayerGroup,
  tileData: Map<string, number>,
  resolution: number,
): L.HeatLayer => {
  const { radius, blur, maxZoom, highCount, max } = CONFIG_BY_RESOLUTION[resolution] ?? DEFAULT_CONFIG;

  const heatPoints: L.HeatLatLngTuple[] = Array.from(tileData.entries()).map(([tile, count]) => {
    const [lat, lng] = cellToLatLng(tile);
    return [lat, lng, Math.min(count / highCount, 1)];
  });

  const heatLayer = L.heatLayer(heatPoints, {
    radius,
    blur,
    maxZoom,
    max,
    minOpacity: 0.25,
    gradient: {
      0.2: '#2b83ba',
      0.4: '#abdda4',
      0.6: '#ffffbf',
      0.8: '#fdae61',
      1.0: '#d7191c',
    },
  });

  heatLayer.addTo(layer);

  // Apply multiply blend so the basemap shows through the heatmap.
  // leaflet.heat stores its canvas on ._canvas after addTo().
  const canvas = (heatLayer as any)._canvas as HTMLCanvasElement | undefined;
  if (canvas) canvas.style.mixBlendMode = 'multiply';

  return heatLayer;
};

export default addHeatmap;

