import type maplibregl from 'maplibre-gl';

import snapViewportLatLng, { type ViewportBounds } from './snapViewportLatLng';
import unprojectWithoutPitch from '../../../DataLayer/utils/unprojectWithoutPitch';
import rotateLngLat from './rotateLngLat';

const getBucketedViewportBounds = ({
    map, zoomInterval = 1, snapFactor = 1, mode = null,
    padding = { top: 0, right: 0, bottom: 0, left: 0 },
} : {
    map: maplibregl.Map,
    zoomInterval?: number, // to round the zoom level to floor
    snapFactor?: number, // to adjust the zoom-based snap increment
    mode?: 'inset' | 'outset' | null, 
    padding?: { top?: number, right?: number, bottom?: number, left?: number }
}) : ViewportBounds => {

    const zoomBucket = Math.floor(map.getZoom() / zoomInterval) * zoomInterval;
    const center = map.getCenter();
    const canvas = map.getCanvas();
    const centerPoint = map.project(center);
    const zoomScale = 2 ** (map.getZoom() - zoomBucket);

    // SCREEN BOUND
    const left = Math.round(centerPoint.x - canvas.clientWidth * zoomScale / 2) + (padding.left ?? 0);
    const right = Math.round(centerPoint.x + canvas.clientWidth * zoomScale / 2) - (padding.right ?? 0);
    const bottom = Math.round(centerPoint.y + canvas.clientHeight * zoomScale / 2) - (padding.bottom ?? 0);
    const top = Math.round(centerPoint.y - canvas.clientHeight * zoomScale / 2) + (padding.top ?? 0);
    const topLeft = [left, top];
    const topRight = [right, top];
    const bottomLeft = [left, bottom];
    const bottomRight = [right, bottom];

    // (UN)PROJECTION
    // All four corners are needed: under bearing rotation the lat/lng extremes
    // come from the other diagonal, so two corners under-cover the viewport.
    const topCorners = ([topLeft, topRight] as [number, number][]).map((point) => unprojectWithoutPitch(map, point));
    const bottomCorners = ([bottomLeft, bottomRight] as [number, number][]).map((point) => map.unproject(point));
    const corners = [...topCorners, ...bottomCorners];

    // ROTATION
    const modulus90 = map.getBearing() % 90;
    const rotation = Math.abs(modulus90) <= 45 ? modulus90 * -1
        : (90 - Math.abs(modulus90)) * (modulus90 > 0 ? 1 : -1);
    const rCorners = corners.map((corner) => rotateLngLat(corner, center, rotation));

    // SCREEN MODE
    const activeWidth = right - left;
    const activeHeight = bottom - top;
    const screenMode = Math.abs(activeWidth - activeHeight) <= 100 ? 'square'
        : activeWidth > activeHeight ? 'landscape' : 'portrait';

    const rotated = Math.ceil(rotation + modulus90) !== 0;
    const cropMode = mode ? mode 
        : !rotated && screenMode === 'landscape' ? 'lng'
        : !rotated && screenMode === 'portrait' ? 'lat'
                : rotated && screenMode === 'landscape' ? 'lat'
                : rotated && screenMode === 'portrait' ? 'lng'
                    : 'outset';

    // BUCKETING
    const lats = rCorners.map((corner) => corner.lat);
    const lngs = rCorners.map((corner) => corner.lng);

    const params = snapViewportLatLng({
        sw_lat: Math.min(...lats),
        sw_lng: Math.min(...lngs),
        ne_lat: Math.max(...lats),
        ne_lng: Math.max(...lngs),
    }, zoomBucket, snapFactor, cropMode);

    return params;
};

export default getBucketedViewportBounds;