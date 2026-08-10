import { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';

import createPersistentLayer from '../LayerStates/createPersistentLayer';
import { type TileDensity } from '../../../../request/useRequestTiles/request';
import { useAppUI } from '../../../../../context/AppUIContext';
import useFetchTiles from './InputHooks/useFetchTiles';
import addHeatmap from './addHeatmap';

const ZOOM_THRESHOLD = 11;

const useHeatmapLayer = (
  mapRef: React.RefObject<L.Map | null>,
  enabled?: boolean,
): void => {
  const { heatmapEnabled } = useAppUI();
  const layerEnabled = Boolean(enabled) && heatmapEnabled;

  const { status, res, isPlaceholderData } = useFetchTiles(layerEnabled);
  const layerRef = createPersistentLayer(mapRef);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const currentResRef = useRef<number | null>(null);

  const clearLayer = useCallback(() => {
    const layer = layerRef.current;
    const heatLayer = heatLayerRef.current;
    if (layer && heatLayer) {
      layer.removeLayer(heatLayer);
    }
    heatLayerRef.current = null;
  }, []);

  const renderHeatmap = useCallback((resolution: number, tiles: TileDensity[]) => {
    
    const layer = layerRef.current;
    if (!layer) return;

    clearLayer();

    if (!tiles.length) {
      currentResRef.current = resolution;
      return;
    }

    const zoom = mapRef.current?.getZoom();
    const heatLayer = addHeatmap(layer, tiles, zoom);
    heatLayerRef.current = heatLayer;
    currentResRef.current = resolution;
  }, [clearLayer, layerRef]);

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