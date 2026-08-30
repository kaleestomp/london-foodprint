import { useMemo } from 'react';
import type { CSSProperties } from 'react';

import { useDrawerState } from '../../../SlideUpDrawer/DrawerStateContext';

const useBubbleStyle = (
  style: 'default' | 'mobile-home' | 'pickup' | undefined,
  // homeCenter: Point | null,
  pickupPos?: { x: number; y: number } | null,
): CSSProperties | undefined => {
  
  const { isAtFullHeight: isDrawerAtFullHeight, snap: drawerHeight } = useDrawerState();

  return useMemo(() => {
    if (style === 'mobile-home') { // && homeCenter
      return {
        bottom: 'auto', 
        top: 'calc(var(--bubble-avatar-home-size)*-1 - 10px)',
        // top: `calc(${homeCenter.y}px - (var(--bubble-avatar-home-size) / 2))`,
        // opacity: isDrawerAtFullHeight ? 0 : 1,
        // transition: 'opacity 400ms ease 100ms',
      };
    }

    if (style === 'pickup' && pickupPos) {
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
      const drawerTop = vh - (drawerHeight ?? 64);
      const relativeTop = pickupPos.y - drawerTop;
      return {
        bottom: 'auto',
        left: `calc(${pickupPos.x}px - (var(--bubble-avatar-home-size) / 2))`,
        top: `calc(${relativeTop}px - (var(--bubble-avatar-home-size) / 2))`,
        marginLeft: 0,
      };
    }

    return undefined;
  }, [style, pickupPos, isDrawerAtFullHeight, drawerHeight]); // homeCenter
};

export default useBubbleStyle;