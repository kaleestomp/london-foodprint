import type { FeatureCollection } from 'geojson';
import type { CityParams } from '../../context/CityContext';
import londonBoundaryJson from './london.json';

export const londonBoundary = londonBoundaryJson as FeatureCollection;
const feature = londonBoundary.features[0];
const props = feature?.properties ?? {};
export const london: CityParams = {
  city: props.name ?? 'London',
  center: props.center ?? [-0.09, 51.505],
  initZoom: props.initZoom ?? 12,
  minZoom: props.minZoom ?? 10,
  maxZoom: props.maxZoom ?? 20,
  maxBounds: props.maxBounds ?? [[-0.52, 51.28], [0.34, 51.70]],
};