import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

type UsePullDownAnimationsParams = {
  isOpen: boolean;
  expandedContentHeight: number;
  onClose: () => void;
};

const CLOSE_THRESHOLD_PX = 56;
const MAX_DOWNWARD_NUDGE_PX = 16;
const FLY_MS = 320;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const usePullDownAnimations = ({
  isOpen,
  expandedContentHeight,
  onClose,
}: UsePullDownAnimationsParams) => {
  const [isContentVisible, setIsContentVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const previousExpandedHeightRef = useRef(0);
  const previousIsOpenRef = useRef(isOpen);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartTranslateYRef = useRef(0);
  const closeTimerRef = useRef<number | null>(null);

  const isPanelRendered = isContentVisible || isClosing;
  const flyOffset = Math.min(44, Math.max(18, expandedContentHeight * 0.28));

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Keep content mounted long enough to animate fly-out before unmounting.
    const wasOpen = previousIsOpenRef.current;

    if (isOpen && !wasOpen) {
      clearCloseTimer();
      setIsClosing(false);
      setIsContentVisible(true);
      setTranslateY(-flyOffset);

      // Start the fly-in on the next frame from measured offset.
      requestAnimationFrame(() => {
        setTranslateY(0);
      });
    }

    if (!isOpen && wasOpen && isContentVisible) {
      setIsClosing(true);
      setTranslateY(-flyOffset);

      clearCloseTimer();
      closeTimerRef.current = window.setTimeout(() => {
        setIsContentVisible(false);
        setIsClosing(false);
        setTranslateY(0);
        closeTimerRef.current = null;
      }, FLY_MS);
    }

    previousIsOpenRef.current = isOpen;
  }, [clearCloseTimer, flyOffset, isContentVisible, isOpen]);

  useEffect(() => {
    // When content shrinks (e.g. collapsing filter pills), add a small upward recoil
    // so the height reduction remains visually explicit.
    const previousHeight = previousExpandedHeightRef.current;
    const isShrinking = expandedContentHeight < previousHeight;

    if (isOpen && isPanelRendered && isShrinking && !isClosing) {
      const recoil = Math.min(20, Math.max(8, (previousHeight - expandedContentHeight) * 0.25));
      setTranslateY(-recoil);
      window.setTimeout(() => setTranslateY(0), 140);
    }

    previousExpandedHeightRef.current = expandedContentHeight;
  }, [expandedContentHeight, isClosing, isOpen, isPanelRendered]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!isDraggingRef.current) return;

    const deltaY = event.clientY - dragStartYRef.current;
    const nextTranslate = clamp(
      dragStartTranslateYRef.current + deltaY,
      -expandedContentHeight,
      MAX_DOWNWARD_NUDGE_PX,
    );
    setTranslateY(nextTranslate);
  }, [expandedContentHeight]);

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setIsDragging(false);

    if (translateY < -CLOSE_THRESHOLD_PX) {
      onClose();
      return;
    }

    setTranslateY(0);
  }, [onClose, translateY]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const handleHandlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPanelRendered) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartYRef.current = event.clientY;
    dragStartTranslateYRef.current = translateY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [isPanelRendered, translateY]);

  return {
    dragLayerStyle: {
      transform: `translateY(${translateY}px)`,
    },
    handleHandlePointerDown,
    isClosing,
    isDragging,
    isPanelRendered,
  };
};

export default usePullDownAnimations;