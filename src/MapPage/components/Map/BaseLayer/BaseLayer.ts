import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import '@maplibre/maplibre-gl-leaflet';

import { useAppUI } from '../../../../context/AppUIContext';
import useMapResizeSync from './useMapResizeSync'; 
import { LONDON_CENTER, LONDON_INITIAL_ZOOM, LONDON_MIN_ZOOM, LONDON_MAX_ZOOM, LONDON_BOUNDS } from '../MapTemplate'; 
import 'maplibre-gl/dist/maplibre-gl.css';

// const STYLE_POSITRON = 'https://tiles.openfreemap.org/styles/positron'
// const VERSA_TILES = 'https://tiles.versatiles.org/assets/styles/shadow/style.json';
const STYLE_COLOURFUL = 'https://tiles.versatiles.org/assets/styles/colorful/style.json';
const STYLE_FIORD = 'https://tiles.openfreemap.org/styles/fiord'; //include 3D
const DISABLE_BASE_LAYER = (import.meta.env as Record<string, string | undefined>).VITE_DEBUG_DISABLE_BASE_LAYER === 'true';

type MapLibreLeafletFactory = typeof L & {
  maplibreGL: (options: { style: string }) => L.Layer;
};

const BaseLayer = (externalMapRef?: React.RefObject<L.Map | null>): { 
    mapContainerRef: React.RefObject<HTMLDivElement | null>; 
    mapRef: React.RefObject<L.Map | null> 
} => { 
  const { mapMode } = useAppUI();
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const internalMapRef = useRef<L.Map | null>(null);
  const mapRef = externalMapRef ?? internalMapRef;
  const baseLayerRef = useRef<L.Layer | null>(null);
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
    // if (!DISABLE_BASE_LAYER) {
    //   (L as typeof L & {
    //     maplibreGL: (options: { style: string }) => L.Layer;
    //   }).maplibreGL({
    //     style: colorMode === 'dark' ? STYLE_COLOURFUL : STYLE_FIORD,
    //   }).addTo(map);
    // }
    const cleanupResizeSync = setupMapResizeSync(map, mapContainer);
    return () => {
      if (baseLayerRef.current) {
        map.removeLayer(baseLayerRef.current);
        baseLayerRef.current = null;
      }
      cleanupResizeSync();
      mapRef.current = null;
      map.remove(); 
    };
  }, [setupMapResizeSync, mapRef]); 

  useEffect(() => {
    const map = mapRef.current;
    if (!map || DISABLE_BASE_LAYER) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
      baseLayerRef.current = null;
    }

    const style = mapMode === 'dark' ? STYLE_FIORD : STYLE_COLOURFUL;
    const baseLayer = (L as MapLibreLeafletFactory).maplibreGL({ style });
    baseLayer.addTo(map);
    baseLayerRef.current = baseLayer;

    return () => {
      if (!baseLayerRef.current) return;
      map.removeLayer(baseLayerRef.current);
      baseLayerRef.current = null;
    };
  }, [mapMode, mapRef]);

  return { mapContainerRef, mapRef };
};

export default BaseLayer;
