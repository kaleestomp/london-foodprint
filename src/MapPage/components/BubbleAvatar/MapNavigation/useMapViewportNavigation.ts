import { useCallback } from 'react';
import maplibregl from 'maplibre-gl';

import { type LatLng } from '../config';

type CameraPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type FocusMapArgs = {
  target: LatLng;
  method: 'pan' | 'setView';
  zoom?: number;
  animate?: boolean;
  onSettled?: () => void;
  skipIfWithinMeters?: number;
  padding?: CameraPadding;
};

type UseMapViewportNavigationArgs = {
  mapRef: React.RefObject<maplibregl.Map | null>;
};

const useMapViewportNavigation = ({ mapRef }: UseMapViewportNavigationArgs) => {
  const getFocusCenter = useCallback((target: LatLng) => (
    new maplibregl.LngLat(target.lng, target.lat)
  ), []);

  const focusMap = useCallback(({
    target,
    method,
    zoom,
    animate = true,
    onSettled,
    skipIfWithinMeters,
    padding,
  }: FocusMapArgs) => {
    const map = mapRef.current;
    if (!map) {
      onSettled?.();
      return () => {};
    }

    const zoomLevel = zoom ?? map.getZoom();
    const focusCenter = getFocusCenter(target);
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
      map.flyTo({ center: focusCenter, zoom: zoomLevel, bearing: 0, animate, padding });
    } else {
      if (padding) {
        map.easeTo({ center: focusCenter, animate, padding });
      } else {
        map.panTo(focusCenter, { animate });
      }
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