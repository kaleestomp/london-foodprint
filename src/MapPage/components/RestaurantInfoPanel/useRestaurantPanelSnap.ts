import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  COARSE_POINTER_QUERY,
  MOBILE_BREAKPOINT,
  MOBILE_ENTER_BREAKPOINT,
  MOBILE_EXIT_BREAKPOINT,
  MOBILE_FULL_TOP_GAP_PX,
  MOBILE_PEEK_PX,
  MOBILE_PREVIEW_RATIO,
  RESIZE_HEIGHT_JITTER_PX,
  RESIZE_WIDTH_JITTER_PX,
  TAP_THRESHOLD_PX,
} from './config';

export type SnapState = 'closed' | 'preview' | 'full';

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
  const [snapState, setSnapState] = useState<SnapState>('closed');
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartYRef = useRef(0);
  const dragStartTranslateRef = useRef(0);
  const dragCurrentTranslateRef = useRef(0);
  const dragStartStateRef = useRef<SnapState>('closed');

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
    const sheetHeight = viewport.height;
    const fullVisible = Math.max(MOBILE_PEEK_PX, viewport.height - MOBILE_FULL_TOP_GAP_PX);
    const snapOffsets: Record<SnapState, number> = {
      closed:  Math.max(0, sheetHeight - MOBILE_PEEK_PX),
      preview: Math.max(0, sheetHeight - Math.round(viewport.height * MOBILE_PREVIEW_RATIO)),
      full:    Math.max(0, sheetHeight - fullVisible),
    };
    return {
      snapOffsets,
      maxOffset: snapOffsets.closed,
      minOffset: snapOffsets.full,
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
  const startDrag = useCallback((clientY: number, pointerId: number, element: Element) => {
    setIsDragging(true);
    dragStartYRef.current = clientY;
    dragStartTranslateRef.current = translateY;
    dragCurrentTranslateRef.current = translateY;
    dragStartStateRef.current = snapState;
    (element as HTMLElement).setPointerCapture(pointerId);

    // Define move/end handlers with closure over initial state
    const onMove = (event: PointerEvent) => {
      const deltaY = event.clientY - dragStartYRef.current;
      const next = clamp(dragStartTranslateRef.current + deltaY, metrics.minOffset, metrics.maxOffset);
      dragCurrentTranslateRef.current = next;
      setTranslateY(next);
    };

    const onEnd = () => {
      // Clean up listeners immediately
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);

      const movedDistance = Math.abs(dragCurrentTranslateRef.current - dragStartTranslateRef.current);
      let targetState: SnapState;

      if (movedDistance < TAP_THRESHOLD_PX) {
        // Tap with no real movement: advance to next state
        const current = dragStartStateRef.current;
        targetState = current === 'closed' ? 'preview' : 'full';
      } else {
        // Drag: commit to the adjacent state based on direction from the state where drag started.
        const deltaY = dragCurrentTranslateRef.current - dragStartTranslateRef.current;
        const startState = dragStartStateRef.current;

        if (deltaY > 0) {
          targetState = startState === 'full' ? 'preview' : 'closed';
        } else {
          targetState = startState === 'closed' ? 'preview' : 'full';
        }
      }

      setSnapState(targetState);
      setTranslateY(metrics.snapOffsets[targetState]);
      setIsDragging(false);
    };

    // Register listeners synchronously on window to capture all pointer move events
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
  }, [metrics.minOffset, metrics.maxOffset, metrics.snapOffsets, snapState, translateY]);

  // Whole-panel drag — active in closed and preview states.
  // Capturing the pointer means the panel moves instead of the content scrolling.
  const handlePanelPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const target = event.target;
    const targetElement = target instanceof Element ? target : null;
    if (!isMobile || snapState === 'full') return;
    if (targetElement?.closest('.restaurant-sheet-header')) return;
    if (targetElement?.closest('a, button, input, textarea, select, label, [role="button"]')) return;
    startDrag(event.clientY, event.pointerId, event.currentTarget);
  }, [isMobile, snapState, startDrag]);

  // Handle-only drag — active in all states; the primary drag trigger in full state.
  // stopPropagation prevents the panel-wide handler from also firing.
  const handleHandlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    event.stopPropagation();
    startDrag(event.clientY, event.pointerId, event.currentTarget);
  }, [isMobile, startDrag]);

  return {
    snapState,
    handlePanelPointerDown,
    handleHandlePointerDown,
    isDragging,
    isMobile,
    isPanelOpen: !isMobile || snapState !== 'closed',
    panelHeight: metrics.sheetHeight,
    translateY,
  };
};

export default useRestaurantPanelSnap;
