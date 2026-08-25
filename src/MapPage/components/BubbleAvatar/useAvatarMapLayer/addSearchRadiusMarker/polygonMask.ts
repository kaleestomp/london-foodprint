import type maplibregl from 'maplibre-gl';

export type LatLngTuple = [number, number];
type LngLatTuple = [number, number];
const BUILDING_LAYER_ID = '3d-buildings';

const MAX_MERCATOR_LAT = 85.051129;
export const WORLD_RING: LatLngTuple[] = [
    [-MAX_MERCATOR_LAT, -180],
    [-MAX_MERCATOR_LAT, 180],
    [MAX_MERCATOR_LAT, 180],
    [MAX_MERCATOR_LAT, -180],
];
const toRad = (deg: number) => deg * (Math.PI / 180);
const toDeg = (rad: number) => rad * (180 / Math.PI);

const closeRing = (ring: LatLngTuple[]): LatLngTuple[] => {
    if (ring.length === 0) return ring;

    const firstPoint = ring[0];
    const lastPoint = ring[ring.length - 1];
    const alreadyClosed =
        firstPoint[0] === lastPoint[0] &&
        firstPoint[1] === lastPoint[1];

    return alreadyClosed ? ring : [...ring, firstPoint];
};

const toGeoJsonRing = (rings: LatLngTuple[]): LngLatTuple[] => {
    const closedRing = closeRing(rings);
    return closedRing.map(([lat, lng]) => [lng, lat]);
};

const signedArea = (ring: LngLatTuple[]): number => {
    if (ring.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < ring.length - 1; i += 1) {
        const [x1, y1] = ring[i];
        const [x2, y2] = ring[i + 1];
        area += (x1 * y2) - (x2 * y1);
    }
    return area / 2;
};

const closeLngLatRing = (ring: LngLatTuple[]): LngLatTuple[] => {
    if (ring.length === 0) return ring;

    const [firstLng, firstLat] = ring[0];
    const [lastLng, lastLat] = ring[ring.length - 1];
    const alreadyClosed = firstLng === lastLng && firstLat === lastLat;

    return alreadyClosed ? ring : [...ring, [firstLng, firstLat]];
};

const orientRing = (ring: LngLatTuple[], clockwise: boolean): LngLatTuple[] => {
    const closed = closeLngLatRing(ring);
    const area = signedArea(closed);
    const isClockwise = area < 0;
    if (isClockwise === clockwise) return closed;
    return [...closed].reverse();
};

const buildPolygonFeature = (rings: LatLngTuple[][]) => ({
    type: 'Feature' as const,
    properties: {},
    geometry: {
        type: 'Polygon' as const,
        // Enforce opposite winding for outer/inner rings so the search circle
        // is always rendered as a transparent hole in the mask fill.
        coordinates: rings.map((ring, index) => {
            const lngLat = toGeoJsonRing(ring);
            const oriented = orientRing(lngLat, index > 0);
            return oriented;
        }),
    },
});

const projectDestination = (
    originLat: number,
    originLng: number,
    bearingDeg: number,
    distanceM: number,
): LatLngTuple => {

    const EARTH_RADIUS_M = 6371000;
    const angularDistance = distanceM / EARTH_RADIUS_M;
    const bearing = toRad(bearingDeg);
    const lat1 = toRad(originLat);
    const lng1 = toRad(originLng);

    const sinLat1 = Math.sin(lat1);
    const cosLat1 = Math.cos(lat1);
    const sinAngularDistance = Math.sin(angularDistance);
    const cosAngularDistance = Math.cos(angularDistance);

    const lat2 = Math.asin(
        sinLat1 * cosAngularDistance
        + cosLat1 * sinAngularDistance * Math.cos(bearing),
    );
    const lng2 = lng1 + Math.atan2(
        Math.sin(bearing) * sinAngularDistance * cosLat1,
        cosAngularDistance - sinLat1 * Math.sin(lat2),
    );

    return [toDeg(lat2), toDeg(lng2)];
};

export const buildCircleHole = (
    lat: number,
    lng: number,
    radiusM: number,
    segments = 96,
): LatLngTuple[] => {

    const points: LatLngTuple[] = [];
    for (let i = 0; i < segments; i += 1) {
        const bearing = (i / segments) * 360;
        points.push(projectDestination(lat, lng, bearing, radiusM));
    }
    return points;
};

type PolygonMaskInstance = {
    setLatLngs: (rings: LatLngTuple[][]) => void;
    setStyle: (style: { fillOpacity?: number }) => void;
    remove: () => void;
};

export const PolygonMask = (
    map: maplibregl.Map,
    lat: number,
    lng: number,
): PolygonMaskInstance => {
    const idSuffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
    const sourceId = `bubble-avatar-mask-source-${idSuffix}`;
    const layerId = `bubble-avatar-mask-layer-${idSuffix}`;
    let removed = false;
    let currentOpacity = 0;
    let currentRings: LatLngTuple[][] = [WORLD_RING, buildCircleHole(lat, lng, 1)];

    const applyData = () => {
        const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
        if (!source) return;
        source.setData(buildPolygonFeature(currentRings));
    };

    const moveMaskAboveBuildings = () => {
        if (!map.getLayer(layerId)) return;

        const layers = map.getStyle().layers ?? [];
        const buildingIndex = layers.findIndex((layer) => layer.id === BUILDING_LAYER_ID);
        if (buildingIndex < 0) {
            // No building layer active; keep mask at top of style stack.
            map.moveLayer(layerId);
            return;
        }

        const beforeId = layers[buildingIndex + 1]?.id;
        map.moveLayer(layerId, beforeId);
    };

    const ensureLayer = () => {
        if (removed || !map.isStyleLoaded()) return;

        if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
                type: 'geojson',
                data: buildPolygonFeature(currentRings),
            });
        } else {
            applyData();
        }

        if (!map.getLayer(layerId)) {
            map.addLayer({
                id: layerId,
                type: 'fill',
                source: sourceId,
                paint: {
                    'fill-color': '#000000',
                    'fill-opacity': currentOpacity,
                },
            });
        } else {
            map.setPaintProperty(layerId, 'fill-opacity', currentOpacity);
        }

        moveMaskAboveBuildings();
    };

    map.on('styledata', ensureLayer);
    // 3D buildings are added dynamically on pitch; re-run ordering after that path.
    map.on('pitch', moveMaskAboveBuildings);
    map.on('idle', moveMaskAboveBuildings);
    ensureLayer();

    const instance: PolygonMaskInstance = {
        setLatLngs: (rings) => {
            currentRings = rings;
            ensureLayer();
            applyData();
        },
        setStyle: ({ fillOpacity }) => {
            if (typeof fillOpacity !== 'number' || !Number.isFinite(fillOpacity)) return;
            currentOpacity = Math.max(0, Math.min(1, fillOpacity));
            ensureLayer();
            if (!map.getLayer(layerId)) return;
            map.setPaintProperty(layerId, 'fill-opacity', currentOpacity);
        },
        remove: () => {
            removed = true;
            map.off('styledata', ensureLayer);
            map.off('pitch', moveMaskAboveBuildings);
            map.off('idle', moveMaskAboveBuildings);
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
            if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
            }
        },
    };

    return instance;
};

