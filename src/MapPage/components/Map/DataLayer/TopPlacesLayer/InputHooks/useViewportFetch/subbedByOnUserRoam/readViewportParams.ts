import type maplibregl from 'maplibre-gl';

import getBucketedViewportBounds from '../../../../../InputHooks/readViewportParams/getBucketedViewportBounds/getBucketedViewportBounds';
import { MOBILE_PEEK_PX } from '../../../../../../PullUpPanel/SnapHooks/config';
import { type ViewportBounds } from '../../../../../InputHooks/readViewportParams/getBucketedViewportBounds/snapViewportLatLng';

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

    const params = getBucketedViewportBounds({ 
        map, zoomInterval: 0.5, snapFactor: 0.5,  
        padding: { left:leftOffset, bottom:bottomOffset } 
    }) as ViewportBounds; /* zoomBucket omitted */
    const signature = [ params.sw_lat, params.sw_lng, params.ne_lat, params.ne_lng ].join('|');

    return { params, signature };
};

export default readViewportParams;