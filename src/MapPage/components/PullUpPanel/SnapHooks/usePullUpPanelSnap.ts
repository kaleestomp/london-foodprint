import { useCallback, useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';import useIsMobile from '../../../../utils/browser/useIsMobile';
import useViewportHeightWithJitter from './helper/useViewportHeightWithJitter';
import usePanelDragEngine from './helper/usePanelDragEngine';
import useContentPullToClose from './helper/useContentPullToClose';
import useClearActiveToolbarTabOnClose from './helper/useClearActiveToolbarTabOnClose';

import { TAP_THRESHOLD_PX } from '../../../../utils/browser/config';
import { 
  MOBILE_PEEK_PX, MOBILE_OPEN_HEIGHT_RATIO, 
  getClosedOffsetForHeight, 
  type DragSource, type SnapState,
} from './config';

const usePullUpPanelSnap = () => {
  const isMobile = useIsMobile();
  const viewportHeight = useViewportHeightWithJitter();
  const [snapState, setSnapState] = useState<SnapState>('closed');
  const [translateY, setTranslateY] = useState(() =>
    typeof window !== 'undefined'
      ? getClosedOffsetForHeight(window.visualViewport?.height ?? window.innerHeight)
      : getClosedOffsetForHeight(800),
  );

  const metrics = useMemo(() => {
    const sheetHeight = Math.max(MOBILE_PEEK_PX, Math.round(viewportHeight * MOBILE_OPEN_HEIGHT_RATIO));
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
  }, [viewportHeight]);

  const handleDragEnd = useCallback(({ source, startTranslate, endTranslate }: {
    source: DragSource;
    startTranslate: number;
    endTranslate: number;
  }) => {
    const deltaY = endTranslate - startTranslate;
    const midpoint = (metrics.maxOffset + metrics.minOffset) / 2;
    const hasMovedEnough = Math.abs(deltaY) > TAP_THRESHOLD_PX;

    let targetState: SnapState = endTranslate > midpoint ? 'closed' : 'open';
    if (hasMovedEnough) {
      targetState = deltaY > 0 ? 'closed' : 'open';
    }

    if (source === 'panel' && deltaY <= 0 && hasMovedEnough) {
      targetState = 'open';
    }

    setSnapState(targetState);
    setTranslateY(metrics.snapOffsets[targetState]);
  }, [metrics.maxOffset, metrics.minOffset, metrics.snapOffsets]);

  const openPanel = useCallback(() => {
    if (!isMobile) return;
    setSnapState('open');
    setTranslateY(metrics.snapOffsets.open);
  }, [isMobile, metrics.snapOffsets.open]);

  const { isDragging, startDrag } = usePanelDragEngine({
    minOffset: metrics.minOffset,
    maxOffset: metrics.maxOffset,
    currentTranslate: translateY,
    onMoveTranslate: setTranslateY,
    onDragEnd: handleDragEnd,
  });

  // Keep translateY in sync with snapState whenever not mid-drag
  useEffect(() => {
    if (!isMobile || isDragging) return;
    setTranslateY(metrics.snapOffsets[snapState]);
  }, [isDragging, isMobile, metrics.snapOffsets, snapState]);

  useClearActiveToolbarTabOnClose(snapState);

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

  const {
    handleContentPointerDown,
    handleContentPointerMove,
    handleContentPointerUp,
    handleContentPointerCancel,
  } = useContentPullToClose({
    isMobile,
    snapState,
    startDrag,
  });

  return {
    snapState,
    handlePanelPointerDown,
    handleHandlePointerDown,
    handleContentPointerDown,
    handleContentPointerMove,
    handleContentPointerUp,
    handleContentPointerCancel,
    isDragging,
    isMobile,
    isPanelOpen: !isMobile || snapState !== 'closed',
    panelHeight: metrics.sheetHeight,
    translateY,
    openPanel,
  };
};

export default usePullUpPanelSnap;
