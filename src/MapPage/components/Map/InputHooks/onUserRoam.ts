import { useEffect, useRef, useState } from 'react';
import type maplibregl from 'maplibre-gl';

import { useIsMobileCtx } from '../../../../context/IsMobileContext';
import readViewportParams from './readViewportParams/readViewportParams';
import { type ViewportBounds } from './readViewportParams/getBucketedViewportBounds/snapViewportLatLng';

const THROTTLE_MS = 250;

/**
 * Tracks map viewport and emits TilesParams whenever the user pans or zooms.
 * `resolveRes` converts the current Leaflet zoom level to the H3 resolution
 * that should be requested — callers pass different tables per viz mode.
 * 
 * BBox snap to outer bounds of zoom-responsive tiles to reduce cardinality of requests;
 * BBox scales with floor rounded zoom level only; zoom 12.5 and zoom 12.0 shares the same bbox size and h3 resolution;
 * Viewport params updates on snapped viewport change, throttled to 250ms;
 * Metrics using this viewport param will always include edges results outside of view but inside of snapped bbox;
 */
const onUserRoam = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  throttleMs: number = THROTTLE_MS,
): ViewportBounds | null => {

  const isMobile = useIsMobileCtx();

  const [viewportParams, setViewportParams] = useState<ViewportBounds | null>(null);
  const lastSignatureRef = useRef('');

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    let lastRunAt = 0;

    const reportParamsIfChanged = (): void => {
      const { params, signature } = readViewportParams(map, isMobile);
      if (signature === lastSignatureRef.current) return;

      lastSignatureRef.current = signature;
      setViewportParams(params);
    };

    const runNow = (): void => {
      reportParamsIfChanged();
      lastRunAt = performance.now();
    };

    const scheduleUpdate = (): void => {
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

    const flushUpdate = (): void => {
      if (throttleTimer) {
        clearTimeout(throttleTimer);
        throttleTimer = null;
      }
      runNow();
    };

    flushUpdate();
    map.on('move', scheduleUpdate);
    map.on('zoom', scheduleUpdate);
    map.on('moveend', flushUpdate);
    map.on('zoomend', flushUpdate);

    return () => {
      if (throttleTimer) {
        clearTimeout(throttleTimer);
        throttleTimer = null;
      }
      map.off('move', scheduleUpdate);
      map.off('zoom', scheduleUpdate);
      map.off('moveend', flushUpdate);
      map.off('zoomend', flushUpdate);
    };
  }, [mapRef, throttleMs, isMobile]);

  return viewportParams;
};

export default onUserRoam;