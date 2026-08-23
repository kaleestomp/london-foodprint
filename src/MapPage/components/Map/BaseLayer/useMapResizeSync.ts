import { useCallback } from 'react';

import { syncMinZoomToWorldExtent } from '../MapTemplate';

type ResizeCompatibleMap = {
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
  resize?: () => void;
  getZoom: () => number;
  setZoom: (zoom: number) => void;
};

type CleanupFn = () => void;

const useMapResizeSync = () => {
  return useCallback((map: ResizeCompatibleMap, mapContainer: HTMLElement): CleanupFn => {
    let rafId: number | null = null;

    const syncMapViewport = () => {
      if (rafId !== null) { cancelAnimationFrame(rafId); }
      rafId = requestAnimationFrame(() => {
        if (map.resize) {
          map.resize();
        }
        syncMinZoomToWorldExtent(map as never);
      });
    };

    const handleResize = () => syncMinZoomToWorldExtent(map as never);
    map.on('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      syncMapViewport();
    });
    resizeObserver.observe(mapContainer);
    syncMapViewport();

    return () => {
      resizeObserver.disconnect();
      if (rafId !== null) { cancelAnimationFrame(rafId); }
      map.off('resize', handleResize);
    };
  }, []);
};

export default useMapResizeSync;