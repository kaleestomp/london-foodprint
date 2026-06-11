import { useEffect, useRef } from 'react';
import L from 'leaflet';

import { useAppUI } from '../../../../../context/AppUIContext';
import useRequestTiles from '../../../../request/useRequestTiles/useRequestTiles';
import addH3Grid from './addH3Grid';
import addMarkers from './addMarkers';
import onUserRoam from './updateOnMove';

const LOADING_DELAY_MS = 2000;

const DataLayer = (mapRef: React.RefObject<L.Map | null>): void => {

  const layerRef = useRef<L.LayerGroup | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Map-level tile cache: tracks which H3 cell IDs are already rendered.
  // Cleared when resolution changes so a zoom-level switch redraws cleanly.
  const renderedTilesRef = useRef<Set<string>>(new Set());
  const currentResRef = useRef<number | null>(null);
  const { toggleLoading } = useAppUI();

  const viewportParams = onUserRoam(mapRef);
  const { status, res } = useRequestTiles(viewportParams);
  console.log('viewportParams', viewportParams);
  // Only show loading spinner if request takes longer than LOADING_DELAY_MS.
  useEffect(() => {
    if (status === 'loading') {
      loadingTimerRef.current = setTimeout(() => {
        toggleLoading(true);
      }, LOADING_DELAY_MS);
    } else {
      if (loadingTimerRef.current !== null) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      toggleLoading(false);
    }
    return () => {
      if (loadingTimerRef.current !== null) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [status, toggleLoading]);

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

  // On each new response, only add tiles not yet rendered at this resolution.
  // On resolution change, wipe the rendered set and redraw everything fresh.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'success' || !res || !layerRef.current) return;

    if (res.mode === 'tiles') {
      // Resolution changed — clear map layer and rendered-tile registry.
      if (res.resolution !== currentResRef.current) {
        layerRef.current.clearLayers();
        renderedTilesRef.current = new Set();
        currentResRef.current = res.resolution;
      }

      const newTiles = res.data.filter((d) => !renderedTilesRef.current.has(d.tile));
      if (newTiles.length > 0) {
        addH3Grid(layerRef.current, newTiles, res.resolution);
        newTiles.forEach((d) => renderedTilesRef.current.add(d.tile));
      }
    } else {
      // places mode — always replace (individual pins change with every pan)
      layerRef.current.clearLayers();
      renderedTilesRef.current = new Set();
      currentResRef.current = null;
      addMarkers(layerRef.current, res.data);
    }
  }, [res, status]);

};

export default DataLayer;

// The flow is:
// 1. New res arrives → check layerRef.current
// 2. If there's an existing layer, remove it from the map
// 3. Build the new layer (heatmap or markers), add it to the map
// 4. Store it in layerRef.current so the next render knows what to remove