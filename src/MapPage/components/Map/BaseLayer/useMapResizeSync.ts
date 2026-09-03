import { useCallback } from 'react';

import { syncMinZoomToWorldExtent } from '../MapTemplate';
import { useCityContext } from '../../../../context/CityContext';

type ResizeCompatibleMap = {
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
  resize?: () => void;
  getZoom: () => number;
  setZoom: (zoom: number) => void;
};

type CleanupFn = () => void;

const useMapResizeSync = () => {
  const { cityParams } = useCityContext();

  return useCallback((map: ResizeCompatibleMap, mapContainer: HTMLElement): CleanupFn => {
    let rafId: number | null = null;

    const syncMapViewport = () => {
      if (rafId !== null) { cancelAnimationFrame(rafId); }
      rafId = requestAnimationFrame(() => {
        if (map.resize) {
          map.resize();
        }
        syncMinZoomToWorldExtent(map as never, cityParams);
      });
    };

    const handleResize = () => syncMinZoomToWorldExtent(map as never, cityParams);
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