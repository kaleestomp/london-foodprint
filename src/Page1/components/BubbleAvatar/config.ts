export type LatLng = { lat: number; lng: number };

type Point = { x: number; y: number };

/** Pixel radius within which releasing the bubble counts as returning home */
export const HOME_SNAP_RADIUS = 80;
export const CIRCLE_COLOR = '#ba160c'; // iOS system blue, for now at least
export const SEARCH_RADIUS = 500;
export const LONG_PRESS_MS = 150;
export const ZOOM_LEVEL = 15;

/** Screen coordinates of BubbleButton's fixed home centre */
export const getHomeCenter = (): Point => ({
  x: window.innerWidth / 2,
  y: window.innerHeight - 88 - 32, // bottom: 88px + half of 64px height
});
