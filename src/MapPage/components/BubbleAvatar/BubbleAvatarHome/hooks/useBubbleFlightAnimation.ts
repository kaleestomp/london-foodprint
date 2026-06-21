import { useEffect, useRef } from 'react';

import { getHomeCenter, type Point } from '../../config';

type UseBubbleFlightAnimationArgs = {
  pickupFrom?: Point;
  flyInFrom?: Point;
  flyOutTo?: Point;
  onFlyInComplete?: () => void;
  onFlyOutComplete?: () => void;
};

const useBubbleFlightAnimation = ({
  pickupFrom,
  flyInFrom,
  flyOutTo,
  onFlyInComplete,
  onFlyOutComplete,
}: UseBubbleFlightAnimationArgs) => {
  const flyInCompletedRef = useRef(false);
  const flyOutCompletedRef = useRef(false);

  const homeCenter = getHomeCenter();
  const shouldFlyIn = !pickupFrom && !!flyInFrom;
  const flyInOffset = shouldFlyIn && flyInFrom
    ? { x: flyInFrom.x - homeCenter.x, y: flyInFrom.y - homeCenter.y }
    : null;
  const flyOutOffset = !pickupFrom && flyOutTo
    ? { x: flyOutTo.x - homeCenter.x, y: flyOutTo.y - homeCenter.y }
    : null;

  useEffect(() => {
    flyInCompletedRef.current = false;
  }, [flyInFrom]);

  useEffect(() => {
    flyOutCompletedRef.current = false;
  }, [flyOutTo]);

  return {
    initial: flyInOffset ? { x: flyInOffset.x, y: flyInOffset.y, opacity: 0 } : false,
    animate:
      flyOutOffset ? { x: flyOutOffset.x, y: flyOutOffset.y, opacity: 1 }
      : flyInOffset ? { x: 0, y: 0, opacity: 1 }
      : undefined,
    transition:
      flyOutOffset ? {
        x: { type: 'spring' as const, stiffness: 220, damping: 20 },
        y: { type: 'spring' as const, stiffness: 220, damping: 20 },
        opacity: { duration: 0.16 },
      }
      : flyInOffset ? {
        x: { type: 'spring' as const, stiffness: 280, damping: 24 },
        y: { type: 'spring' as const, stiffness: 280, damping: 24 },
        opacity: { duration: 0.16 },
      }
      : undefined,
    dragEnabled: !flyOutTo,
    handleAnimationComplete: () => {
      if (flyOutOffset && !flyOutCompletedRef.current) {
        flyOutCompletedRef.current = true;
        onFlyOutComplete?.();
        return;
      }
      if (!flyInOffset || flyInCompletedRef.current) return;
      flyInCompletedRef.current = true;
      onFlyInComplete?.();
    },
  };
};

export default useBubbleFlightAnimation;
