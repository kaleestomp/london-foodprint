import { useEffect, useState } from 'react';
import L from 'leaflet';

import { type TilesParams } from '../../../../request/useRequestTiles/useRequestTiles';
import zoomToResolution from '../utils/zoomToResolution';

const ZOOM_THRESHOLD_FOR_PLACES_ONLY = 16;
/**
 * Tracks map viewport and emits TilesParams whenever the user pans or zooms.
 * `resolveRes` converts the current Leaflet zoom level to the H3 resolution
 * that should be requested — callers pass different tables per viz mode.
 */
const onUserRoam = (
  mapRef: React.RefObject<L.Map | null>,
): TilesParams | null => {

  const [viewportParams, setViewportParams] = useState<TilesParams | null>(null);
  
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update = () => {
      const b = map.getBounds();
      const zoom = map.getZoom();

      // Below zoom 11 there's too little context to render density/place markers.
      if (zoom <= 10) {
        setViewportParams(null);
        return;
      }

      const res = zoomToResolution(zoom);
      // console.log('res', res, 'zoom', zoom);
      
      setViewportParams({
        sw_lat: b.getSouth(),
        sw_lng: b.getWest(),
        ne_lat: b.getNorth(),
        ne_lng: b.getEast(),
        res: res,
        // At past 16 Zoom, always request individual places directly,
        // bypassing the density table regardless of place count.
        ...(zoom >= ZOOM_THRESHOLD_FOR_PLACES_ONLY ? { places_only: true } : {}),
      });
    };

    update();
    map.on('moveend', update);
    map.on('zoomend', update);
    return () => {
      map.off('moveend', update);
      map.off('zoomend', update);
    };
  }, []);

  return viewportParams;
};

export default onUserRoam;