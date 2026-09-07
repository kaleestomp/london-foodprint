import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

import useToggleMapMode from './useMapStyle/useToggleMapMode';
import useAdjustMinZoom from './useCamera/useAdjustMaxZoom';
import syncMaxPitch from './useCamera/syncMaxPitch';
import useInvertedMaskLayer from './useMaskLayer/useInvertedMaskLayer';
import useToggleBuilding3DLayer from './useBuilding3DLayer/useToggleBuilding3DLayer';
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
    map.on('styleimagemissing', handleStyleImageMissing);

    mapRef.current = map;

    return () => {
      map.off('zoom', handleZoom);
      map.off('styleimagemissing', handleStyleImageMissing);
      mapRef.current = null;
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter + re-bound the existing map when the city changes (city switch).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !cityParams) return;
    map.setMaxBounds(null as unknown as maplibregl.LngLatBoundsLike);
    map.jumpTo({ center: cityParams.center, zoom: cityParams.initZoom });
    map.setMaxBounds(cityParams.maxBounds);
    map.setMinZoom(cityParams.minZoom);
    map.setMaxZoom(cityParams.maxZoom);
  }, [cityParams, mapRef]);

  useToggleMapMode(mapRef);
  useAdjustMinZoom(mapRef);
  useInvertedMaskLayer(mapRef);
  useToggleBuilding3DLayer(mapRef);

  return { mapContainerRef, mapRef };
};

export default BaseLayer;
