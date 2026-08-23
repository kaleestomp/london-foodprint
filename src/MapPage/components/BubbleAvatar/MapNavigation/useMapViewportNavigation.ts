import { useCallback } from 'react';
import maplibregl from 'maplibre-gl';

import { type LatLng } from '../config';

type FocusMapArgs = {
  target: LatLng;
  method: 'pan' | 'setView';
  zoom?: number;
  animate?: boolean;
  onSettled?: () => void;
  skipIfWithinMeters?: number;
  targetScreenPoint?: { x: number; y: number };
};

type UseMapViewportNavigationArgs = {
  mapRef: React.RefObject<maplibregl.Map | null>;
};

const useMapViewportNavigation = ({ mapRef }: UseMapViewportNavigationArgs) => {
  const getFocusCenter = useCallback((
    map: maplibregl.Map,
    target: LatLng,
    zoomLevel: number,
    targetScreenPoint?: { x: number; y: number },
  ) => {
    if (!targetScreenPoint) {
      return new maplibregl.LngLat(target.lng, target.lat);
    }

    const mapRect = map.getContainer().getBoundingClientRect();
    const containerPoint = new maplibregl.Point(
      targetScreenPoint.x - mapRect.left,
      targetScreenPoint.y - mapRect.top,
    );
    const containerCenter = new maplibregl.Point(mapRect.width / 2, mapRect.height / 2);
    const focusOffset = containerPoint.sub(containerCenter);

    // const projectedTarget = map.project(new maplibregl.LngLat(target.lng, target.lat));
    const targetLngLat = new maplibregl.LngLat(target.lng, target.lat);
    const currentCenterPoint = map.project(map.getCenter());
    const projectedTarget = map.project(targetLngLat);
    const zoomScale = 2 ** (zoomLevel - map.getZoom());
    const projectedAtZoom = new maplibregl.Point(
      currentCenterPoint.x + (projectedTarget.x - currentCenterPoint.x) * zoomScale,
      currentCenterPoint.y + (projectedTarget.y - currentCenterPoint.y) * zoomScale,
    );

    return map.unproject(projectedAtZoom.sub(focusOffset));
  }, []);

  const focusMap = useCallback(({
    target,
    method,
    zoom,
    animate = true,
    onSettled,
    skipIfWithinMeters,
    targetScreenPoint,
  }: FocusMapArgs) => {
    const map = mapRef.current;
    if (!map) {
      onSettled?.();
      return () => {};
    }

    const zoomLevel = zoom ?? map.getZoom();
    const focusCenter = getFocusCenter(map, target, zoomLevel, targetScreenPoint);
    const shouldSkip =
      skipIfWithinMeters != null 
      && map.getCenter().distanceTo(focusCenter) < skipIfWithinMeters 
      // && (method !== 'setView' || map.getBearing() === 0);
    if (shouldSkip) {
      onSettled?.();
      return () => {};
    }

    let cancelled = false;
    const onMoveEnd = () => {
      map.off('moveend', onMoveEnd);
      if (!cancelled) { onSettled?.(); }
    };

    if (onSettled) {
      map.on('moveend', onMoveEnd);
    }

    if (method === 'setView') {
      map.flyTo({ center: focusCenter, zoom: zoomLevel, bearing: 0, animate });
    } else {
      map.panTo(focusCenter, { animate });
    }

    return () => {
      cancelled = true;
      if (onSettled) {
        map.off('moveend', onMoveEnd);
      }
    };
  }, [getFocusCenter, mapRef]);

  return { focusMap };
};

export default useMapViewportNavigation;