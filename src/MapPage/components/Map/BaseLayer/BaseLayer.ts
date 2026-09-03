import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

import useToggleMapMode from './useToggleMapMode';
import useAdjustMinZoom from './useAdjustMaxZoom';
import syncMaxPitch from './syncMaxPitch';
import apply3DFogVisibility from './applyFog';
import useInvertedMaskLayer from './useInvertedMaskLayer';
import { useCityContext } from '../../../../context/CityContext';

import 'maplibre-gl/dist/maplibre-gl.css';

const BaseLayer = (externalMapRef?: React.RefObject<maplibregl.Map | null>): {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  mapRef: React.RefObject<maplibregl.Map | null>;
} => {
  const { cityParams } = useCityContext();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const internalMapRef = useRef<maplibregl.Map | null>(null);
  const mapRef = externalMapRef ?? internalMapRef;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !cityParams) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: cityParams.center,
      zoom: cityParams.initZoom,
      minZoom: cityParams.minZoom,
      maxZoom: cityParams.maxZoom,
      maxBounds: cityParams.maxBounds,
      maxPitch: 0,
      dragRotate: true,
      pitchWithRotate: true,
      touchPitch: true,
      attributionControl: false,
      doubleClickZoom: false,
    });

    // map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    const handleZoom = () => syncMaxPitch(map);
    const handlePitch = () => apply3DFogVisibility(map);
    const handleStyleData = () => apply3DFogVisibility(map);
    const handleStyleImageMissing = (e: { id: string }) => {
      if (!map.hasImage(e.id)) {
        // Add a 1x1 transparent image to satisfy missing sprite/icon references in basemap tiles
        map.addImage(e.id, {
          width: 1,
          height: 1,
          data: new Uint8Array([0, 0, 0, 0]),
        });
      }
    };

    map.on('zoom', handleZoom);
    map.on('pitch', handlePitch);
    map.on('styledata', handleStyleData);
    map.on('styleimagemissing', handleStyleImageMissing);

    mapRef.current = map;

    return () => {
      map.off('zoom', handleZoom);
      map.off('pitch', handlePitch);
      map.off('styledata', handleStyleData);
      map.off('styleimagemissing', handleStyleImageMissing);
      mapRef.current = null;
      map.remove();
    };
  }, [cityParams]);

  useToggleMapMode(mapRef);
  useAdjustMinZoom(mapRef);
  useInvertedMaskLayer(mapRef);

  return { mapContainerRef, mapRef };
};

export default BaseLayer;
