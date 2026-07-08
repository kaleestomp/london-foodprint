import { useEffect, useState } from 'react';

import { RESIZE_HEIGHT_JITTER_PX } from '../../../../../utils/browser/config';

const getViewportHeight = () => (
  typeof window !== 'undefined' ? (window.visualViewport?.height ?? window.innerHeight) : 800
);

const useViewportHeightWithJitter = () => {
  const [viewportHeight, setViewportHeight] = useState(getViewportHeight);

  useEffect(() => {
    const onResize = () => {
      const nextHeight = getViewportHeight();
      setViewportHeight((prev) => {
        const heightDelta = Math.abs(prev - nextHeight);
        if (heightDelta < RESIZE_HEIGHT_JITTER_PX) return prev;
        return nextHeight;
      });
    };

    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, []);

  return viewportHeight;
};

export default useViewportHeightWithJitter;