import type { Geometry, Position } from 'geojson';

type Point = { lng: number; lat: number };
export const isPosition = (value: unknown): value is Position => (
    Array.isArray(value)
    && value.length >= 2
    && typeof value[0] === 'number'
    && typeof value[1] === 'number'
);

const isInsideBoundary = (point: Point, geometry: Geometry): boolean => {
    if (geometry.type === 'Polygon') {
        return pointInPolygon(point, geometry.coordinates);
    }

    if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
    }

    return false;
};

export default isInsideBoundary;




const pointInRing = (point: Point, ring: Position[]): boolean => {
    let inside = false;

    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
        const current = ring[index];
        const previousPoint = ring[previous];
        if (!isPosition(current) || !isPosition(previousPoint)) continue;

        const intersects = (
            (current[1] > point.lat) !== (previousPoint[1] > point.lat)
            && point.lng < (
                (previousPoint[0] - current[0])
                * (point.lat - current[1])
                / (previousPoint[1] - current[1])
                + current[0]
            )
        );
        if (intersects) inside = !inside;
    }

    return inside;
};

const pointInPolygon = (point: Point, rings: Position[][]): boolean => (
    rings.length > 0
    && pointInRing(point, rings[0])
    && !rings.slice(1).some((ring) => pointInRing(point, ring))
);