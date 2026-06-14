import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type PanInfo,
  useAnimationControls,
  useDragControls,
  useMotionValue,
} from 'framer-motion';
import {
  COARSE_POINTER_QUERY,
  MOBILE_BREAKPOINT,
  MOBILE_ENTER_BREAKPOINT,
  MOBILE_EXIT_BREAKPOINT,
  MOBILE_SNAP_3,
  MOBILE_SNAP_MIN_MARGIN,
  MOBILE_SNAP_2,
  MOBILE_SNAP_1,
  RESIZE_HEIGHT_JITTER_PX,
  RESIZE_WIDTH_JITTER_PX,
} from './config';
import usePanelDebug from './usePanelDebug';

const springTransition = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 34,
  mass: 0.85,
};

const useRestaurantPanelSnap = () => {
  const { enabled: debugEnabled, events: debugEvents, pushEvent: pushDebugEvent } = usePanelDebug();
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

  const controls = useAnimationControls();
  const dragControls = useDragControls();
  const y = useMotionValue(0);

  useEffect(() => {
    const media = window.matchMedia(COARSE_POINTER_QUERY);
    const updateCoarsePointer = () => setIsCoarsePointer(media.matches);
    updateCoarsePointer();
    pushDebugEvent(`coarsePointer=${media.matches}`);

    media.addEventListener('change', updateCoarsePointer);
    return () => media.removeEventListener('change', updateCoarsePointer);
  }, [pushDebugEvent]);

  useEffect(() => {
    const onResize = () => {
      const next = {
        width: window.innerWidth,
        height: window.visualViewport?.height ?? window.innerHeight,
      };
      setViewport((prev) => {
        const widthDelta = Math.abs(prev.width - next.width);
        const heightDelta = Math.abs(prev.height - next.height);

        // Ignore small mobile viewport height jitters (browser chrome/show-hide)
        // that can cause panel flicker during unrelated drag gestures.
        if (widthDelta < RESIZE_WIDTH_JITTER_PX && heightDelta < RESIZE_HEIGHT_JITTER_PX) {
          pushDebugEvent(`resize ignored wΔ=${widthDelta} hΔ=${heightDelta} -> ${next.width}x${Math.round(next.height)}`);
          return prev;
        }

        pushDebugEvent(`resize accepted wΔ=${widthDelta} hΔ=${heightDelta} -> ${next.width}x${Math.round(next.height)}`);

        return next;
      });
    };

    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, [pushDebugEvent]);

  useEffect(() => {
    if (isCoarsePointer) {
      // Real mobile devices can briefly report width values near desktop breakpoints
      // while browser chrome animates. Keep panel mode stable for coarse pointers.
      setIsMobile(true);
      pushDebugEvent('mode mobile (coarse pointer lock)');
      return;
    }

    setIsMobile((prev) => {
      let nextIsMobile: boolean;
      if (prev) {
        // Stay in mobile mode until width clearly exits the breakpoint range.
        nextIsMobile = viewport.width < MOBILE_EXIT_BREAKPOINT;
      } else {
        // Enter mobile mode only when width is clearly below the breakpoint.
        nextIsMobile = viewport.width <= MOBILE_ENTER_BREAKPOINT;
      }

      if (prev !== nextIsMobile) {
        pushDebugEvent(`mode -> ${nextIsMobile ? 'mobile' : 'desktop'} at width=${viewport.width}`);
      }

      return nextIsMobile;
    });
  }, [viewport.width, isCoarsePointer, pushDebugEvent]);

  const metrics = useMemo(() => {
    const sheetHeight = viewport.height;
    const maxVisibleHeight = Math.max(MOBILE_SNAP_1, viewport.height - MOBILE_SNAP_MIN_MARGIN);
    const visibleHeights = [
      MOBILE_SNAP_1,
      Math.min(MOBILE_SNAP_2, maxVisibleHeight),
      Math.min(MOBILE_SNAP_3, maxVisibleHeight),
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
    if (!isMobile) {
      return;
    }

    const target = metrics.offsets[Math.min(snapIndex, metrics.offsets.length - 1)] ?? metrics.maxOffset;
    y.set(target);
    controls.set({ y: target });
  }, [controls, isMobile, metrics.maxOffset, metrics.offsets, snapIndex, y]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const current = y.get();
    const projected = current + info.velocity.y * 0.2;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < metrics.offsets.length; i += 1) {
      const distance = Math.abs(metrics.offsets[i] - projected);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    setSnapIndex(nearestIndex);
    pushDebugEvent(`dragEnd snapIndex=${nearestIndex} projectedY=${Math.round(projected)}`);
    const next = metrics.offsets[nearestIndex];
    controls.start({ y: next, transition: springTransition });
  }, [controls, metrics.offsets, pushDebugEvent, y]);

  return {
    controls,
    dragControls,
    dragConstraints: { top: metrics.minOffset, bottom: metrics.maxOffset },
    handleDragEnd,
    isMobile,
    panelHeight: metrics.sheetHeight,
    snapIndex,
    setSnapIndex,
    transition: springTransition,
    y,
    debug: {
      enabled: debugEnabled,
      width: viewport.width,
      height: viewport.height,
      visualViewportHeight: typeof window !== 'undefined' ? (window.visualViewport?.height ?? null) : null,
      innerHeight: typeof window !== 'undefined' ? window.innerHeight : null,
      isCoarsePointer,
      isMobile,
      snapIndex,
      y: Math.round(y.get()),
      events: debugEvents,
    },
  };
};

export default useRestaurantPanelSnap;
