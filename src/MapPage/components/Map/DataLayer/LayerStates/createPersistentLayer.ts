import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

export type PersistentLayer = {
  markers: Set<maplibregl.Marker>;
};

const createPersistentLayer = (mapRef: React.RefObject<maplibregl.Map | null>): React.RefObject<PersistentLayer | null> => {

  const layerRef = useRef<PersistentLayer | null>(null);
  // Create the persistent layer group once on mount, add to map, never remove it.
  
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer: PersistentLayer = { markers: new Set() };
    layerRef.current = layer;
    return () => {
      layer.markers.forEach((marker) => marker.remove());
      layer.markers.clear();
      layerRef.current = null;
    };
  }, [mapRef]);

  return layerRef;
};

export default createPersistentLayer;
