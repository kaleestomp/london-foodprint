import { useCallback, useRef } from 'react';

import { type Point } from '../config';

export type ValueChannel = {
  get: () => number;
  set: (next: number) => void;
  subscribe: (listener: () => void) => () => void;
};

const createValueChannel = (initial: number): ValueChannel => {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set: (next: number) => {
      if (next === value) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export type DragMotion = {
  pointer: {
    x: ValueChannel;
    y: ValueChannel;
  };
  rawOffset: {
    x: ValueChannel;
    y: ValueChannel;
  };
};

/**
 * Owns high-frequency drag motion data for BubbleAvatar.
 * MotionValues are used instead of React state so pointer updates do not
 * trigger React re-renders on every move frame.
 */
const useDragMotionValues = () => {
  const pointerXRef = useRef<ValueChannel | null>(null);
  const pointerYRef = useRef<ValueChannel | null>(null);
  const rawOffsetXRef = useRef<ValueChannel | null>(null);
  const rawOffsetYRef = useRef<ValueChannel | null>(null);

  if (!pointerXRef.current) pointerXRef.current = createValueChannel(0);
  if (!pointerYRef.current) pointerYRef.current = createValueChannel(0);
  if (!rawOffsetXRef.current) rawOffsetXRef.current = createValueChannel(0);
  if (!rawOffsetYRef.current) rawOffsetYRef.current = createValueChannel(0);

  const pointerX = pointerXRef.current;
  const pointerY = pointerYRef.current;
  const rawOffsetX = rawOffsetXRef.current;
  const rawOffsetY = rawOffsetYRef.current;
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
