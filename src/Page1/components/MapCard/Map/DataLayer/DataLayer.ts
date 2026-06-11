import { useEffect, useRef } from 'react';
import L from 'leaflet';

import useRequestTiles from '../../../../request/useRequestTiles/useRequestTiles';
import addDensityPins from './addDensityPins';
import addMarkers from './addMarkers';
import onUserRoam from './onUserRoam';
import DelayLoadingScreen from './delayLoadingScreen';
import createPersistentLayer from './createPersistentLayer';
import { zoomToResolution, PINS_ZOOM_TO_RES } from './zoomToResolution';

const DataLayer = (mapRef: React.RefObject<L.Map | null>): void => {

  // Tracks which H3 tiles already have a pin rendered — used for incremental
  // adds (no need to rebuild the whole layer when the user pans).
  const renderedTilesRef = useRef<Set<string>>(new Set());
  const currentResRef = useRef<number | null>(null);
  const viewportParams = onUserRoam(mapRef, (z) => zoomToResolution(z, PINS_ZOOM_TO_RES));
  const { status, res } = useRequestTiles(viewportParams);

  // Only show loading spinner if request takes longer than LOADING_DELAY_MS.
  DelayLoadingScreen(status);
  // Create the persistent layer group once on mount, add to map, never remove it.
  const layerRef = createPersistentLayer(mapRef);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'success' || !res || !layerRef.current) return;

    if (res.mode === 'tiles') {
      // Resolution changed — wipe all rendered pins and clear the layer.
      if (res.resolution !== currentResRef.current) {
        layerRef.current.clearLayers();
        renderedTilesRef.current = new Set();
        currentResRef.current = res.resolution;
      }

      // Add only pins for tiles not yet rendered (incremental, no full rebuild).
      addDensityPins(layerRef.current, res.data, res.resolution, renderedTilesRef.current);
    } else {
      // places mode — always replace
      layerRef.current.clearLayers();
      renderedTilesRef.current = new Set();
      currentResRef.current = null;
      addMarkers(layerRef.current, res.data);
    }
  }, [res, status]);

};

export default DataLayer;
