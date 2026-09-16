import type { Geometry, Position } from 'geojson';
import { isPosition } from './isInsideBoundary';

type Point = { lng: number; lat: number };

const distanceToStreetM = (point: Point, geometry: Geometry): number => {
    if (geometry.type === 'LineString') {
        return distanceToLineM(point, geometry.coordinates);
    }

    if (geometry.type === 'MultiLineString') {
        return Math.min(...geometry.coordinates.map((line) => distanceToLineM(point, line)));
    }

    return Number.POSITIVE_INFINITY;
};

export default distanceToStreetM;


const distanceToSegmentM = (point: Point, start: Position, end: Position): number => {
    if (!isPosition(start) || !isPosition(end)) return Number.POSITIVE_INFINITY;

    const latitudeScale = 111_320;
    const longitudeScale = latitudeScale * Math.cos(point.lat * Math.PI / 180);
    const pointX = (point.lng - start[0]) * longitudeScale;
    const pointY = (point.lat - start[1]) * latitudeScale;
    const endX = (end[0] - start[0]) * longitudeScale;
    const endY = (end[1] - start[1]) * latitudeScale;
    const segmentLengthSquared = endX ** 2 + endY ** 2;
    const projection = segmentLengthSquared === 0
        ? 0
        : Math.max(0, Math.min(1, (pointX * endX + pointY * endY) / segmentLengthSquared));
    const distanceX = pointX - projection * endX;
    const distanceY = pointY - projection * endY;

    return Math.sqrt(distanceX ** 2 + distanceY ** 2);
};

const distanceToLineM = (point: Point, coordinates: Position[]): number => {
    let minimumDistance = Number.POSITIVE_INFINITY;

    for (let index = 1; index < coordinates.length; index++) {
        minimumDistance = Math.min(
            minimumDistance,
            distanceToSegmentM(point, coordinates[index - 1], coordinates[index]),
        );
    }

    return minimumDistance;
};