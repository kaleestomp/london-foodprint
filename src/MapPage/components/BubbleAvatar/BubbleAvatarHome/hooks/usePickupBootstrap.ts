import { useEffect, useRef } from 'react';
import type { DragControls } from 'framer-motion';

type Point = { x: number; y: number };

/**
 * Coordinates pickup-mode bootstrap across Framer and raw-pointer paths.
 */
const usePickupBootstrap = (
  pickupPos: Point | null,
  rawDragEnabled: boolean,
  dragControls: DragControls,
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

  // When mounted at a pickup position, programmatically start the Framer Motion
  // drag using the real pointer coordinates. The user's pointer is still held
  // down at pickupPos, so dragControls.start() picks up the live gesture.
  useEffect(() => {
    if (rawDragEnabled) return;
    if (!pickupPos || firedPickupRef.current) return;
    firedPickupRef.current = true;
    resetDragStarted();
    requestAnimationFrame(() => {
      dragControls.start(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: pickupPos.x,
          clientY: pickupPos.y,
          pointerId: 1,
          isPrimary: true,
        }),
      );
    });
  }, [pickupPos, dragControls, rawDragEnabled, resetDragStarted]);

  useEffect(() => {
    if (!rawDragEnabled || !pickupPos || firedPickupRef.current) return;
    firedPickupRef.current = true;
    startRawDrag(pickupPos.x, pickupPos.y);
  }, [pickupPos, rawDragEnabled, startRawDrag]);

  // If pickup mode was entered but Framer drag never started (e.g. pointer timing
  // edge case), resolve on pointerup so avatar never stays hovering.
  useEffect(() => {
    if (rawDragEnabled) return;
    if (!pickupPos) return;

    const onPointerUp = (e: PointerEvent) => {
      if (hasDragStarted()) return;
      resolveDrop({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('pointerup', onPointerUp, { once: true });
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, [pickupPos, rawDragEnabled, resolveDrop, hasDragStarted]);
};

export default usePickupBootstrap;
