import L from 'leaflet';

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

export const bucketViewportBounds = (
    bounds: ViewportBounds,
    zoomLevel: number,
): ViewportBounds => {
    const bboxDegreeInterval = getBboxDegreeInterval(zoomLevel);
    return {
        sw_lat: snapDownToInterval(bounds.sw_lat, bboxDegreeInterval),
        sw_lng: snapDownToInterval(bounds.sw_lng, bboxDegreeInterval),
        ne_lat: snapUpToInterval(bounds.ne_lat, bboxDegreeInterval),
        ne_lng: snapUpToInterval(bounds.ne_lng, bboxDegreeInterval),
    };
};

const getBucketedViewportBounds = (map: L.Map): BucketedViewportBounds => {
    const zoomBucket = Math.floor(map.getZoom());
    const mapCenter = map.getCenter();
    const mapSize = map.getSize();
    const centerPoint = map.project(mapCenter, zoomBucket);

    const topLeft = map.unproject(
        L.point(centerPoint.x - mapSize.x / 2, centerPoint.y - mapSize.y / 2),
        zoomBucket,
    );
    const bottomRight = map.unproject(
        L.point(centerPoint.x + mapSize.x / 2, centerPoint.y + mapSize.y / 2),
        zoomBucket,
    );

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