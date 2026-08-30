import { useRef, useEffect } from 'react';
import { type MotionValue, useMotionValueEvent } from 'framer-motion';

import { useBubbleAvatarState } from '../../BubbleAvatarStateContext';
import { HOME_SNAP_RADIUS, type Point } from '../../config';

type PointerMotion = {
  x: MotionValue<number>;
  y: MotionValue<number>;
};

/**
 * Fires onNearHomeChange(true/false) as the drag position enters or leaves
 * the home snap zone. Resets to false automatically when dragging stops.
 */
const useHomeProximity = (
  pointer: PointerMotion,
  homeCenter: Point,
) => {
  
  const { isDragging, setIsNearHome } = useBubbleAvatarState();

  const prevRef = useRef(false);
  const updateNearHome = () => {
    if (!isDragging) return;
    

    const x = pointer.x.get();
    const y = pointer.y.get();
    const near = Math.sqrt((x - homeCenter.x) ** 2 + (y - homeCenter.y) ** 2) < HOME_SNAP_RADIUS;
    
    if (near !== prevRef.current) {
      prevRef.current = near;
      setIsNearHome(near);
    }
  };

  useMotionValueEvent(pointer.x, 'change', updateNearHome);
  useMotionValueEvent(pointer.y, 'change', updateNearHome);

  useEffect(() => {
    if (!isDragging) {
      if (prevRef.current) {
        prevRef.current = false;
        setIsNearHome(false);
      }
      return;
    }
    updateNearHome();
  }, [homeCenter, isDragging, pointer, setIsNearHome]);
};

export default useHomeProximity;
