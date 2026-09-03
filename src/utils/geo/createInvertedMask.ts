import type { FeatureCollection, Feature, Polygon, Geometry } from 'geojson';

export interface InvertedMaskOptions {
  /**
   * The outer world extent ring.
   * Default uses Web Mercator limits: [[-180, -85.051129], [180, -85.051129], [180, 85.051129], [-180, 85.051129], [-180, -85.051129]]
   */
  outerExtent?: [number, number][];
}

const DEFAULT_WORLD_EXTENT: [number, number][] = [
  [-180, -85.051129],
  [180, -85.051129],
  [180, 85.051129],
  [-180, 85.051129],
  [-180, -85.051129]
];

/**
 * Calculates 2D signed polygon ring area to check winding order.
 * Positive area indicates Clockwise (CW), negative indicates Counter-Clockwise (CCW).
 */
const getRingArea = (ring: number[][]): number => {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    area += (ring[i + 1][0] - ring[i][0]) * (ring[i + 1][1] + ring[i][1]);
  }
  return area;
};

/**
 * Ensures a ring is clockwise (CW) for GeoJSON RFC 7946 interior holes.
 */
const makeClockwise = (ring: number[][]): number[][] => {
  return getRingArea(ring) < 0 ? [...ring].reverse() : ring;
};

/**
 * Ensures a ring is counter-clockwise (CCW) for GeoJSON RFC 7946 exterior boundaries.
 */
const makeCounterClockwise = (ring: number[][]): number[][] => {
  return getRingArea(ring) > 0 ? [...ring].reverse() : ring;
};

const maskCache = new WeakMap<object, FeatureCollection<Polygon>>();

/**
 * Creates an inverted GeoJSON mask Polygon FeatureCollection from boundary GeoJSON data.
 * The outer ring covers the world extent, and the boundary coordinates become cutout holes.
 * Results are cached in a WeakMap by object identity for performance.
 */
export function createInvertedMaskGeoJSON(
  boundaryData: FeatureCollection | Feature | Geometry,
  options: InvertedMaskOptions = {}
): FeatureCollection<Polygon> {
  // Use cache if default options and boundaryData is an object
  if (!options.outerExtent && typeof boundaryData === 'object' && boundaryData !== null) {
    const cached = maskCache.get(boundaryData as object);
    if (cached) return cached;
  }

  const outerExtent = options.outerExtent ?? DEFAULT_WORLD_EXTENT;
  const worldRing = makeCounterClockwise(outerExtent as number[][]);

  const holes: number[][][] = [];

  const extractRings = (geom: Geometry) => {
    if (geom.type === 'Polygon') {
      if (geom.coordinates.length > 0) {
        // Exterior ring of the inner polygon becomes a cutout hole in the world mask
        holes.push(makeClockwise(geom.coordinates[0] as number[][]));
      }
    } else if (geom.type === 'MultiPolygon') {
      for (const polyCoords of geom.coordinates) {
        if (polyCoords.length > 0) {
          holes.push(makeClockwise(polyCoords[0] as number[][]));
        }
      }
    } else if (geom.type === 'GeometryCollection') {
      for (const g of geom.geometries) {
        extractRings(g);
      }
    }
  };

  if ('type' in boundaryData) {
    if (boundaryData.type === 'FeatureCollection') {
      for (const feature of boundaryData.features) {
        if (feature.geometry) {
          extractRings(feature.geometry);
        }
      }
    } else if (boundaryData.type === 'Feature') {
      if (boundaryData.geometry) {
        extractRings(boundaryData.geometry);
      }
    } else {
      extractRings(boundaryData as Geometry);
    }
  }

  const result: FeatureCollection<Polygon> = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Inverted Mask' },
        geometry: {
          type: 'Polygon',
          coordinates: [worldRing, ...holes]
        }
      }
    ]
  };

  if (!options.outerExtent && typeof boundaryData === 'object' && boundaryData !== null) {
    maskCache.set(boundaryData as object, result);
  }

  return result;
}
