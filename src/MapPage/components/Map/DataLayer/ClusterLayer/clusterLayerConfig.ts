import type { ExpressionSpecification } from 'maplibre-gl';

export const MOBILE_CLUSTER_LABEL_SIZE = [
  'interpolate', ['linear'], ['get', 'point_count'],
  10, 10,
  1000, 14,
] as ExpressionSpecification;

export const DESKTOP_CLUSTER_LABEL_SIZE = [
  'interpolate', ['linear'], ['get', 'point_count'],
  10, 14,
  1000, 20,
] as ExpressionSpecification;
