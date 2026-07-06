import { useCallback, useRef } from 'react';
import { type MotionValue, useMotionValue } from 'framer-motion';

import { type Point } from '../config';

export type DragMotion = {
  pointer: {
    x: MotionValue<number>;
    y: MotionValue<number>;
  };
  rawOffset: {
    x: MotionValue<number>;
    y: MotionValue<number>;
  };
};

/**
 * Owns high-frequency drag motion data for BubbleAvatar.
 * MotionValues are used instead of React state so pointer updates do not
 * trigger React re-renders on every move frame.
 */
const useDragMotionValues = () => {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rawOffsetX = useMotionValue(0);
  const rawOffsetY = useMotionValue(0);
  const rawAnchorRef = useRef<Point | null>(null);

  const dragMotion: DragMotion = {
    pointer: { x: pointerX, y: pointerY },
    rawOffset: { x: rawOffsetX, y: rawOffsetY },
  };

  const beginAt = useCallback((x: number, y: number) => {
    pointerX.set(x);
    pointerY.set(y);
    rawAnchorRef.current = { x, y };
    rawOffsetX.set(0);
    rawOffsetY.set(0);
  }, [pointerX, pointerY, rawOffsetX, rawOffsetY]);

  const updatePointer = useCallback((x: number, y: number) => {
    pointerX.set(x);
    pointerY.set(y);
  }, [pointerX, pointerY]);

  const updateRawOffset = useCallback((x: number, y: number) => {
    const rawAnchor = rawAnchorRef.current;
    if (!rawAnchor) return;
    rawOffsetX.set(x - rawAnchor.x);
    rawOffsetY.set(y - rawAnchor.y);
  }, [rawOffsetX, rawOffsetY]);

  const reset = useCallback(() => {
    rawAnchorRef.current = null;
    rawOffsetX.set(0);
    rawOffsetY.set(0);
  }, [rawOffsetX, rawOffsetY]);

  return {
    dragMotion,
    beginAt,
    updatePointer,
    updateRawOffset,
    reset,
  };
};

export default useDragMotionValues;
