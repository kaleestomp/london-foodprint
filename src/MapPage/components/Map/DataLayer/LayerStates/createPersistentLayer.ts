import { useEffect, useRef } from 'react';
import L from 'leaflet';

const createPersistentLayer = (mapRef: React.RefObject<L.Map | null>): React.RefObject<L.LayerGroup | null> => {

  const layerRef = useRef<L.LayerGroup | null>(null);
  // Create the persistent layer group once on mount, add to map, never remove it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;
    return () => {
      layer.remove();
      layerRef.current = null;
    };
  }, []);

  return layerRef;
};

export default createPersistentLayer;
