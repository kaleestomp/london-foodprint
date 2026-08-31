import { useEffect, useRef, useState } from 'react';
import type maplibregl from 'maplibre-gl';

import readViewportParams from './readViewportParams';
import { useIsMobileCtx } from '../../../../../../../../context/IsMobileContext';
import { type ViewportBounds } from '../../../../../InputHooks/readViewportParams/getBucketedViewportBounds/snapViewportLatLng';

const THROTTLE_MS = 80;

const useTopPlacesViewport = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  enabled: boolean,
  throttleMs: number = THROTTLE_MS,
): ViewportBounds | null => {

  const isMobile = useIsMobileCtx();
  const [viewportParams, setViewportParams] = useState<ViewportBounds | null>(null);
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


    const reportParamIfChanged = (): void => {
      const { params, signature } = readViewportParams(map, isMobile);
      if (signature === lastSignatureRef.current) return;

      lastSignatureRef.current = signature;
      setViewportParams(params);
      // console.log(params);
    };
    const runNow = (): void => {
      reportParamIfChanged();
      lastRunAt = performance.now();
    };

    const scheduleViewportUpdate = (): void => {
      const now = performance.now();
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
