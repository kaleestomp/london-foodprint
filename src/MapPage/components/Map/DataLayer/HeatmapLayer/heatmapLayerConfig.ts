import type { ExpressionSpecification } from 'maplibre-gl';

export const MOBILE_HEATMAP_LAYER = [
  'interpolate', ['linear'], ['zoom'],
  0, 0,
  10, 6,
  14, 14,
  17, 24,
] as ExpressionSpecification;

// Newcastle has a smaller venue footprint, so use a broader blur radius to
// make nearby points read as a continuous density field at the same zooms.
export const HEATMAP_PLUS_LAYER = [
  'interpolate', ['linear'], ['zoom'],
  0, 0,
  10, 9,
  14, 21,
  17, 36,
] as ExpressionSpecification;

export const DESKTOP_HEATMAP_LAYER = [
  'interpolate', ['linear'], ['zoom'],
  0, 0,
  10, 10,
  14, 22,
  17, 36,
] as ExpressionSpecification;

export const MOBILE_HEATMAP_OPACITY = [
  'interpolate', ['linear'], ['zoom'],
  0, 0,
  10, 0,
  12, 0.4, //0.35
  16, 0.5, //0.45
  16.5, 0,
] as ExpressionSpecification;

export const DESKTOP_HEATMAP_OPACITY = [
  'interpolate', ['linear'], ['zoom'],
  0, 0.2,
  8, 0.3,
  10, 0.4,
  12, 0.5,
  16, 0.6,
  16.5, 0,
] as ExpressionSpecification;
