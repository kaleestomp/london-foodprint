import L from 'leaflet';

export const WORLD_RING: L.LatLngTuple[] = [[90, -360], [90, 360], [-90, 360], [-90, -360]];
const toRad = (deg: number) => deg * (Math.PI / 180);
const toDeg = (rad: number) => rad * (180 / Math.PI);

const projectDestination = (
    originLat: number,
    originLng: number,
    bearingDeg: number,
    distanceM: number,
): L.LatLngTuple => {

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
): L.LatLngTuple[] => {

    const points: L.LatLngTuple[] = [];
    for (let i = 0; i < segments; i += 1) {
        const bearing = (i / segments) * 360;
        points.push(projectDestination(lat, lng, bearing, radiusM));
    }
    return points;
};

export const MaskPane = (map: L.Map): string => {
    const MASK_PANE = 'bubble-avatar-mask-pane';
    const pane = map.getPane(MASK_PANE) ?? map.createPane(MASK_PANE);
    pane.style.zIndex = '650';
    pane.style.pointerEvents = 'none';
    return MASK_PANE;
};

export const PolygonMask = (
    map: L.Map,
    lat: number,
    lng: number,
) => {
    // Darkens everything outside the active search radius.
    const polygonMask = L.polygon([WORLD_RING, buildCircleHole(lat, lng, 1)], {
        stroke: false,
        fill: true,
        fillColor: '#000000',
        fillOpacity: 0,
        pane: MaskPane(map),
        interactive: false,
        fillRule: 'evenodd',
        noClip: true,
        renderer: L.canvas({ padding: 0.5 }),
    });

    return polygonMask;
};

