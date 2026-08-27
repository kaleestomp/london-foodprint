import { useEffect, useRef } from 'react';

type Point = { x: number; y: number };

/**
 * Coordinates pickup-mode bootstrap across Framer and raw-pointer paths.
 */
const usePickupBootstrap = (
  pickupPos: Point | null,
  resetDragStarted: () => void,
  hasDragStarted: () => boolean,
  startRawDrag: (x: number, y: number, pointerId?: number) => void,
  resolveDrop: (point: Point) => void,
) => {
  const firedPickupRef = useRef(false);

  useEffect(() => {
    if (!pickupPos) {
      firedPickupRef.current = false;
    }
  }, [pickupPos]);

  useEffect(() => {
    if (!pickupPos || firedPickupRef.current) return;
    firedPickupRef.current = true;
    resetDragStarted();
    startRawDrag(pickupPos.x, pickupPos.y);
  }, [pickupPos, resetDragStarted, startRawDrag]);

  // If pickup mode was entered but Framer drag never started (e.g. pointer timing
  // edge case), resolve on pointerup so avatar never stays hovering.
  useEffect(() => {
    if (!pickupPos) return;

    const onPointerUp = (e: PointerEvent) => {
      if (hasDragStarted()) return;
      resolveDrop({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('pointerup', onPointerUp, { once: true });
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, [pickupPos, resolveDrop, hasDragStarted]);
};

export default usePickupBootstrap;
