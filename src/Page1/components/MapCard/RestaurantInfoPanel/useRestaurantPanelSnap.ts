import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  COARSE_POINTER_QUERY,
  MOBILE_BREAKPOINT,
  MOBILE_ENTER_BREAKPOINT,
  MOBILE_EXIT_BREAKPOINT,
  MOBILE_MAX_BOTTOM_GAP_PX,
  MOBILE_PEEK_PX,
  MOBILE_SNAP_LARGE_RATIO,
  MOBILE_SNAP_MID_RATIO,
  RESIZE_HEIGHT_JITTER_PX,
  RESIZE_WIDTH_JITTER_PX,
} from './config';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const useRestaurantPanelSnap = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? (window.visualViewport?.height ?? window.innerHeight) : 800,
  });
  const [isCoarsePointer, setIsCoarsePointer] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(COARSE_POINTER_QUERY).matches,
  );
  const [isMobile, setIsMobile] = useState(() =>
    (typeof window !== 'undefined' ? window.innerWidth : 1280) < MOBILE_BREAKPOINT,
  );
  const [snapIndex, setSnapIndex] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartYRef = useRef(0);
  const dragStartTranslateRef = useRef(0);

  useEffect(() => {
    const media = window.matchMedia(COARSE_POINTER_QUERY);
    const updateCoarsePointer = () => setIsCoarsePointer(media.matches);
    updateCoarsePointer();

    media.addEventListener('change', updateCoarsePointer);
    return () => media.removeEventListener('change', updateCoarsePointer);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const next = {
        width: window.innerWidth,
        height: window.visualViewport?.height ?? window.innerHeight,
      };

      setViewport((prev) => {
        const widthDelta = Math.abs(prev.width - next.width);
        const heightDelta = Math.abs(prev.height - next.height);

        if (widthDelta < RESIZE_WIDTH_JITTER_PX && heightDelta < RESIZE_HEIGHT_JITTER_PX) {
          return prev;
        }

        return next;
      });
    };

    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    if (isCoarsePointer) {
      setIsMobile(true);
      return;
    }

    setIsMobile((prev) => {
      if (prev) return viewport.width < MOBILE_EXIT_BREAKPOINT;
      return viewport.width <= MOBILE_ENTER_BREAKPOINT;
    });
  }, [isCoarsePointer, viewport.width]);

  const metrics = useMemo(() => {
    const sheetHeight = viewport.height;
    const maxVisibleHeight = Math.max(MOBILE_PEEK_PX, viewport.height - MOBILE_MAX_BOTTOM_GAP_PX);
    const visibleHeights = [
      MOBILE_PEEK_PX,
      Math.round(viewport.height * MOBILE_SNAP_MID_RATIO),
      Math.round(viewport.height * MOBILE_SNAP_LARGE_RATIO),
      maxVisibleHeight,
    ];
    const offsets = visibleHeights.map((visible) => Math.max(0, sheetHeight - visible));

    return {
      maxOffset: offsets[0],
      minOffset: offsets[offsets.length - 1],
      offsets,
      sheetHeight,
    };
  }, [viewport.height]);

  useEffect(() => {
    if (!isMobile || isDragging) return;

    const target = metrics.offsets[Math.min(snapIndex, metrics.offsets.length - 1)] ?? metrics.maxOffset;
    setTranslateY(target);
  }, [isDragging, isMobile, metrics.maxOffset, metrics.offsets, snapIndex]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const deltaY = event.clientY - dragStartYRef.current;
    const next = clamp(dragStartTranslateRef.current + deltaY, metrics.minOffset, metrics.maxOffset);
    setTranslateY(next);
  }, [metrics.maxOffset, metrics.minOffset]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < metrics.offsets.length; i += 1) {
      const distance = Math.abs(metrics.offsets[i] - translateY);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    setSnapIndex(nearestIndex);
    setTranslateY(metrics.offsets[nearestIndex]);
    setIsDragging(false);
  }, [isDragging, metrics.offsets, translateY]);

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const handleHandlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;

    setIsDragging(true);
    dragStartYRef.current = event.clientY;
    dragStartTranslateRef.current = translateY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  return {
    handleHandlePointerDown,
    isDragging,
    isMobile,
    panelHeight: metrics.sheetHeight,
    translateY,
  };
};

export default useRestaurantPanelSnap;
