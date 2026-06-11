// Zoom → H3 resolution lookup tables for the frontend.
// Each entry: [maxZoom (inclusive), resolution].
// The frontend picks a table based on the active visualization mode, then
// sends the resolved `res` directly to the API (no backend conversion needed).

export type ZoomResTable = ReadonlyArray<readonly [number, number]>;

/**
 * Grid / heatmap mode — mirrors the original backend thresholds.
 * Requests finer resolution sooner to keep hex cells small on screen.
 */
export const GRID_ZOOM_TO_RES: ZoomResTable = [
  [9,  7],
  [12, 8],
  [15, 9],
  [22, 10],
];

/**
 * Density-pins mode — stays one resolution coarser at the same zoom level
 * to keep pins readable and avoid over-plotting.
 */
export const PINS_ZOOM_TO_RES: ZoomResTable = [
  [11, 7],
  [14, 8],
  [17, 9],
  [22, 10],
];

export const zoomToResolution = (zoom: number, table: ZoomResTable): number => {
  for (const [maxZoom, res] of table) {
    if (zoom <= maxZoom) return res;
  }
  return table[table.length - 1][1];
};
