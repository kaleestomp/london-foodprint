import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';

type GeoJSONBoundary = FeatureCollection | Feature | Geometry | null;
type Point = [number, number];

const isPointOnSegment = (point: Point, start: Position, end: Position): boolean => {
  const [x, y] = point;
  const [startX, startY] = start;
  const [endX, endY] = end;
  const crossProduct = (y - startY) * (endX - startX) - (x - startX) * (endY - startY);

  if (Math.abs(crossProduct) > Number.EPSILON) return false;

  return x >= Math.min(startX, endX) && x <= Math.max(startX, endX)
    && y >= Math.min(startY, endY) && y <= Math.max(startY, endY);
};

const isPointInRing = (point: Point, ring: Position[]): boolean => {
  let inside = false;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const currentPoint = ring[index];
    const previousPoint = ring[previous];

    if (isPointOnSegment(point, currentPoint, previousPoint)) return true;

    const [currentX, currentY] = currentPoint;
    const [previousX, previousY] = previousPoint;
    const crossesHorizontalRay = (currentY > point[1]) !== (previousY > point[1]);
    const intersectionX = (previousX - currentX) * (point[1] - currentY)
      / (previousY - currentY) + currentX;

    if (crossesHorizontalRay && point[0] < intersectionX) inside = !inside;
  }

  return inside;
};

const isPointInPolygon = (point: Point, rings: Position[][]): boolean => {
  const [outerRing, ...holes] = rings;
  if (!outerRing || !isPointInRing(point, outerRing)) return false;

  return !holes.some((hole) => isPointInRing(point, hole));
};

const isPointInGeometry = (point: Point, geometry: Geometry | null): boolean => {
  if (!geometry) return false;

  switch (geometry.type) {
    case 'Polygon':
      return isPointInPolygon(point, geometry.coordinates);
    case 'MultiPolygon':
      return geometry.coordinates.some((polygon) => isPointInPolygon(point, polygon));
    case 'GeometryCollection':
      return geometry.geometries.some((child) => isPointInGeometry(point, child));
    default:
      return false;
  }
};

const isPointInGeoJSON = (point: Point, boundary: GeoJSONBoundary): boolean => {
  if (!boundary) return true;
  if (boundary.type === 'FeatureCollection') {
    return boundary.features.some((feature) => isPointInGeometry(point, feature.geometry));
  }
  if (boundary.type === 'Feature') {
    return isPointInGeometry(point, boundary.geometry);
  }
  return isPointInGeometry(point, boundary);
};

export default isPointInGeoJSON;
