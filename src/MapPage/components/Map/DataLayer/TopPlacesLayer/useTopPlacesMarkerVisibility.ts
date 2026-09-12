import { useEffect, useState } from 'react';
import type * as maplibregl from 'maplibre-gl';

export const TOP_PLACES_MIN_ZOOM = 11;

const useTopPlacesMarkerVisibility = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  enabled: boolean | undefined,
  minimumZoom: number = TOP_PLACES_MIN_ZOOM,
): boolean | null => {
  const [isVisible, setIsVisible] = useState<boolean | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!enabled || !map) {
      setIsVisible(false);
      return;
    }

    const updateVisibility = () => {
      const nextVisibility = map.getZoom() >= minimumZoom;
      setIsVisible((currentVisibility) => (
        currentVisibility === nextVisibility ? currentVisibility : nextVisibility
      ));
    };

    updateVisibility();
    map.on('zoom', updateVisibility);
    return () => {
      map.off('zoom', updateVisibility);
    };
  }, [enabled, mapRef, minimumZoom]);

  return isVisible;
};

export default useTopPlacesMarkerVisibility;
