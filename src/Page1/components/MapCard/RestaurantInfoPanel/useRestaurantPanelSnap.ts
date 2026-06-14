import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type PanInfo,
  useAnimationControls,
  useDragControls,
  useMotionValue,
} from 'framer-motion';

const MOBILE_BREAKPOINT = 960;
const MOBILE_ENTER_BREAKPOINT = MOBILE_BREAKPOINT - 24;
const MOBILE_EXIT_BREAKPOINT = MOBILE_BREAKPOINT + 24;
const MOBILE_PEEK_PX = 72;
const RESIZE_HEIGHT_JITTER_PX = 120;
const RESIZE_WIDTH_JITTER_PX = 16;
const COARSE_POINTER_QUERY = '(pointer: coarse)';
const MAX_DEBUG_EVENTS = 12;

const DEBUG_PARAM = 'panelDebug';

const hasTruthyDebugValue = (value: string | null) => {
  if (value == null) return false;
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) return true;
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

const isPanelDebugEnabled = () => {
  if (typeof window === 'undefined') return false;

  const search = new URLSearchParams(window.location.search);
  if (search.has(DEBUG_PARAM) && hasTruthyDebugValue(search.get(DEBUG_PARAM))) {
    return true;
  }

  const hashRaw = window.location.hash ?? '';
  const hash = hashRaw.startsWith('#') ? hashRaw.slice(1) : hashRaw;
  const hashParams = new URLSearchParams(hash);
  if (hashParams.has(DEBUG_PARAM) && hasTruthyDebugValue(hashParams.get(DEBUG_PARAM))) {
    return true;
  }

  const hashSegments = hash.split(/[?&]/).map((segment) => segment.trim().toLowerCase());
  if (hashSegments.includes(DEBUG_PARAM.toLowerCase())) {
    return true;
  }

  try {
    const stored = window.localStorage.getItem(DEBUG_PARAM);
    if (hasTruthyDebugValue(stored)) {
      return true;
    }
  } catch {
    // Ignore localStorage access errors (private mode/restricted contexts).
  }

  return false;
};

const springTransition = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 34,
  mass: 0.85,
};

const useRestaurantPanelSnap = () => {
  const [debugEnabled, setDebugEnabled] = useState(() => isPanelDebugEnabled());
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
  const [debugEvents, setDebugEvents] = useState<string[]>([]);

  const controls = useAnimationControls();
  const dragControls = useDragControls();
  const y = useMotionValue(0);

  const pushDebugEvent = useCallback((message: string) => {
    if (!debugEnabled) return;
    const ts = new Date().toISOString().split('T')[1]?.replace('Z', '') ?? '';
    setDebugEvents((prev) => {
      const next = [`${ts} ${message}`, ...prev];
      return next.slice(0, MAX_DEBUG_EVENTS);
    });
  }, [debugEnabled]);

  useEffect(() => {
    const updateDebugEnabled = () => {
      setDebugEnabled(isPanelDebugEnabled());
    };

    updateDebugEnabled();
    window.addEventListener('hashchange', updateDebugEnabled);
    window.addEventListener('popstate', updateDebugEnabled);

    return () => {
      window.removeEventListener('hashchange', updateDebugEnabled);
      window.removeEventListener('popstate', updateDebugEnabled);
    };
  }, []);

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
    const maxVisibleHeight = Math.max(MOBILE_PEEK_PX, viewport.height - 90);
    const visibleHeights = [
      MOBILE_PEEK_PX,
      Math.round(viewport.height * 0.25),
      Math.round(viewport.height * 0.5),
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
