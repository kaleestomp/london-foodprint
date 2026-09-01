import { useMemo, useCallback } from 'react';

import { useIsMobileCtx } from '../../../../../context/IsMobileContext';
import { useDrawerState } from '../../../SlideUpDrawer/DrawerStateContext';
import { type Point } from '../../config';

const useIsDropOnDrawer = (point: Point) => {
  
  const isMobile = useIsMobileCtx();
  const { snapPX } = useDrawerState();

  const check = useCallback((point: Point) => {
    if (!isMobile || !snapPX) return false;

    const panelTopY = Math.max(0, window.innerHeight - snapPX); 
    const panelBottomY = panelTopY + snapPX; 

    return (
      point.x >= 0 &&
      point.x <= window.innerWidth &&
      point.y >= panelTopY &&
      point.y <= panelBottomY
    );
  }, [isMobile, snapPX]);

  const isDropOnDrawer = useMemo(() => check(point), [check, point]);

  return isDropOnDrawer;
};

export default useIsDropOnDrawer;