import { useEffect, useState } from 'react';

import {
  COARSE_POINTER_QUERY,
  MOBILE_BREAKPOINT,
  MOBILE_ENTER_BREAKPOINT,
  MOBILE_EXIT_BREAKPOINT,
  RESIZE_WIDTH_JITTER_PX,
} from './config';

const useIsMobile = () => {
  const [viewportWidth, setViewportWidth] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth : 1280
  ));
  const [isCoarsePointer, setIsCoarsePointer] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia(COARSE_POINTER_QUERY).matches
  ));
  const [isMobile, setIsMobile] = useState(() => (
    (typeof window !== 'undefined' ? window.innerWidth : 1280) < MOBILE_BREAKPOINT
  ));

  useEffect(() => {
    const media = window.matchMedia(COARSE_POINTER_QUERY);
    const updateCoarsePointer = () => setIsCoarsePointer(media.matches);
    updateCoarsePointer();
    media.addEventListener('change', updateCoarsePointer);
    return () => media.removeEventListener('change', updateCoarsePointer);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const nextWidth = window.innerWidth;
      setViewportWidth((prev) => {
        const widthDelta = Math.abs(prev - nextWidth);
        return widthDelta < RESIZE_WIDTH_JITTER_PX ? prev : nextWidth;
      });
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isCoarsePointer) {
      setIsMobile(true);
      return;
    }

    setIsMobile((prev) => {
      if (prev) return viewportWidth < MOBILE_EXIT_BREAKPOINT;
      return viewportWidth <= MOBILE_ENTER_BREAKPOINT;
    });
  }, [isCoarsePointer, viewportWidth]);

  return isMobile;
};

export default useIsMobile;