import { useCallback } from 'react';

import { type Point } from '../../config';

type UseIsDropOnRestaurantPanelArgs = {
  isMobile: boolean;
  translateY: number;
  panelHeight: number;
};

const useIsDropOnRestaurantPanel = ({
  isMobile,
  translateY,
  panelHeight,
}: UseIsDropOnRestaurantPanelArgs) => {
  return useCallback((point: Point) => {
    if (!isMobile) return false;

    const panelTop = Math.max(0, translateY);
    const panelBottom = panelTop + Math.max(0, panelHeight);

    return (
      point.x >= 0 &&
      point.x <= window.innerWidth &&
      point.y >= panelTop &&
      point.y <= panelBottom
    );
  }, [isMobile, panelHeight, translateY]);
};

export default useIsDropOnRestaurantPanel;