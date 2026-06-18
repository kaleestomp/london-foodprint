import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';

import useMapResizeSync from './useMapResizeSync'; 
import { LONDON_CENTER, LONDON_INITIAL_ZOOM, LONDON_MIN_ZOOM, LONDON_MAX_ZOOM, LONDON_BOUNDS } from '../MapTemplate'; 

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
      inertia: true, 
      worldCopyJump: false,
      renderer: L.canvas({ willReadFrequently: true } as any),
      maxBounds: LONDON_BOUNDS,
      maxBoundsViscosity: 1.0,
      minZoom: LONDON_MIN_ZOOM,
      maxZoom: LONDON_MAX_ZOOM,
    }).setView(LONDON_CENTER, LONDON_INITIAL_ZOOM);
    mapRef.current = map;
    // 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png'
    L.tileLayer(TILE_URL, {
      minZoom: 0,
      maxZoom: 20,
      attribution: TILE_ATTRIBUTION,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);
    // '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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