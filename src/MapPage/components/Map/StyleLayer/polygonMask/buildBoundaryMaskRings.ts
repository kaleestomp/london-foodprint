import type { Geometry } from 'geojson';
import { type LatLngTuple, WORLD_RING } from './geometry';

export const buildBoundaryMaskRings = (geometry: Geometry): LatLngTuple[][] | null => {
    if (geometry.type === 'Polygon') {
        const [outerRing] = geometry.coordinates;
        if (!outerRing) return null;
        return [WORLD_RING, outerRing.map(([lng, lat]) => [lat, lng])];
    }

    if (geometry.type === 'MultiPolygon') {
        const outerRings = geometry.coordinates
            .map(([polygon]) => polygon)
            .filter((ring): ring is NonNullable<typeof ring> => Boolean(ring))
            .map((ring) => ring.map(([lng, lat]) => [lat, lng] as LatLngTuple));
        return outerRings.length > 0 ? [WORLD_RING, ...outerRings] : null;
    }

    return null;
};

export default buildBoundaryMaskRings;