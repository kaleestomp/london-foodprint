import { useRef, useEffect } from 'react';
import { HOME_SNAP_RADIUS, type Point } from '../../config';

/**
 * Fires onNearHomeChange(true/false) as the drag position enters or leaves
 * the home snap zone. Resets to false automatically when dragging stops.
 */
const useHomeProximity = (
  isDragging: boolean,
  dragPos: Point | null,
  homeCenter: Point,
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

    const near = Math.sqrt((dragPos.x - homeCenter.x) ** 2 + (dragPos.y - homeCenter.y) ** 2) < HOME_SNAP_RADIUS;

    if (near !== prevRef.current) {
      prevRef.current = near;
      onNearHomeChange?.(near);
    }
  }, [isDragging, dragPos, onNearHomeChange, homeCenter]);
};

export default useHomeProximity;
