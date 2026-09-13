import { useEffect, useState } from 'react';

import { MOBILE_BREAKPOINT, RESIZE_WIDTH_JITTER_PX } from './config';

const useIsMobile = () => {
  const [viewportWidth, setViewportWidth] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth : 1280
  ));
  const [isMobile, setIsMobile] = useState(() => (
    (typeof window !== 'undefined' ? window.innerWidth : 1280) <= MOBILE_BREAKPOINT
  ));

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
    setIsMobile(viewportWidth <= MOBILE_BREAKPOINT);
  }, [viewportWidth]);

  return isMobile;
};

export default useIsMobile;