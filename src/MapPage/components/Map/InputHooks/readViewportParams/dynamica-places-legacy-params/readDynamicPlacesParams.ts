import type maplibregl from 'maplibre-gl';

import getBucketedViewportBounds from '../getBucketedViewportBounds/getBucketedViewportBounds';
import zoomToResolution from '../../../DataLayer/utils/zoomToResolution';
import { type ViewportBounds } from '../getBucketedViewportBounds/snapViewportLatLng';
import { SNAP_HEIGHTS } from '../../../../SlideUpDrawer/SlideUpDrawer';
import snapToPX from '../../../../SlideUpDrawer/util/snapToPX';

const RES_THRESHOLD_FOR_PLACES_ONLY = 12;
const DESKTOP_LEFT_OFFSET_PX = 360;
interface TilesParams {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
  /**
   * H3 resolution resolved on the frontend (7–10). Sent directly to the API.
   */
  res: number;
  /**
   * When true, the backend skips the density table and returns up to 100 places
   * directly. Only valid (and only sent) when res === 10.
   */
  places_only?: boolean;
  cuisines?: string[];
  cost?: string[];
  venue_type?: string;
  score_basis?: 0 | 1 | 2;
  score_tier?: 0 | 1 | 2 | 3 | 4;
  agg_center?: boolean;
}

const readViewportParams = (
    map: maplibregl.Map,
    isMobile: boolean,
): { params: TilesParams, signature: string } => {

    const canvas = map.getCanvas();
    const desktopLeftOffset = !isMobile ? DESKTOP_LEFT_OFFSET_PX : 0;
    const mobileBottomOffset = isMobile ? (snapToPX(SNAP_HEIGHTS[0]) ?? 0) + 56 : 0;
    const leftOffset = Math.max(0, Math.min(desktopLeftOffset, canvas.clientWidth - 1));
    const bottomOffset = Math.max(0, Math.min(mobileBottomOffset, canvas.clientHeight - 1));

    const { sw_lat, sw_lng, ne_lat, ne_lng } = getBucketedViewportBounds({
        map, zoomInterval: 0.5, snapFactor: 0.5,
        padding: { left: leftOffset, bottom: bottomOffset }
    }) as ViewportBounds;

    const zoom = map.getZoom();
    const res = zoomToResolution(zoom);
    const places_only = res > RES_THRESHOLD_FOR_PLACES_ONLY;
    // At past 17 Zoom / 11 Res, always request individual places directly,
    const params = { sw_lat, sw_lng, ne_lat, ne_lng, res, places_only };
    const signature: string = Object.values(params).join('|');

    return { params, signature };
};

export default readViewportParams;