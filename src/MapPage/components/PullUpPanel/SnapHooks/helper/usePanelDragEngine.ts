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
    setIsDragging(true);
    (element as HTMLElement).setPointerCapture(pointerId);

    const onMove = (event: PointerEvent) => {
      const deltaY = event.clientY - clientY;
      const next = clamp(startTranslate + deltaY, minOffset, maxOffset);
      dragCurrentTranslate = next;
      onMoveTranslate(next);
    };

    const onEnd = () => {
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