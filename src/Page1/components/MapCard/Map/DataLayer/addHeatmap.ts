import L, { map } from 'leaflet';
import { cellToLatLng } from 'h3-js';
import { type TileDensity } from '../../../../request/useRequestTiles/request';

type HeatmapConfig = {
  radius: number;
  blur: number;
  maxZoom: number;
  highCount: number;
  // Leaflet.heat canvas threshold: gradient hits full red when the blurred
  // canvas peak reaches this fraction of the point weight. After blur, a single
  // point's peak pixel is far below 1.0, so this must be tuned per resolution.
  // Lower = more colour-saturated; raise if everything looks red.
  max: number;
};

// H3 resolution → heatmap params.
// maxZoom matches the top of each resolution's zoom range (from map_common.py):
//   res 7 → zoom ≤ 11,  res 8 → zoom ≤ 14,  res 9 → zoom ≤ 17
const CONFIG_BY_RESOLUTION: Record<number, HeatmapConfig> = {
  7: { radius: 40, blur: 35, maxZoom: 11, highCount: 300, max: 0.4 },
  8: { radius: 25, blur: 22, maxZoom: 14, highCount: 80,  max: 0.25 },
  9: { radius: 14, blur: 12, maxZoom: 17, highCount: 20,  max: 0.1 },
};
const CONFIG_BY_ZOOM_LEVEL: Record<number, any> = {
  10: { radius: 100, blur: 35},
  11: { radius: 100, blur: 30},
  12: { radius: 100, blur: 25},
  13: { radius: 100, blur: 22},
  14: { radius: 100, blur: 18},
  15: { radius: 100, blur: 15},
  16: { radius: 100, blur: 12},
};
const DEFAULT_CONFIG: HeatmapConfig = { radius: 20, blur: 18, maxZoom: 13, highCount: 50, max: 0.2 };

const addHeatmap = (layer: L.Map | L.LayerGroup, data: TileDensity[], resolution: number, zoom: number) => {
  if (!data.length) return;
  const { radius, blur } = CONFIG_BY_ZOOM_LEVEL[resolution] ?? DEFAULT_CONFIG;
  const zoomConfig = CONFIG_BY_ZOOM_LEVEL[zoom] ?? DEFAULT_CONFIG;
  const maxDensity = Math.max(...data.map(d => d.count));
  const heatPoints: L.HeatLatLngTuple[] = data.map((d) => {
    const [lat, lng] = cellToLatLng(d.tile);
    return [lat, lng, Math.min(d.count / 200, 1)];
  });

  L.heatLayer(heatPoints, {
    radius: 100,
    blur: 25,
    maxZoom: 16,
    minOpacity: 0.2,
    gradient: {
      0.2: '#2b83ba',
      0.4: '#abdda4',
      0.6: '#ffffbf',
      0.8: '#fdae61',
      1.0: '#d7191c',
    },
  }).addTo(layer);
};

export default addHeatmap;

