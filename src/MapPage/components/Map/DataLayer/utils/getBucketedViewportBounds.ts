import L from 'leaflet';

export type BucketedViewportBounds = {
    sw_lat: number;
    sw_lng: number;
    ne_lat: number;
    ne_lng: number;
    zoomBucket: number;
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
const snapDownToInterval = (value: number, interval: number): number => Number(Math.floor(value / interval) * interval).toFixed(6) as unknown as number;
const snapUpToInterval = (value: number, interval: number): number => Number(Math.ceil(value / interval) * interval).toFixed(6) as unknown as number;

const getBucketedViewportBounds = (map: L.Map): BucketedViewportBounds => {
    const zoomBucket = Math.floor(map.getZoom());
    const bboxDegreeInterval = getBboxDegreeInterval(zoomBucket);
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
    return {
        sw_lat: snapDownToInterval(Math.min(topLeft.lat, bottomRight.lat), bboxDegreeInterval),
        sw_lng: snapDownToInterval(Math.min(topLeft.lng, bottomRight.lng), bboxDegreeInterval),
        ne_lat: snapUpToInterval(Math.max(topLeft.lat, bottomRight.lat), bboxDegreeInterval),
        ne_lng: snapUpToInterval(Math.max(topLeft.lng, bottomRight.lng), bboxDegreeInterval),
        zoomBucket,
    };
};

export default getBucketedViewportBounds;