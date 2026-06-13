import { useRef, useEffect } from 'react';
import { getHomeCenter, HOME_SNAP_RADIUS } from '../config';

type Point = { x: number; y: number };

/**
 * Fires onNearHomeChange(true/false) as the drag position enters or leaves
 * the home snap zone. Resets to false automatically when dragging stops.
 */
const useHomeProximity = (
  isDragging: boolean,
  dragPos: Point | null,
  onNearHomeChange?: (near: boolean) => void,
) => {
  const prevRef = useRef(false);

  useEffect(() => {
    if (!isDragging || !dragPos) {
      if (prevRef.current) {
        prevRef.current = false;
        onNearHomeChange?.(false);
      }
      return;
    }

    const home = getHomeCenter();
    const near = Math.sqrt((dragPos.x - home.x) ** 2 + (dragPos.y - home.y) ** 2) < HOME_SNAP_RADIUS;

    if (near !== prevRef.current) {
      prevRef.current = near;
      onNearHomeChange?.(near);
    }
  }, [isDragging, dragPos, onNearHomeChange]);
};

export default useHomeProximity;
