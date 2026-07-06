import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  COARSE_POINTER_QUERY,
  MOBILE_BREAKPOINT,
  MOBILE_ENTER_BREAKPOINT,
  MOBILE_EXIT_BREAKPOINT,
  MOBILE_PEEK_PX,
  RESIZE_HEIGHT_JITTER_PX,
  RESIZE_WIDTH_JITTER_PX,
  TAP_THRESHOLD_PX,
} from './config';

export type SnapState = 'closed' | 'open';
type DragSource = 'panel' | 'handle' | 'content';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const MOBILE_OPEN_HEIGHT_RATIO = 0.5;
const getClosedOffsetForHeight = (viewportHeight: number) => {
  const sheetHeight = Math.max(MOBILE_PEEK_PX, Math.round(viewportHeight * MOBILE_OPEN_HEIGHT_RATIO));
  return Math.max(0, sheetHeight - MOBILE_PEEK_PX);
};

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
  const [snapState, setSnapState] = useState<SnapState>('closed');
  const [translateY, setTranslateY] = useState(() =>
    typeof window !== 'undefined'
      ? getClosedOffsetForHeight(window.visualViewport?.height ?? window.innerHeight)
      : getClosedOffsetForHeight(800),
  );
  const [isDragging, setIsDragging] = useState(false);

  const dragCurrentTranslateRef = useRef(0);
  const contentPullRef = useRef<{ armed: boolean; startY: number; pointerId: number | null }>({
    armed: false,
    startY: 0,
    pointerId: null,
  });

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
        if (widthDelta < RESIZE_WIDTH_JITTER_PX && heightDelta < RESIZE_HEIGHT_JITTER_PX) return prev;
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
    const sheetHeight = Math.max(MOBILE_PEEK_PX, Math.round(viewport.height * MOBILE_OPEN_HEIGHT_RATIO));
    const snapOffsets: Record<SnapState, number> = {
      closed: Math.max(0, sheetHeight - MOBILE_PEEK_PX),
      open: 0,
    };
    return {
      snapOffsets,
      maxOffset: snapOffsets.closed,
      minOffset: snapOffsets.open,
      sheetHeight,
    };
  }, [viewport.height]);

  // Keep translateY in sync with snapState whenever not mid-drag
  useEffect(() => {
    if (!isMobile || isDragging) return;
    setTranslateY(metrics.snapOffsets[snapState]);
  }, [isDragging, isMobile, metrics.snapOffsets, snapState]);

  // Stable helper: capture the pointer and register drag listeners synchronously on window.
  // This ensures pointer move events are captured immediately without async delay.
  const startDrag = useCallback((
    clientY: number,
    pointerId: number,
    element: Element,
    source: DragSource,
  ) => {
    const startTranslate = translateY;
    setIsDragging(true);
    dragCurrentTranslateRef.current = startTranslate;
    (element as HTMLElement).setPointerCapture(pointerId);

    // Define move/end handlers with closure over initial state
    const onMove = (event: PointerEvent) => {
      const deltaY = event.clientY - clientY;
      const next = clamp(startTranslate + deltaY, metrics.minOffset, metrics.maxOffset);
      dragCurrentTranslateRef.current = next;
      setTranslateY(next);
    };

    const onEnd = () => {
      // Clean up listeners immediately
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);

      const deltaY = dragCurrentTranslateRef.current - startTranslate;
      const midpoint = (metrics.maxOffset + metrics.minOffset) / 2;
      const hasMovedEnough = Math.abs(deltaY) > TAP_THRESHOLD_PX;

      let targetState: SnapState = dragCurrentTranslateRef.current > midpoint ? 'closed' : 'open';
      if (hasMovedEnough) {
        targetState = deltaY > 0 ? 'closed' : 'open';
      }

      if (source === 'panel' && deltaY <= 0 && hasMovedEnough) {
        targetState = 'open';
      }

      setSnapState(targetState);
      setTranslateY(metrics.snapOffsets[targetState]);
      setIsDragging(false);
    };

    // Register listeners synchronously on window to capture all pointer move events
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
  }, [metrics.minOffset, metrics.maxOffset, metrics.snapOffsets, translateY]);

  // Whole-panel drag — active in closed state.
  // Capturing the pointer means the panel moves instead of the content scrolling.
  const handlePanelPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const target = event.target;
    const targetElement = target instanceof Element ? target : null;
    if (!isMobile || snapState === 'open') return;
    if (targetElement?.closest('.restaurant-sheet-header')) return;
    if (targetElement?.closest('a, button, input, textarea, select, label, [role="button"]')) return;
    startDrag(event.clientY, event.pointerId, event.currentTarget, 'panel');
  }, [isMobile, snapState, startDrag]);

  // Handle-only drag — active in all states; the primary drag trigger in full state.
  // stopPropagation prevents the panel-wide handler from also firing.
  const handleHandlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    event.stopPropagation();
    startDrag(event.clientY, event.pointerId, event.currentTarget, 'handle');
  }, [isMobile, startDrag]);

  // In open state, allow pull-down from list content only when scrolled to top.
  const handleContentPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isMobile || snapState !== 'open') return;
    const target = event.target;
    const targetElement = target instanceof Element ? target : null;
    if (targetElement?.closest('a, button, input, textarea, select, label, [role="button"]')) return;
    if (event.currentTarget.scrollTop > 0) return;
    contentPullRef.current.armed = true;
    contentPullRef.current.startY = event.clientY;
    contentPullRef.current.pointerId = event.pointerId;
  }, [isMobile, snapState]);

  const handleContentPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!contentPullRef.current.armed) return;
    if (contentPullRef.current.pointerId !== event.pointerId) return;
    if (event.currentTarget.scrollTop > 0) {
      contentPullRef.current.armed = false;
      contentPullRef.current.pointerId = null;
      return;
    }
    const deltaY = event.clientY - contentPullRef.current.startY;
    if (deltaY <= TAP_THRESHOLD_PX) return;
    event.preventDefault();
    startDrag(contentPullRef.current.startY, event.pointerId, event.currentTarget, 'content');
    contentPullRef.current.armed = false;
    contentPullRef.current.pointerId = null;
  }, [startDrag]);

  const clearContentPullArmed = useCallback(() => {
    contentPullRef.current.armed = false;
    contentPullRef.current.pointerId = null;
  }, []);

  return {
    snapState,
    handlePanelPointerDown,
    handleHandlePointerDown,
    handleContentPointerDown,
    handleContentPointerMove,
    handleContentPointerUp: clearContentPullArmed,
    handleContentPointerCancel: clearContentPullArmed,
    isDragging,
    isMobile,
    isPanelOpen: !isMobile || snapState !== 'closed',
    panelHeight: metrics.sheetHeight,
    translateY,
  };
};

export default useRestaurantPanelSnap;
