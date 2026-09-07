import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

const DEFAULT_BUILDING_LAYER_ID = 'Building 3D';

const useToggleBuilding3DLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  layerId: string = DEFAULT_BUILDING_LAYER_ID,
): void => {
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateVisibility = () => {
      if (!map.isStyleLoaded() || !map.getLayer(layerId)) return;

      map.setLayoutProperty(
        layerId,
        'visibility',
        map.getPitch() > 0 ? 'visible' : 'none',
      );
    };

    updateVisibility();
    map.on('load', updateVisibility);
    map.on('style.load', updateVisibility);
    map.on('pitch', updateVisibility);

    return () => {
      map.off('load', updateVisibility);
      map.off('style.load', updateVisibility);
      map.off('pitch', updateVisibility);
    };
  }, [mapRef, layerId]);
};

export default useToggleBuilding3DLayer;