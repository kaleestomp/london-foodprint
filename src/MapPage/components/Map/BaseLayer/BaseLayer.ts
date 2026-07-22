import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import '@maplibre/maplibre-gl-leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';

import useMapResizeSync from './useMapResizeSync'; 
import { LONDON_CENTER, LONDON_INITIAL_ZOOM, LONDON_MIN_ZOOM, LONDON_MAX_ZOOM, LONDON_BOUNDS } from '../MapTemplate'; 

const OPEN_FREE_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/fiord';
const DISABLE_BASE_LAYER = (import.meta.env as Record<string, string | undefined>).VITE_DEBUG_DISABLE_BASE_LAYER === 'true';

const BaseLayer = (externalMapRef?: React.RefObject<L.Map | null>): { 
    mapContainerRef: React.RefObject<HTMLDivElement | null>; 
    mapRef: React.RefObject<L.Map | null> 
} => { 

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const internalMapRef = useRef<L.Map | null>(null);
  const mapRef = externalMapRef ?? internalMapRef;
  const setupMapResizeSync = useMapResizeSync();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) { return; }
    const mapContainer = mapContainerRef.current;

    const map = L.map(mapContainer, { 
      attributionControl: false, 
      zoomControl: false, 
      zoomSnap: 0.0,
      inertia: true, 
      worldCopyJump: false,
      renderer: L.canvas({ willReadFrequently: true } as any),
      maxBounds: LONDON_BOUNDS,
      maxBoundsViscosity: 1.0,
      minZoom: LONDON_MIN_ZOOM,
      maxZoom: LONDON_MAX_ZOOM,
    } as L.MapOptions).setView(LONDON_CENTER, LONDON_INITIAL_ZOOM);
    mapRef.current = map;
    if (!DISABLE_BASE_LAYER) {
      (L as typeof L & {
        maplibreGL: (options: { style: string }) => L.Layer;
      }).maplibreGL({
        style: OPEN_FREE_MAP_STYLE_URL,
      }).addTo(map);
    }
    const cleanupResizeSync = setupMapResizeSync(map, mapContainer);
    return () => {
      cleanupResizeSync();
      mapRef.current = null;
      map.remove(); 
    };
  }, [setupMapResizeSync]); 

  return { mapContainerRef, mapRef };
};

export default BaseLayer;
