import { useMemo, useCallback } from 'react';

import { useAppUI } from '../../../../../context/AppUIContext';
import { usePullUpPanelMetrics } from '../../../PullUpPanel/SnapHooks/PullUpPanelSnapContext';
import { type Point } from '../../config';

const useIsDropOnPullUpPanel = (point: Point) => {
  
  const { isMobile } = useAppUI();
  const { translateY, panelHeight } = usePullUpPanelMetrics();

  const check = useCallback((point: Point) => {
    if (!isMobile) return false;

    const safePanelHeight = Math.max(0, panelHeight);
    const panelTop = Math.max(0, window.innerHeight - safePanelHeight + Math.max(0, translateY));
    const panelBottom = panelTop + safePanelHeight;

    return (
      point.x >= 0 &&
      point.x <= window.innerWidth &&
      point.y >= panelTop &&
      point.y <= panelBottom
    );
  }, [isMobile, panelHeight, translateY]);

  const isDropOnPullUpPanel = useMemo(() => check(point), [check, point]);

  return isDropOnPullUpPanel;
};

export default useIsDropOnPullUpPanel;