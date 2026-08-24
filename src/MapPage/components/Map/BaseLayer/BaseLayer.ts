import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

import { useAppUI } from '../../../../context/AppUIContext';
// import useMapResizeSync from './useMapResizeSync';
import syncMaxPitch from './syncMaxPitch';
import load3dBuildings from './load3dBuildings';
import {
  LONDON_CENTER, LONDON_INITIAL_ZOOM, LONDON_MIN_ZOOM,
  LONDON_MAX_ZOOM, LONDON_BOUNDS
} from '../MapTemplate';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE_BASE = 'https://tiles.openfreemap.org/styles/fiord';
const DISABLE_BASE_LAYER = (import.meta.env as Record<string, string | undefined>).VITE_DEBUG_DISABLE_BASE_LAYER === 'true';
// const MAPTILER_KEY = (import.meta.env as Record<string, string | undefined>).VITE_MAPTILER_KEY;
// const STYLE_BASE = `https://api.maptiler.com/maps/base-v4/style.json?key=${MAPTILER_KEY}`;

const BaseLayer = (externalMapRef?: React.RefObject<maplibregl.Map | null>): {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  mapRef: React.RefObject<maplibregl.Map | null>;
} => {
  const { mapMode } = useAppUI();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const internalMapRef = useRef<maplibregl.Map | null>(null);
  const mapRef = externalMapRef ?? internalMapRef;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: STYLE_BASE,
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
    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showZoom: false,
        showCompass: true
      })
    );
    load3dBuildings(map);
    map.on('zoom', () => syncMaxPitch(map));

    mapRef.current = map;

    return () => {
      map.off('zoom', () => syncMaxPitch(map));
      mapRef.current = null;
      map.remove();
    };
  }, [mapMode, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || DISABLE_BASE_LAYER) return;

    map.setStyle(STYLE_BASE);
  }, [mapMode, mapRef]);

  return { mapContainerRef, mapRef };
};

export default BaseLayer;
