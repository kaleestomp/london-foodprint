import type { MaptilerFeature } from '../../types';

export const isBoundaryGeometry = (feature: MaptilerFeature): boolean =>
  feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon';

export const isStreetGeometry = (feature: MaptilerFeature): boolean =>
  feature.geometry?.type === 'LineString' || feature.geometry?.type === 'MultiLineString';