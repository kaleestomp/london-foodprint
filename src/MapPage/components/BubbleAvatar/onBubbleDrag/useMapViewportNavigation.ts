import { useCallback } from 'react';
import L from 'leaflet';

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
  mapRef: React.RefObject<L.Map | null>;
};

const useMapViewportNavigation = ({ mapRef }: UseMapViewportNavigationArgs) => {
  const getFocusCenter = useCallback((
    map: L.Map,
    target: LatLng,
    zoomLevel: number,
    targetScreenPoint?: { x: number; y: number },
  ) => {
    if (!targetScreenPoint) {
      return L.latLng(target.lat, target.lng);
    }

    const mapRect = map.getContainer().getBoundingClientRect();
    const containerPoint = L.point(
      targetScreenPoint.x - mapRect.left,
      targetScreenPoint.y - mapRect.top,
    );
    const containerCenter = map.getSize().divideBy(2);
    const focusOffset = containerPoint.subtract(containerCenter);
    const projectedTarget = map.project(L.latLng(target.lat, target.lng), zoomLevel);

    return map.unproject(projectedTarget.subtract(focusOffset), zoomLevel);
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
    if (
      skipIfWithinMeters != null &&
      map.getCenter().distanceTo(focusCenter) < skipIfWithinMeters
    ) {
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
      map.setView(focusCenter, zoomLevel, { animate });
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