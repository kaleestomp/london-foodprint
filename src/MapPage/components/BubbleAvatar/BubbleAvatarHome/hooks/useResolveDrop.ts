import { useCallback } from 'react';
import type maplibregl from 'maplibre-gl';

import { HOME_SNAP_RADIUS, type Point } from '../../config';
import { useBubbleAvatarState } from '../../BubbleAvatarStateContext';
import { useIsMobileCtx } from '../../../../../context/IsMobileContext';
import { useDrawerState } from '../../../SlideUpDrawer/DrawerStateContext';
import checkIsDropBlocked from './checkIsDropBlocked';

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

    // OTHERWISE DROP ON MAP
    handleDropXY(map, point.x, point.y);
    // const mapRect = map.getContainer().getBoundingClientRect();
    // const insideMap = insideRect(mapRect, point);
    // if (insideMap) {
    //   const leafletPoint = L.point(point.x - mapRect.left, point.y - mapRect.top);
    //   const latLng = map.containerPointToLatLng(leafletPoint);
    //   handleDropLatLng(map, latLng.lat, latLng.lng);
    //   return;
    // } else {
    //   // CANCEL IF NOT
    //   handleDropCancel();
    // }

  }, [mapRef, handleDropXY, handleDropCancel, homeCenter, isMobile, snapPX]);

  return resolveDrop;
};

export default useResolveDrop;
