import L from 'leaflet';

// London geographic constants
export const LONDON_CENTER: L.LatLngTuple = [51.505, -0.09];
export const LONDON_INITIAL_ZOOM = 12;
export const LONDON_MIN_ZOOM = 10;
export const LONDON_BOUNDS = L.latLngBounds([51.28, -0.52], [51.70, 0.34]);

// Kept for useMapResizeSync compatibility — enforces London min zoom on resize.
export const syncMinZoomToWorldExtent = (map: L.Map) => {
  if (map.getZoom() < LONDON_MIN_ZOOM) {
    map.setZoom(LONDON_MIN_ZOOM);
  }
};

