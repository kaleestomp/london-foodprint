import type { Geometry } from 'geojson';
import { type LatLngTuple, WORLD_RING } from './geometry';
const toRad = (deg: number) => deg * (Math.PI / 180);
type LocalPoint = { x: number; y: number };
const MAX_STREET_MASK_POINTS = 64;

const reduceEvenly = <T,>(points: T[], maxPoints: number): T[] => {
    if (points.length <= maxPoints) return points;
    return Array.from(
        { length: maxPoints },
        (_, index) => points[Math.floor((index * points.length) / maxPoints)],
    );
};

const convexHull = (points: LocalPoint[]): LocalPoint[] => {
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (origin: LocalPoint, point: LocalPoint, next: LocalPoint) => (
        (point.x - origin.x) * (next.y - origin.y)
        - (point.y - origin.y) * (next.x - origin.x)
    );
    const lower: LocalPoint[] = [];
    for (const point of sorted) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
        lower.push(point);
    }
    const upper: LocalPoint[] = [];
    for (const point of [...sorted].reverse()) {
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
        upper.push(point);
    }
    return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};

const streetCorridor = (
    lines: number[][][],
    radiusM: number,
): LatLngTuple[] | null => {
    const usableLines = lines.filter((line) => line.length >= 2);
    if (usableLines.length === 0) return null;
    const originLng = usableLines[0][0][0];
    const originLat = usableLines[0][0][1];
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = metersPerDegreeLat * Math.cos(toRad(originLat));
    const localPoint = ([lng, lat]: number[]): LocalPoint => ({
        x: (lng - originLng) * metersPerDegreeLng,
        y: (lat - originLat) * metersPerDegreeLat,
    });
    const corners: LocalPoint[] = [];

    for (const line of usableLines) {
        for (let index = 0; index < line.length - 1; index += 1) {
            if (!line[index] || !line[index + 1]) continue;
            const start = localPoint(line[index]);
            const end = localPoint(line[index + 1]);
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const length = Math.hypot(dx, dy);
            if (length === 0) continue;
            const extensionX = (dx / length) * radiusM;
            const extensionY = (dy / length) * radiusM;
            const extendedStart = { x: start.x - extensionX, y: start.y - extensionY };
            const extendedEnd = { x: end.x + extensionX, y: end.y + extensionY };
            const normalX = (-dy / length) * radiusM;
            const normalY = (dx / length) * radiusM;
            corners.push(
                { x: extendedStart.x + normalX, y: extendedStart.y + normalY },
                { x: extendedEnd.x + normalX, y: extendedEnd.y + normalY },
                { x: extendedEnd.x - normalX, y: extendedEnd.y - normalY },
                { x: extendedStart.x - normalX, y: extendedStart.y - normalY },
            );
        }
    }

    const hull = convexHull(corners);
    if (hull.length < 3) return null;
    const finalShape = hull.map(({ x, y }) => (
        [originLat + y / metersPerDegreeLat, originLng + x / metersPerDegreeLng] as LatLngTuple
    ));
    return reduceEvenly(finalShape, MAX_STREET_MASK_POINTS);
};

const buildStreetMaskRings = (
    geometry: Geometry,
    radiusM: number,
): LatLngTuple[][] | null => {
    if (radiusM <= 0) return null;
    const lines: number[][][] = [];
    const collectLines = (current: Geometry) => {
        if (current.type === 'LineString') {
            lines.push(current.coordinates);
        } else if (current.type === 'MultiLineString') {
            lines.push(...current.coordinates);
        } else if (current.type === 'GeometryCollection') {
            current.geometries.forEach(collectLines);
        }
    };
    collectLines(geometry);
    const corridor = streetCorridor(lines, radiusM);
    return corridor ? [WORLD_RING, corridor] : null;
};

export default buildStreetMaskRings;