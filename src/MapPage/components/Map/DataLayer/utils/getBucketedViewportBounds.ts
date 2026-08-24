import { MercatorCoordinate, type LngLat } from 'maplibre-gl';
import type maplibregl from 'maplibre-gl';

export type BucketedViewportBounds = {
    sw_lat: number;
    sw_lng: number;
    ne_lat: number;
    ne_lng: number;
    zoomBucket: number;
};

export type ViewportBounds = {
    sw_lat: number;
    sw_lng: number;
    ne_lat: number;
    ne_lng: number;
};

const getBboxDegreeInterval = (zoomBucket: number): number => {
    if (zoomBucket <= 10) return 0.5;
    if (zoomBucket <= 11) return 0.04;
    if (zoomBucket <= 12) return 0.03;
    if (zoomBucket <= 13) return 0.02;
    if (zoomBucket <= 14) return 0.01;
    if (zoomBucket <= 15) return 0.005;
    return 0.0025;
};
const snapDownToInterval = (value: number, interval: number): number => Number((Math.floor(value / interval) * interval).toFixed(6));
const snapUpToInterval = (value: number, interval: number): number => Number((Math.ceil(value / interval) * interval).toFixed(6));

const unprojectWithoutPitch = (
    map: maplibregl.Map,
    point: [number, number],
): LngLat => {
    const canvas = map.getCanvas();
    const worldSize = 512 * 2 ** map.getZoom();
    const bearingRadians = map.getBearing() * Math.PI / 180;
    const screenDeltaX = point[0] - canvas.clientWidth / 2;
    const screenDeltaY = point[1] - canvas.clientHeight / 2;
    const mapDeltaX = Math.cos(bearingRadians) * screenDeltaX - Math.sin(bearingRadians) * screenDeltaY;
    const mapDeltaY = Math.sin(bearingRadians) * screenDeltaX + Math.cos(bearingRadians) * screenDeltaY;
    const center = MercatorCoordinate.fromLngLat(map.getCenter());

    return new MercatorCoordinate(
        center.x + mapDeltaX / worldSize,
        center.y + mapDeltaY / worldSize,
    ).toLngLat();
};

export const bucketViewportBounds = (
    bounds: ViewportBounds,
    zoomLevel: number,
    intervalFactor: number = 1,
): ViewportBounds => {
    const bboxDegreeInterval = getBboxDegreeInterval(zoomLevel) * intervalFactor;
    return {
        sw_lat: snapDownToInterval(bounds.sw_lat, bboxDegreeInterval),
        sw_lng: snapDownToInterval(bounds.sw_lng, bboxDegreeInterval),
        ne_lat: snapUpToInterval(bounds.ne_lat, bboxDegreeInterval),
        ne_lng: snapUpToInterval(bounds.ne_lng, bboxDegreeInterval),
    };
};

const getBucketedViewportBounds = (map: maplibregl.Map): BucketedViewportBounds => {
    const zoomBucket = Math.floor(map.getZoom());
    const center = map.getCenter();
    const canvas = map.getCanvas();
    const centerPoint = map.project(center);
    const zoomScale = 2 ** (map.getZoom() - zoomBucket);
    const topLeftPoint: [number, number] = [
        centerPoint.x - canvas.clientWidth * zoomScale / 2,
        centerPoint.y - canvas.clientHeight * zoomScale / 2,
    ];
    const bottomRightPoint: [number, number] = [
        centerPoint.x + canvas.clientWidth * zoomScale / 2,
        centerPoint.y + canvas.clientHeight * zoomScale / 2,
    ];
    const topLeft = map.getPitch() <= 0 
        ? map.unproject(topLeftPoint) 
        : unprojectWithoutPitch(map, topLeftPoint);
    const bottomRight = map.unproject(bottomRightPoint);

    const bucketed = bucketViewportBounds({
        sw_lat: Math.min(topLeft.lat, bottomRight.lat),
        sw_lng: Math.min(topLeft.lng, bottomRight.lng),
        ne_lat: Math.max(topLeft.lat, bottomRight.lat),
        ne_lng: Math.max(topLeft.lng, bottomRight.lng),
    }, zoomBucket);

    return {
        ...bucketed,
        zoomBucket,
    };
};

export default getBucketedViewportBounds;