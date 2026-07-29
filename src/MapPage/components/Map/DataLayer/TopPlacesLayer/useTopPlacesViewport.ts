import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

import zoomToResolution from '../utils/zoomToResolution';
import { bucketViewportBounds } from '../utils/getBucketedViewportBounds';
import useIsMobile from '../../../../../utils/browser/useIsMobile';
import { MOBILE_PEEK_PX } from '../../../PullUpPanel/SnapHooks/config';

const DESKTOP_LEFT_OFFSET_PX = 360;
const THROTTLE_MS = 80;

export type TopPlacesViewportParams = {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
  res: number;
};

const useTopPlacesViewport = (
  mapRef: React.RefObject<L.Map | null>,
  enabled: boolean,
  throttleMs: number = THROTTLE_MS,
): TopPlacesViewportParams | null => {
  const isMobile = useIsMobile();
  const [viewportParams, setViewportParams] = useState<TopPlacesViewportParams | null>(null);
  const lastSignatureRef = useRef('');

  useEffect(() => {
    const map = mapRef.current;
    if (!enabled || !map) {
      lastSignatureRef.current = '';
      setViewportParams(null);
      return;
    }
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    let lastRunAt = 0;

    const readViewportParams = (): TopPlacesViewportParams => {
      const mapSize = map.getSize();
      const desktopLeftOffset = !isMobile ? DESKTOP_LEFT_OFFSET_PX : 0;
      const mobileBottomOffset = isMobile ? MOBILE_PEEK_PX + 56 : 0;
      const leftOffset = Math.max(0, Math.min(desktopLeftOffset, mapSize.x - 1));
      const bottomOffset = Math.max(0, Math.min(mobileBottomOffset, mapSize.y - 1));

      const topLeft = map.containerPointToLatLng(L.point(leftOffset, 0));
      const bottomRight = map.containerPointToLatLng(L.point(mapSize.x, mapSize.y - bottomOffset));
      const zoom = map.getZoom();
      const zoomBucket = Math.floor(zoom);

      const bucketed = bucketViewportBounds({
        sw_lat: Math.min(topLeft.lat, bottomRight.lat),
        sw_lng: Math.min(topLeft.lng, bottomRight.lng),
        ne_lat: Math.max(topLeft.lat, bottomRight.lat),
        ne_lng: Math.max(topLeft.lng, bottomRight.lng),
      }, zoomBucket);

      return {
        ...bucketed,
        res: zoomToResolution(zoom),
      };
    };

    const buildSignature = (params: TopPlacesViewportParams): string => {
      return [
        params.sw_lat,
        params.sw_lng,
        params.ne_lat,
        params.ne_lng,
        params.res,
      ].join('|');
    };

    const emitIfChanged = (): void => {
      const nextParams = readViewportParams();
      const nextSignature = buildSignature(nextParams);
      if (nextSignature === lastSignatureRef.current) return;

      lastSignatureRef.current = nextSignature;
      setViewportParams(nextParams);
    };

    const runNow = (): void => {
      emitIfChanged();
      lastRunAt = Date.now();
    };

    const scheduleViewportUpdate = (): void => {
      const now = Date.now();
      const elapsed = now - lastRunAt;
      const remaining = throttleMs - elapsed;

      if (remaining <= 0) {
        if (throttleTimer) {
          clearTimeout(throttleTimer);
          throttleTimer = null;
        }
        runNow();
        return;
      }

      if (throttleTimer) return;

      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        runNow();
      }, remaining);
    };

    const flushViewportUpdate = (): void => {
      if (throttleTimer) {
        clearTimeout(throttleTimer);
        throttleTimer = null;
      }
      runNow();
    };

    flushViewportUpdate();
    map.on('move', scheduleViewportUpdate);
    map.on('zoom', scheduleViewportUpdate);
    map.on('moveend', flushViewportUpdate);
    map.on('zoomend', flushViewportUpdate);

    return () => {
      if (throttleTimer) {
        clearTimeout(throttleTimer);
        throttleTimer = null;
      }
      map.off('move', scheduleViewportUpdate);
      map.off('zoom', scheduleViewportUpdate);
      map.off('moveend', flushViewportUpdate);
      map.off('zoomend', flushViewportUpdate);
    };
  }, [enabled, mapRef, throttleMs, isMobile]);

  return viewportParams;
};

export default useTopPlacesViewport;
