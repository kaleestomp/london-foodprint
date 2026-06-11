import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';

import { useAppUI } from '../../../../../context/AppUIContext';
import useRequestTiles from '../../../../request/useRequestTiles/useRequestTiles';
import addHeatmap from './addHeatmap';
// import addMarkers from './addMarkers';
import onUserRoam from './updateOnMove';

const DataLayer = (mapRef: React.RefObject<L.Map | null>): void => {

  const layerRef = useRef<L.LayerGroup | null>(null);
  const { toggleLoading } = useAppUI();

  const viewportParams = onUserRoam(mapRef);
  const { status, res } = useRequestTiles(viewportParams);
  console.log(viewportParams);
  console.log(res);

  useEffect(() => {
    toggleLoading(status === 'loading');
  }, [status, toggleLoading]);

  // Render / replace data layer when response changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'success' || !res) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const layer = L.layerGroup();
    if (res.mode === 'tiles') {
      addHeatmap(layer, res.data, res.resolution, viewportParams.zoom);
    } else {
      // addMarkers(layer, res.data);
    }
    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [res, status]);

};

export default DataLayer;

// The flow is:
// 1. New res arrives → check layerRef.current
// 2. If there's an existing layer, remove it from the map
// 3. Build the new layer (heatmap or markers), add it to the map
// 4. Store it in layerRef.current so the next render knows what to remove