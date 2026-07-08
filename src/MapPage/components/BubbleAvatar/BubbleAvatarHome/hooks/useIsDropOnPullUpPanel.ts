import { useCallback } from 'react';

import { type Point } from '../../config';

type UseIsDropOnPullUpPanelArgs = {
  isMobile: boolean;
  translateY: number;
  panelHeight: number;
};

const useIsDropOnPullUpPanel = ({
  isMobile,
  translateY,
  panelHeight,
}: UseIsDropOnPullUpPanelArgs) => {
  return useCallback((point: Point) => {
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
};

export default useIsDropOnPullUpPanel;