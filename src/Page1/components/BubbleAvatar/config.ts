export type LatLng = { lat: number; lng: number };
export type Point = { x: number; y: number };

/** Screen coordinates of BubbleButton's fixed home centre */
export const getHomeCenter = (): Point => ({
  x: window.innerWidth / 2,
  y: window.innerHeight - 88 - 45, // bottom: 88px + half of 90px height
});

/** Interaction Spec */
export const HOME_SNAP_RADIUS = 80;
export const LONGPRESS_MS = 150;
export const ZOOM_LEVEL = 14;
export const DROP_ENTRY_DELAY_MS = 200;

/** UI Specs */
// Bubble centre sits this many px from the viewport edge
export const INDICATOR_R = 26 + 14; // half of 52px + breathing room
export const CIRCLE_COLOR = '#ba160c'; // iOS system blue, for now at least
export const SEARCH_RADIUS = 1000;

/** Animation Specs */
export const JITTER = 0.55; // random jitter for x/y gaze offsets
export const MAX_OFFSET = 16; // px — max pupil travel in any direction

export const DRAG_EYE_MOVE_FREQUENCY = [500, 1000];
export const DRAG_EYE_MOVE_MULTIPLIERS = [0.6, 1.0]; // random multiplier for each step of the gaze travel
export const EYE_GAZE_ON_DRAG: Point[] = [
  { x: -MAX_OFFSET, y: -MAX_OFFSET*0.5 },
  { x: MAX_OFFSET, y: -MAX_OFFSET*0.5 },
  { x: -MAX_OFFSET, y: MAX_OFFSET*0.6 },
  { x: MAX_OFFSET, y: MAX_OFFSET*0.6 },
  { x: -MAX_OFFSET*0.5, y: -MAX_OFFSET*0.8 },
  { x: MAX_OFFSET*0.5, y: -MAX_OFFSET*0.8 },
  { x: -MAX_OFFSET*0.5, y: MAX_OFFSET*0.8 },
  { x: MAX_OFFSET*0.5, y: MAX_OFFSET*0.8 },
  { x: 0, y: MAX_OFFSET },
  { x: 0, y: -MAX_OFFSET },
  { x: 0, y: 0 },
];

export const CURSOR_FREQUENCY = 0.6;
export const IDLE_EYE_MOVE_FREQUENCY = [800, 4000]; 
export const IDLE_EYE_MOVE_MULTIPLIERS = [0.6, 1.0]; // random multiplier for each step of the gaze travel
export const EYE_GAZE_ON_IDLE: Point[] = [
    { x: -MAX_OFFSET, y: 0 },
    { x: MAX_OFFSET, y: 0 },
    { x: 0, y: MAX_OFFSET * 0.6 },
    { x: 0, y: -MAX_OFFSET * 0.6 },
    { x: 0, y: 0 },
];  

export const PIN_EYE_MOVE_FREQUENCY = [500, 2000];
export const PIN_EYE_MOVE_MULTIPLIERS = [1.0, 1.4]; // random multiplier for each step of the gaze travel
export const EYE_GAZE_ON_PIN: Point[] = [
  { x: -MAX_OFFSET, y: -MAX_OFFSET*0.5 },
  { x: MAX_OFFSET, y: -MAX_OFFSET*0.5 },
  { x: -MAX_OFFSET, y: MAX_OFFSET*0.6 },
  { x: MAX_OFFSET, y: MAX_OFFSET*0.6 },
  { x: -MAX_OFFSET*0.5, y: -MAX_OFFSET*0.8 },
  { x: MAX_OFFSET*0.5, y: -MAX_OFFSET*0.8 },
  { x: -MAX_OFFSET*0.5, y: MAX_OFFSET*0.8 },
  { x: MAX_OFFSET*0.5, y: MAX_OFFSET*0.8 },
  { x: 0, y: MAX_OFFSET },
  { x: 0, y: -MAX_OFFSET },
];