import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

import useToggleMapMode from './useToggleMapMode';
import useAdjustMinZoom from './useAdjustMaxZoom';
import syncMaxPitch from './syncMaxPitch';
import apply3DFogVisibility from './applyFog';

import {
  LONDON_CENTER, LONDON_INITIAL_ZOOM, LONDON_MIN_ZOOM,
  LONDON_MAX_ZOOM, LONDON_BOUNDS
} from '../MapTemplate';
import 'maplibre-gl/dist/maplibre-gl.css';

const BaseLayer = (externalMapRef?: React.RefObject<maplibregl.Map | null>): {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  mapRef: React.RefObject<maplibregl.Map | null>;
} => {
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const internalMapRef = useRef<maplibregl.Map | null>(null);
  const mapRef = externalMapRef ?? internalMapRef;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: LONDON_CENTER,
      zoom: LONDON_INITIAL_ZOOM,
      minZoom: LONDON_MIN_ZOOM,
      maxZoom: LONDON_MAX_ZOOM,
      maxBounds: LONDON_BOUNDS,
      maxPitch: 0,
      dragRotate: true,
      pitchWithRotate: true,
      touchPitch: true,
      attributionControl: false,
      doubleClickZoom: false,
    });

    const handleZoom = () => syncMaxPitch(map);
    const handlePitch = () => apply3DFogVisibility(map);
    const handleStyleData = () => apply3DFogVisibility(map);

    map.on('zoom', handleZoom);
    map.on('pitch', handlePitch);
    map.on('styledata', handleStyleData);

    mapRef.current = map;

    return () => {
      map.off('zoom', handleZoom);
      map.off('pitch', handlePitch);
      map.off('styledata', handleStyleData);
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useToggleMapMode(mapRef);
  useAdjustMinZoom(mapRef);

  return { mapContainerRef, mapRef };
};

export default BaseLayer;
