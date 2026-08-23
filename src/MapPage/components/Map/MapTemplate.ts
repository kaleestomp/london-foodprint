import type maplibregl from 'maplibre-gl';

// London geographic constants in MapLibre [lng, lat] order.
export const LONDON_CENTER: [number, number] = [-0.09, 51.505];
export const LONDON_INITIAL_ZOOM = 12;
export const LONDON_MIN_ZOOM = 10;
export const LONDON_MAX_ZOOM = 20;
export const LONDON_BOUNDS: [[number, number], [number, number]] = [
  [-0.52, 51.28],
  [0.34, 51.70],
];

export const isWithinLondonBounds = (lat: number, lon: number): boolean => {
  return (
    lon >= LONDON_BOUNDS[0][0] &&
    lon <= LONDON_BOUNDS[1][0] &&
    lat >= LONDON_BOUNDS[0][1] &&
    lat <= LONDON_BOUNDS[1][1]
  );
};

// Kept for useMapResizeSync compatibility — enforces London min zoom on resize.
export const syncMinZoomToWorldExtent = (map: maplibregl.Map) => {
  if (map.getZoom() < LONDON_MIN_ZOOM) {
    map.setZoom(LONDON_MIN_ZOOM);
  }
};

