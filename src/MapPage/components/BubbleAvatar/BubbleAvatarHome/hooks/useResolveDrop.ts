import { useCallback } from 'react';
import type * as maplibregl from 'maplibre-gl';

import { HOME_SNAP_RADIUS, INIT_ZOOM_CLAMP_START, type Point, INIT_ZOOM_CLAMP_END } from '../../config';
import { useBubbleAvatarState } from '../../BubbleAvatarStateContext';
import { useIsMobileCtx } from '../../../../../context/IsMobileContext';
import { useDrawerState } from '../../../SlideUpDrawer/DrawerStateContext';
import checkIsDropBlocked from './checkIsDropBlocked';
import useMapViewportNavigation from '../../../Map/MapNavigationContext/useMapViewportNavigation';

/**
 * Resolves pickup mode when pointer is released before drag starts.
 * This prevents a "hovering" avatar when pickup succeeds but drag events don't fire.
 */
const useResolveDrop = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  // handleDrop: (map: L.Map, lat: number, lng: number) => void,
  // handleDropCancel: () => void,
  homeCenter: Point,
  // isDropBlocked?: (point: Point) => boolean,
) => {

  const { handleDropXY, handleDropCancel } = useBubbleAvatarState();
  const isMobile = useIsMobileCtx();
  const { snapPX } = useDrawerState();
  const { focusMap } = useMapViewportNavigation( mapRef );

  const resolveDrop = useCallback((point: Point) => {

    const map = mapRef.current;
    if (!map) {
      handleDropCancel();
      return;
    }

    // CANCEL IF NEAR HOME
    // cancel pickup and return to home button.
    const distToHome = Math.sqrt((point.x - homeCenter.x) ** 2 + (point.y - homeCenter.y) ** 2);
    if (distToHome < HOME_SNAP_RADIUS) {
      handleDropCancel();
      return;
    }

    // CANCEL IF DROP NOT ON MAP
    const isDropBlocked = checkIsDropBlocked(point, isMobile, snapPX ?? 0);
    if (isDropBlocked) {
      handleDropCancel();
      return;
    }

    // FOCUS MAP ON DROPPED POINT
    const pointOnMap = map.unproject([
      point.x - map.getContainer().getBoundingClientRect().left,
      point.y - map.getContainer().getBoundingClientRect().top,
    ]);
    const currentZoom = map.getZoom();
    const dropZoom = Math.min(Math.max(currentZoom, INIT_ZOOM_CLAMP_START), INIT_ZOOM_CLAMP_END);
    focusMap({
      target: {
        lat: pointOnMap.lat,
        lng: pointOnMap.lng,
      },
      method: dropZoom === currentZoom ? 'pan' : 'setView',
      zoom: dropZoom,
      animate: true,
      skipIfWithinMeters: dropZoom === currentZoom ? 1 : undefined,
      // Keep the dropped location centred in the map area that remains above
      // the drawer, rather than in the full map viewport.
      padding: { top: 0, right: 0, bottom: snapPX ?? 0, left: 0 },
    });

    // OTHERWISE DROP ON MAP
    handleDropXY(map, point.x, point.y);

  }, [mapRef, handleDropXY, handleDropCancel, homeCenter, isMobile, snapPX, focusMap]);

  return resolveDrop;
};

export default useResolveDrop;
