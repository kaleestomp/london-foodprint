import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

import zoomToResolution from '../utils/zoomToResolution';
import useIsMobile from '../../../../../utils/browser/useIsMobile';
import { MOBILE_PEEK_PX } from '../../../PullUpPanel/SnapHooks/config';

const DESKTOP_LEFT_OFFSET_PX = 360;

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
  debounceMs: number,
): TopPlacesViewportParams | null => {
  const isMobile = useIsMobile();
  const [viewportParams, setViewportParams] = useState<TopPlacesViewportParams | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!enabled || !map) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      setViewportParams(null);
      return;
    }

    const update = (): void => {
      const mapSize = map.getSize();
      const desktopLeftOffset = !isMobile ? DESKTOP_LEFT_OFFSET_PX : 0;
      const mobileBottomOffset = isMobile ? MOBILE_PEEK_PX + 56 : 0;
      const leftOffset = Math.max(0, Math.min(desktopLeftOffset, mapSize.x - 1));
      const bottomOffset = Math.max(0, Math.min(mobileBottomOffset, mapSize.y - 1));

      const topLeft = map.containerPointToLatLng(L.point(leftOffset, 0));
      const bottomRight = map.containerPointToLatLng(L.point(mapSize.x, mapSize.y - bottomOffset));
      const zoom = map.getZoom();

      setViewportParams({
        sw_lat: Math.min(topLeft.lat, bottomRight.lat),
        sw_lng: Math.min(topLeft.lng, bottomRight.lng),
        ne_lat: Math.max(topLeft.lat, bottomRight.lat),
        ne_lng: Math.max(topLeft.lng, bottomRight.lng),
        res: zoomToResolution(zoom),
      });
    };

    const scheduleMoveUpdate = (): void => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        update();
        debounceTimerRef.current = null;
      }, debounceMs);
    };

    const updateImmediately = (): void => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      update();
    };

    updateImmediately();
    map.on('move', scheduleMoveUpdate);
    map.on('zoomend', updateImmediately);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      map.off('move', scheduleMoveUpdate);
      map.off('zoomend', updateImmediately);
    };
  }, [enabled, mapRef, debounceMs, isMobile]);

  return viewportParams;
};

export default useTopPlacesViewport;
