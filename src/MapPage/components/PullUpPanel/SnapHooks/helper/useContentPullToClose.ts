import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';

import { TAP_THRESHOLD_PX } from '../../../../../utils/browser/config';
import type { SnapState } from '../config';

type UseContentPullToCloseArgs = {
  isMobile: boolean;
  snapState: SnapState;
  startDrag: (clientY: number, pointerId: number, element: Element, source: 'content') => void;
};

const useContentPullToClose = ({
  isMobile,
  snapState,
  startDrag,
}: UseContentPullToCloseArgs) => {
  const contentPullRef = useRef<{ armed: boolean; startY: number; pointerId: number | null }>({
    armed: false,
    startY: 0,
    pointerId: null,
  });

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
    handleContentPointerDown,
    handleContentPointerMove,
    handleContentPointerUp: clearContentPullArmed,
    handleContentPointerCancel: clearContentPullArmed,
  };
};

export default useContentPullToClose;