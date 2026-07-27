import { useCallback, useRef } from 'react';
import { type PanInfo } from 'framer-motion';
import L from 'leaflet';
import { HOME_SNAP_RADIUS, type Point } from '../config';
import { useBubbleAvatarState } from '../BubbleAvatarStateContext';
import useDragMotionValues from './useDragMotionValues';

/**
 * Handles the drag lifecycle for BubbleButton:
 *  - disables Leaflet map panning while the bubble is in flight
 *  - on release near home position: calls onCancel (snap back / return home)
 *  - on release over the map: converts the drop point to lat/lng and calls onDrop
 *  - on release anywhere else: calls onCancel (if provided), otherwise Framer Motion springs back
 *
 * Near-home check runs FIRST because the home button sits inside the map
 * container rect — without this, releasing near home would trigger a map drop.
 */
const onBubbleDrag = (
  mapRef: React.RefObject<L.Map | null>,
  onDrop: (lat: number, lng: number) => void,
  homeCenter: Point,
  onCancel?: () => void,
  isDropBlocked?: (point: Point) => boolean,
) => {
  const { isDragging, beginDragging, endDragging } = useBubbleAvatarState();
  const hasDragStartedRef = useRef(false);
  const {
    dragMotion,
    beginAt,
    updatePointer,
    updateRawOffset,
    reset: resetDragMotion,
  } = useDragMotionValues();

  const resetDragStarted = useCallback(() => {
    hasDragStartedRef.current = false;
  }, []);

  const hasDragStarted = useCallback(() => hasDragStartedRef.current, []);

  const handleDragStart = useCallback(() => {
    hasDragStartedRef.current = true;
    beginDragging();
    mapRef.current?.dragging.disable();
  }, [beginDragging, mapRef]);

  const handleDragStartAtPoint = useCallback((x: number, y: number) => {
    hasDragStartedRef.current = true;
    beginDragging();
    beginAt(x, y);
    mapRef.current?.dragging.disable();
  }, [beginAt, beginDragging, mapRef]);

  const handleDrag = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      updatePointer(info.point.x, info.point.y);
    },
    [updatePointer],
  );

  const handleDragMoveToPoint = useCallback((x: number, y: number) => {
    updatePointer(x, y);
    updateRawOffset(x, y);
  }, [updatePointer, updateRawOffset]);

  const finalizeDragAtPoint = useCallback((x: number, y: number) => {
      endDragging();
      resetDragMotion();
      mapRef.current?.dragging.enable();

      // ── Near-home check (highest priority) ──────────────────────────────
      // Must run before the map-bounds check because the home position sits
      // inside the map container rect.
      const home = homeCenter;
      const distToHome = Math.sqrt((x - home.x) ** 2 + (y - home.y) ** 2);
      if (distToHome < HOME_SNAP_RADIUS) {
        onCancel?.(); // return home
        return;
      }

      if (isDropBlocked?.({ x, y })) {
        onCancel?.();
        return;
      }

      // ── Map-drop check ──────────────────────────────────────────────────
      const map = mapRef.current;
      if (!map) return;

      const mapRect = map.getContainer().getBoundingClientRect();
      const droppedOnMap =
        x >= mapRect.left && x <= mapRect.right &&
        y >= mapRect.top  && y <= mapRect.bottom;

      if (droppedOnMap) {
        const leafletPoint = L.point(x - mapRect.left, y - mapRect.top);
        const latLng = map.containerPointToLatLng(leafletPoint);
        onDrop(latLng.lat, latLng.lng);
      } else {
        onCancel?.();
      }
    },
    [endDragging, homeCenter, isDropBlocked, mapRef, onCancel, onDrop, resetDragMotion],
  );

  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      finalizeDragAtPoint(info.point.x, info.point.y);
    },
    [finalizeDragAtPoint],
  );

  return {
    isDragging,
    dragMotion,
    hasDragStarted,
    resetDragStarted,
    handleDragStart,
    handleDragStartAtPoint,
    handleDrag,
    handleDragMoveToPoint,
    handleDragEnd,
    handleDragEndAtPoint: finalizeDragAtPoint,
  };
};

export default onBubbleDrag;
