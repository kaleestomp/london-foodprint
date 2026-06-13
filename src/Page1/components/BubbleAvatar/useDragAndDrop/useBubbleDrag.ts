import { useState, useCallback } from 'react';
import { type PanInfo } from 'framer-motion';
import L from 'leaflet';
import { getHomeCenter, HOME_SNAP_RADIUS } from '../config';

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
const useBubbleDrag = (
  mapRef: React.RefObject<L.Map | null>,
  onDrop: (lat: number, lng: number) => void,
  onCancel?: () => void,
) => {
  const [isDragging, setIsDragging] = useState(false);
  // Tracks the last pointer position during drag for the drop-ring overlay
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    mapRef.current?.dragging.disable();
  }, [mapRef]);

  const handleDrag = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setDragPos({ x: info.point.x, y: info.point.y });
    },
    [],
  );

  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      setDragPos(null);
      mapRef.current?.dragging.enable();

      const { x, y } = info.point;

      // ── Near-home check (highest priority) ──────────────────────────────
      // Must run before the map-bounds check because the home position sits
      // inside the map container rect.
      const home = getHomeCenter();
      const distToHome = Math.sqrt((x - home.x) ** 2 + (y - home.y) ** 2);
      if (distToHome < HOME_SNAP_RADIUS) {
        onCancel?.(); // return home
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
    [mapRef, onDrop, onCancel],
  );

  return { isDragging, dragPos, handleDragStart, handleDrag, handleDragEnd };
};

export default useBubbleDrag;
