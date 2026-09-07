import type geojson from 'geojson';

import type { MaptilerFeature } from '../../../GeoSearch/types';

type Bbox = [number, number, number, number]; // [w, s, e, n]

const visitPositions = (geometry: geojson.Geometry, visit: (lng: number, lat: number) => void): void => {
  switch (geometry.type) {
    case 'Point':
      visit(geometry.coordinates[0], geometry.coordinates[1]);
      break;
    case 'MultiPoint':
    case 'LineString':
      geometry.coordinates.forEach(([lng, lat]) => visit(lng, lat));
      break;
    case 'MultiLineString':
    case 'Polygon':
      geometry.coordinates.forEach((ring) => ring.forEach(([lng, lat]) => visit(lng, lat)));
      break;
    case 'MultiPolygon':
      geometry.coordinates.forEach((polygon) =>
        polygon.forEach((ring) => ring.forEach(([lng, lat]) => visit(lng, lat))));
      break;
    case 'GeometryCollection':
      geometry.geometries.forEach((g) => visitPositions(g, visit));
      break;
  }
};

/** Feature bbox as [w, s, e, n]; computed from geometry when not provided. */
const featureBbox = (feature: MaptilerFeature): Bbox | null => {
  if (feature.bbox) { return feature.bbox; }
  if (!feature.geometry) { return null; }

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  visitPositions(feature.geometry, (lng, lat) => {
    west = Math.min(west, lng);
    south = Math.min(south, lat);
    east = Math.max(east, lng);
    north = Math.max(north, lat);
  });

  if (!Number.isFinite(west) || !Number.isFinite(south) || !Number.isFinite(east) || !Number.isFinite(north)) {
    return null;
  }
  return [west, south, east, north];
};

export default featureBbox;
