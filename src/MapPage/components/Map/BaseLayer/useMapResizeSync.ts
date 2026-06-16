import { useCallback } from 'react';
import L from 'leaflet';

import { syncMinZoomToWorldExtent } from '../MapTemplate';

type CleanupFn = () => void;

const useMapResizeSync = () => {
  return useCallback((map: L.Map, mapContainer: HTMLElement): CleanupFn => {
    let rafId: number | null = null;

    const syncMapViewport = () => {
      if (rafId !== null) { cancelAnimationFrame(rafId); }
      rafId = requestAnimationFrame(() => {
        map.invalidateSize();
        syncMinZoomToWorldExtent(map);
      });
    };

    const handleResize = () => syncMinZoomToWorldExtent(map);
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