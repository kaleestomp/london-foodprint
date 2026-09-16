export type LatLngTuple = [number, number];

const MAX_MERCATOR_LAT = 85.051129;

export const WORLD_RING: LatLngTuple[] = [
    [-MAX_MERCATOR_LAT, -180],
    [-MAX_MERCATOR_LAT, 180],
    [MAX_MERCATOR_LAT, 180],
    [MAX_MERCATOR_LAT, -180],
];
