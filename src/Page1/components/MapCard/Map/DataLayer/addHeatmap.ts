import L from 'leaflet';
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
//   res 7 → zoom ≤ 9,  res 8 → zoom ≤ 12,  res 9 → zoom ≤ 15
// Leaflet.heat fades intensity above maxZoom, so setting it to the transition
// point keeps the heatmap fully saturated throughout its active zoom range.
const CONFIG_BY_RESOLUTION: Record<number, HeatmapConfig> = {
  // 7: { radius: 100, blur: 35, maxZoom: 9,  highCount: 100, max: 0.4 },
  8: { radius: 25, blur: 22, maxZoom: 12, highCount: 80,  max: 0.25 },
  9: { radius: 35, blur: 12, maxZoom: 15, highCount: 20,  max: 0.1 },
  10: { radius: 12, blur: 6, maxZoom: 15, highCount: 20,  max: 0.1 },
};

// Per-zoom blur refinement — smooths transitions as user zooms within a res band.
const BLUR_BY_ZOOM: Record<number, number> = {
  9:  35,
  10: 30,
  11: 27,
  12: 25,
  13: 22,
  14: 18,
  15: 15,
};

const DEFAULT_CONFIG: HeatmapConfig = { radius: 100, blur: 22, maxZoom: 12, highCount: 50, max: 0.2 };

const addHeatmap = (layer: L.Map | L.LayerGroup, data: TileDensity[], resolution: number, zoom: number) => {
  if (!data.length) return;

  const { radius, maxZoom, highCount, max } = CONFIG_BY_RESOLUTION[resolution] ?? DEFAULT_CONFIG;
  // const blur = BLUR_BY_ZOOM[zoom] ?? (CONFIG_BY_RESOLUTION[resolution] ?? DEFAULT_CONFIG).blur;
  
  const heatPoints: L.HeatLatLngTuple[] = data.map((d) => {
    const [lat, lng] = cellToLatLng(d.tile);
    return [lat, lng, Math.min(d.count / 100, 1)];
  });

  L.heatLayer(heatPoints, {
    radius: radius,
    blur: 20,
    maxZoom: zoom + 2, // Keep heatmap visible one zoom level beyond maxZoom for smoother fade-out
    max: 1.0,
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

