import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

import { type TilesParams } from '../../../request/useRequestTiles/useRequestTiles';
import getBucketedViewportBounds from '../DataLayer/utils/getBucketedViewportBounds';
import zoomToResolution from '../DataLayer/utils/zoomToResolution';

const RES_THRESHOLD_FOR_PLACES_ONLY = 12;
const VIEWPORT_UPDATE_THROTTLE_MS = 250;
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
  mapRef: React.RefObject<L.Map | null>,
): TilesParams | null => {

  const [viewportParams, setViewportParams] = useState<TilesParams | null>(null);
  const lastSignatureRef = useRef('');
  
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    let lastRunAt = 0;

    const readViewportParams = (): TilesParams => {
      const { sw_lat, sw_lng, ne_lat, ne_lng } = getBucketedViewportBounds(map); //zoomBucket
      const zoom = map.getZoom();
      const res = zoomToResolution(zoom);
      
      return {
        sw_lat, sw_lng, ne_lat, ne_lng, res,
        // At past 17 Zoom / 11 Res, always request individual places directly,
        ...(res >= RES_THRESHOLD_FOR_PLACES_ONLY ? { places_only: true } : {}),
      };
    };

    const buildSignature = (params: TilesParams): string => {
      return [
        params.sw_lat,
        params.sw_lng,
        params.ne_lat,
        params.ne_lng,
        params.res,
        params.places_only ? 1 : 0,
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

    const scheduleUpdate = (): void => {
      const now = Date.now();
      const elapsed = now - lastRunAt;
      const remaining = VIEWPORT_UPDATE_THROTTLE_MS - elapsed;

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
  }, [mapRef]);

  // console.log('viewportParams', viewportParams);
  return viewportParams;
};

export default onUserRoam;