import { useCallback, useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';

import { type TileDensity } from '../../../../request/useRequestTiles/request';
import { useAppUI } from '../../../../../context/AppUIContext';
import useFetchTiles from './InputHooks/useFetchTiles';
import addHeatmap from './addHeatmap';

const ZOOM_THRESHOLD = 11;

const useHeatmapLayer = (
  mapRef: React.RefObject<maplibregl.Map | null>,
  enabled?: boolean,
): void => {
  const { heatmapEnabled } = useAppUI();
  const layerEnabled = Boolean(enabled) && heatmapEnabled;

  const { status, res, isPlaceholderData } = useFetchTiles(layerEnabled);
  const removeHeatmapRef = useRef<(() => void) | null>(null);
  const currentResRef = useRef<number | null>(null);

  const clearLayer = useCallback(() => {
    removeHeatmapRef.current?.();
    removeHeatmapRef.current = null;
  }, []);

  const renderHeatmap = useCallback((resolution: number, tiles: TileDensity[]) => {
    
    const map = mapRef.current;
    if (!map) return;

    clearLayer();

    if (!tiles.length) {
      currentResRef.current = resolution;
      return;
    }

    const zoom = mapRef.current?.getZoom();
    removeHeatmapRef.current = addHeatmap(map, tiles, zoom);
    currentResRef.current = resolution;
  }, [clearLayer, mapRef]);

  const syncHeatmap = useCallback(() => {
    
    const map = mapRef.current;
    if (!map) return;
    if (!layerEnabled || map.getZoom() <= ZOOM_THRESHOLD) {
      clearLayer();
      return;
    }
    
    if (!res || res.mode !== 'tiles' || status !== 'success' || isPlaceholderData) return;
    const tiles = res.data;
    
    if (res.resolution !== currentResRef.current) {
      renderHeatmap(res.resolution, tiles);
      return;
    }

    renderHeatmap(res.resolution, tiles);
  }, [clearLayer, isPlaceholderData, layerEnabled, mapRef, renderHeatmap, res, status]);

  useEffect(() => {
    syncHeatmap();
  }, [syncHeatmap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleZoomEnd = () => {
      syncHeatmap();
    };

    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [mapRef, syncHeatmap]);

  useEffect(() => () => {
    clearLayer();
    currentResRef.current = null;
  }, [clearLayer]);
};

export default useHeatmapLayer;