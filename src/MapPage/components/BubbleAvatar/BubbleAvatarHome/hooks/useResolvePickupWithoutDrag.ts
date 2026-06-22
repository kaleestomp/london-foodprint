import { useCallback } from 'react';
import L from 'leaflet';
import { HOME_SNAP_RADIUS, type Point } from '../../config';

/**
 * Resolves pickup mode when pointer is released before drag starts.
 * This prevents a "hovering" avatar when pickup succeeds but drag events don't fire.
 */
const useResolvePickupWithoutDrag = (
  mapRef: React.RefObject<L.Map | null>,
  handleDrop: (lat: number, lng: number) => void,
  handleDropCancel: () => void,
  homeCenter: Point,
  isDropBlocked?: (point: Point) => boolean,
) => {
    
  return useCallback((point: Point) => {
    const map = mapRef.current;
    if (!map) {
      handleDropCancel();
      return;
    }

    const distToHome = Math.sqrt((point.x - homeCenter.x) ** 2 + (point.y - homeCenter.y) ** 2);

    // Near home: cancel pickup and return to home button.
    if (distToHome < HOME_SNAP_RADIUS) {
      handleDropCancel();
      return;
    }

    if (isDropBlocked?.(point)) {
      handleDropCancel();
      return;
    }

    const mapRect = map.getContainer().getBoundingClientRect();
    const droppedOnMap =
      point.x >= mapRect.left && point.x <= mapRect.right &&
      point.y >= mapRect.top && point.y <= mapRect.bottom;

    if (droppedOnMap) {
      const leafletPoint = L.point(point.x - mapRect.left, point.y - mapRect.top);
      const latLng = map.containerPointToLatLng(leafletPoint);
      handleDrop(latLng.lat, latLng.lng);
      return;
    }

    handleDropCancel();
  }, [mapRef, handleDrop, handleDropCancel, homeCenter, isDropBlocked]);
};

export default useResolvePickupWithoutDrag;
