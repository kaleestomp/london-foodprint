import { useRef, useEffect } from 'react';

import { useBubbleAvatarState } from '../../BubbleAvatarStateContext';
import { HOME_SNAP_RADIUS, type Point } from '../../config';
import type { ValueChannel } from '../../onBubbleDrag/useDragMotionValues';

type PointerMotion = {
  x: ValueChannel;
  y: ValueChannel;
};

/**
 * Fires onNearHomeChange(true/false) as the drag position enters or leaves
 * the home snap zone. Resets to false automatically when dragging stops.
 */
const useHomeProximity = (
  pointer: PointerMotion,
  homeCenter: Point,
) => {
  
  const { isDragging, setIsNearHome: setNearHome } = useBubbleAvatarState();

  const prevRef = useRef(false);
  const updateNearHome = () => {
    if (!isDragging) return;

    const x = pointer.x.get();
    const y = pointer.y.get();
    const near = Math.sqrt((x - homeCenter.x) ** 2 + (y - homeCenter.y) ** 2) < HOME_SNAP_RADIUS;

    if (near !== prevRef.current) {
      prevRef.current = near;
      setNearHome(near);
    }
  };

  useEffect(() => {
    const unsubscribeX = pointer.x.subscribe(updateNearHome);
    const unsubscribeY = pointer.y.subscribe(updateNearHome);
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [pointer.x, pointer.y, isDragging, homeCenter]);

  useEffect(() => {
    if (!isDragging) {
      if (prevRef.current) {
        prevRef.current = false;
        setNearHome(false);
      }
      return;
    }
    updateNearHome();
  }, [homeCenter, isDragging, pointer, setNearHome]);
};

export default useHomeProximity;
