import { useCallback, useEffect, useRef, useState } from 'react';

import { clamp, type DragSource } from '../config';

type UsePanelDragEngineArgs = {
  minOffset: number;
  maxOffset: number;
  currentTranslate: number;
  onMoveTranslate: (next: number) => void;
  onDragEnd: (args: { source: DragSource; startTranslate: number; endTranslate: number }) => void;
};

const usePanelDragEngine = ({
  minOffset,
  maxOffset,
  currentTranslate,
  onMoveTranslate,
  onDragEnd,
}: UsePanelDragEngineArgs) => {
  const [isDragging, setIsDragging] = useState(false);
  const moveHandlerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const endHandlerRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number | null>(null);
  const latestTranslateRef = useRef<number>(currentTranslate);

  const cleanupActiveListeners = useCallback(() => {
    if (moveHandlerRef.current) {
      window.removeEventListener('pointermove', moveHandlerRef.current);
      moveHandlerRef.current = null;
    }
    if (endHandlerRef.current) {
      window.removeEventListener('pointerup', endHandlerRef.current);
      window.removeEventListener('pointercancel', endHandlerRef.current);
      endHandlerRef.current = null;
    }
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Defensive cleanup for unmount or replacement drag starts.
  useEffect(() => cleanupActiveListeners, [cleanupActiveListeners]);

  const startDrag = useCallback((
    clientY: number,
    pointerId: number,
    element: Element,
    source: DragSource,
  ) => {
    cleanupActiveListeners();

    const startTranslate = currentTranslate;
    let dragCurrentTranslate = startTranslate;
    latestTranslateRef.current = startTranslate;
    setIsDragging(true);
    const dragElement = element as HTMLElement;
    dragElement.setPointerCapture(pointerId);

    const onMove = (event: PointerEvent) => {
      const deltaY = event.clientY - clientY;
      const next = clamp(startTranslate + deltaY, minOffset, maxOffset);
      dragCurrentTranslate = next;
      latestTranslateRef.current = next;
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        onMoveTranslate(latestTranslateRef.current);
      });
    };

    const onEnd = () => {
      if (dragElement.hasPointerCapture(pointerId)) {
        dragElement.releasePointerCapture(pointerId);
      }
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      onMoveTranslate(latestTranslateRef.current);
      cleanupActiveListeners();
      onDragEnd({
        source,
        startTranslate,
        endTranslate: dragCurrentTranslate,
      });
      setIsDragging(false);
    };

    moveHandlerRef.current = onMove;
    endHandlerRef.current = onEnd;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
  }, [cleanupActiveListeners, currentTranslate, maxOffset, minOffset, onDragEnd, onMoveTranslate]);

  return {
    isDragging,
    startDrag,
  };
};

export default usePanelDragEngine;