import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type PanInfo,
  useAnimationControls,
  useMotionValue,
} from 'framer-motion';

const MOBILE_BREAKPOINT = 960;
const MOBILE_PEEK_PX = 72;

const springTransition = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 34,
  mass: 0.85,
};

const useRestaurantPanelSnap = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });
  const [snapIndex, setSnapIndex] = useState(0);

  const controls = useAnimationControls();
  const y = useMotionValue(0);

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = viewport.width < MOBILE_BREAKPOINT;

  const metrics = useMemo(() => {
    const sheetHeight = viewport.height;
    const maxVisibleHeight = Math.max(MOBILE_PEEK_PX, Math.round(viewport.height * 0.8));
    const visibleHeights = [
      MOBILE_PEEK_PX,
      Math.round(viewport.height * 0.25),
      Math.round(viewport.height * 0.45),
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
    const next = metrics.offsets[nearestIndex];
    controls.start({ y: next, transition: springTransition });
  }, [controls, metrics.offsets, y]);

  return {
    controls,
    dragConstraints: { top: metrics.minOffset, bottom: metrics.maxOffset },
    handleDragEnd,
    isMobile,
    panelHeight: metrics.sheetHeight,
    transition: springTransition,
    y,
  };
};

export default useRestaurantPanelSnap;
