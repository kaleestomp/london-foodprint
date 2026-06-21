import { useCallback, useEffect, useRef } from 'react';

/**
 * Owns the coarse-pointer raw drag lifecycle.
 * It keeps pointer tracking and global listeners separate from Framer Motion.
 */
const useRawPointerDrag = (
  rawDragEnabled: boolean,
  isDragging: boolean,
  handleDragStartAtPoint: (x: number, y: number) => void,
  handleDragMoveToPoint: (x: number, y: number) => void,
  handleDragEndAtPoint: (x: number, y: number) => void,
) => {
  const rawDragPointerIdRef = useRef<number | null>(null);
  const rawDragActiveRef = useRef(false);

  const endRawDrag = useCallback((x: number, y: number) => {
    rawDragActiveRef.current = false;
    rawDragPointerIdRef.current = null;
    handleDragEndAtPoint(x, y);
  }, [handleDragEndAtPoint]);

  const startRawDrag = useCallback((x: number, y: number, pointerId?: number) => {
    rawDragActiveRef.current = true;
    rawDragPointerIdRef.current = pointerId ?? null;
    handleDragStartAtPoint(x, y);
  }, [handleDragStartAtPoint]);

  useEffect(() => {
    if (!rawDragEnabled || !isDragging || !rawDragActiveRef.current) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      const activePointerId = rawDragPointerIdRef.current;
      if (activePointerId != null && event.pointerId !== activePointerId) {
        return;
      }

      if (activePointerId == null) {
        rawDragPointerIdRef.current = event.pointerId;
      }

      handleDragMoveToPoint(event.clientX, event.clientY);
    };

    const onPointerEnd = (event: PointerEvent) => {
      const activePointerId = rawDragPointerIdRef.current;
      if (activePointerId != null && event.pointerId !== activePointerId) {
        return;
      }

      endRawDrag(event.clientX, event.clientY);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
    };
  }, [endRawDrag, handleDragMoveToPoint, isDragging, rawDragEnabled]);

  return {
    startRawDrag,
  };
};

export default useRawPointerDrag;
