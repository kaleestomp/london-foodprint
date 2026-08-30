import type maplibregl from 'maplibre-gl';

import unprojectWithoutPitch from './unprojectWithoutPitch';
import { bucketViewportBounds } from '../../../utils/getBucketedViewportBounds';
import { MOBILE_PEEK_PX } from '../../../../../PullUpPanel/SnapHooks/config';
import { type ViewportBounds } from '../../../utils/getBucketedViewportBounds';

const DESKTOP_LEFT_OFFSET_PX = 360;

const readViewportParams = (
    map: maplibregl.Map,
    isMobile: boolean,
): { 
    params: ViewportBounds; 
    signature: string 
} => {
    const canvas = map.getCanvas();
    const desktopLeftOffset = !isMobile ? DESKTOP_LEFT_OFFSET_PX : 0;
    const mobileBottomOffset = isMobile ? MOBILE_PEEK_PX + 56 : 0;
    const leftOffset = Math.max(0, Math.min(desktopLeftOffset, canvas.clientWidth - 1));
    const bottomOffset = Math.max(0, Math.min(mobileBottomOffset, canvas.clientHeight - 1));

    const zoomBucket = Math.floor(map.getZoom());
    const right = canvas.clientWidth;
    const bottom = canvas.clientHeight - bottomOffset;

    // All four corners are needed: under bearing rotation the lat/lng extremes
    // come from the other diagonal, so two corners under-cover the viewport.
    const topCorners = ([[leftOffset, 0], [right, 0]] as [number, number][]).map((point) => unprojectWithoutPitch(map, point));
    const bottomCorners = ([[leftOffset, bottom], [right, bottom]] as [number, number][]).map((point) => map.unproject(point));
    const corners = [...topCorners, ...bottomCorners];
    const lats = corners.map((corner) => corner.lat);
    const lngs = corners.map((corner) => corner.lng);

    const params = bucketViewportBounds({
        sw_lat: Math.min(...lats),
        sw_lng: Math.min(...lngs),
        ne_lat: Math.max(...lats),
        ne_lng: Math.max(...lngs),
    }, zoomBucket, 0.8);

    const signature = [ params.sw_lat, params.sw_lng, params.ne_lat, params.ne_lng ].join('|');

    return { params, signature };
};

export default readViewportParams;