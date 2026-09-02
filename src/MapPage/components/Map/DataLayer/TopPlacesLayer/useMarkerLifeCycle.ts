import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

import type { MarkerLifecycleCache } from './syncMarkers/markerLifecycle/markerLifecycle';

const useMarkerLifeCycle = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  enabled?: boolean,
): {
    cacheRef: React.RefObject<MarkerLifecycleCache>;
    markersRef: React.RefObject<Map<string, maplibregl.Marker>>;
} => {

  const cacheRef = useRef<MarkerLifecycleCache>(new Map());
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  
  // Marker cleanup on map unmount.
  useEffect(() => {
    if (!enabled) return;

    return () => {
      cacheRef.current.forEach((entry) => {
        entry.marker.remove();
      });
      cacheRef.current.clear();
      markersRef.current.clear();
    };
  }, [mapRef, enabled]);

  return { cacheRef, markersRef };
};

export default useMarkerLifeCycle;