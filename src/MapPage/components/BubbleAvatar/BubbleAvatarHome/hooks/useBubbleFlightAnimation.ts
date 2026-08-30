import { useEffect, useRef, useState } from 'react';

import { type Point } from '../../config';

const useBubbleFlightAnimation = ({
  pickupFrom,
  flyInFrom,
  flyOutTo,
  onFlyInComplete,
  onFlyOutComplete,
  homeCenter,
}: {
  pickupFrom?: Point;
  flyInFrom?: Point;
  flyOutTo?: Point;
  onFlyInComplete?: () => void;
  onFlyOutComplete?: () => void;
  homeCenter: Point;
}) => {
  const flyInCompletedRef = useRef(false);
  const flyOutCompletedRef = useRef(false);
  const shouldFlyIn = !pickupFrom && !!flyInFrom;
  // Seeded synchronously so the very first render already knows a flight is starting.
  const [isFlying, setIsFlying] = useState(() => !pickupFrom && !!(flyInFrom || flyOutTo));
  const flyInOffset = shouldFlyIn && flyInFrom
    ? { x: flyInFrom.x - homeCenter.x, y: flyInFrom.y - homeCenter.y }
    : null;
  const flyOutOffset = !pickupFrom && flyOutTo
    ? { x: flyOutTo.x - homeCenter.x, y: flyOutTo.y - homeCenter.y }
    : null;

  useEffect(() => {
    setIsFlying(!pickupFrom && !!(flyInFrom || flyOutTo));
  }, [pickupFrom, flyInFrom, flyOutTo]);

  useEffect(() => {
    flyInCompletedRef.current = false;
  }, [flyInFrom, homeCenter]);

  useEffect(() => {
    flyOutCompletedRef.current = false;
  }, [flyOutTo, homeCenter]);

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
    isFlying,
    handleAnimationComplete: () => {
      if (flyOutOffset && !flyOutCompletedRef.current) {
        flyOutCompletedRef.current = true;
        setIsFlying(false);
        onFlyOutComplete?.();
        return;
      }
      if (!flyInOffset || flyInCompletedRef.current) return;
      flyInCompletedRef.current = true;
      setIsFlying(false);
      onFlyInComplete?.();
    },
  };
};

export default useBubbleFlightAnimation;
