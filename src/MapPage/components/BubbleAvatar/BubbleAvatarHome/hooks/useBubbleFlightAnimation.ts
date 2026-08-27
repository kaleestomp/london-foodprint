import { useEffect, useRef, useState } from 'react';

import { type Point } from '../../config';

type UseBubbleFlightAnimationArgs = {
  pickupFrom?: Point;
  flyInFrom?: Point;
  flyOutTo?: Point;
  onFlyInComplete?: () => void;
  onFlyOutComplete?: () => void;
  homeCenter: Point;
};

const useBubbleFlightAnimation = ({
  pickupFrom,
  flyInFrom,
  flyOutTo,
  onFlyInComplete,
  onFlyOutComplete,
  homeCenter,
}: UseBubbleFlightAnimationArgs) => {
  const flyInCompletedRef = useRef(false);
  const flyOutCompletedRef = useRef(false);
  const [flightOffset, setFlightOffset] = useState<Point>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(1);
  const [transitionCss, setTransitionCss] = useState('none');
  const shouldFlyIn = !pickupFrom && !!flyInFrom;
  const flyInOffset = shouldFlyIn && flyInFrom
    ? { x: flyInFrom.x - homeCenter.x, y: flyInFrom.y - homeCenter.y }
    : null;
  const flyOutOffset = !pickupFrom && flyOutTo
    ? { x: flyOutTo.x - homeCenter.x, y: flyOutTo.y - homeCenter.y }
    : null;

  useEffect(() => {
    flyInCompletedRef.current = false;
  }, [flyInFrom, homeCenter]);

  useEffect(() => {
    flyOutCompletedRef.current = false;
  }, [flyOutTo, homeCenter]);

  useEffect(() => {
    if (!flyInOffset) {
      setTransitionCss('none');
      setOpacity(1);
      setFlightOffset({ x: 0, y: 0 });
      return;
    }

    setTransitionCss('none');
    setOpacity(0);
    setFlightOffset(flyInOffset);
    const raf = window.requestAnimationFrame(() => {
      setTransitionCss('transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease-out');
      setOpacity(1);
      setFlightOffset({ x: 0, y: 0 });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [flyInOffset]);

  useEffect(() => {
    if (!flyOutOffset) return;

    setTransitionCss('transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease-out');
    setOpacity(1);
    setFlightOffset(flyOutOffset);
  }, [flyOutOffset]);

  return {
    flightOffset,
    opacity,
    transitionCss,
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
