import type maplibregl from 'maplibre-gl';

import getBucketedViewportBounds from './getBucketedViewportBounds/getBucketedViewportBounds';
import { type ViewportBounds } from './getBucketedViewportBounds/snapViewportLatLng';
import { SNAP_HEIGHTS } from '../../../SlideUpDrawer/SlideUpDrawer';
import snapToPX from '../../../SlideUpDrawer/util/snapToPX';

const DESKTOP_LEFT_OFFSET_PX = 360;

const readViewportParams = (
    map: maplibregl.Map,
    isMobile: boolean,
): { params: ViewportBounds, signature: string } => {

    const canvas = map.getCanvas();
    const desktopLeftOffset = !isMobile ? DESKTOP_LEFT_OFFSET_PX : 0;
    const mobileBottomOffset = isMobile ? (snapToPX(SNAP_HEIGHTS[0]) ?? 0) + 56 : 0;
    const leftOffset = Math.max(0, Math.min(desktopLeftOffset, canvas.clientWidth - 1));
    const bottomOffset = Math.max(0, Math.min(mobileBottomOffset, canvas.clientHeight - 1));

    const params = getBucketedViewportBounds({
        map, zoomInterval: 0.5, snapFactor: 0.5,
        padding: { left: leftOffset, bottom: bottomOffset }
    }) as ViewportBounds;
    const signature: string = Object.values(params).join('|');

    return { params, signature };
};

export default readViewportParams;