import type maplibregl from 'maplibre-gl';

export type LatLngTuple = [number, number];

export const WORLD_RING: LatLngTuple[] = [[90, -360], [90, 360], [-90, 360], [-90, -360]];
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

const toGeoJsonPolygon = (rings: LatLngTuple[]) => {
    const closedRing = closeRing(rings);
    return closedRing.map(([lat, lng]) => [lng, lat]);
};

const buildPolygonFeature = (rings: LatLngTuple[][]) => ({
    type: 'Feature' as const,
    properties: {},
    geometry: {
        type: 'Polygon' as const,
        coordinates: rings.map(toGeoJsonPolygon),
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

// export const MaskPane = (_map: unknown): string => 'bubble-avatar-mask-pane';
export const MaskPane = (map: L.Map): string => {
    const MASK_PANE = 'bubble-avatar-mask-pane';
    const pane = map.getPane(MASK_PANE) ?? map.createPane(MASK_PANE);
    pane.style.zIndex = '650';
    pane.style.pointerEvents = 'none';
    return MASK_PANE;
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
) : PolygonMaskInstance => {
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
    };

    map.on('styledata', ensureLayer);
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

