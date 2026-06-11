import { useEffect, useState } from 'react';
import L from 'leaflet';

import { type TilesParams } from '../../../../../request/useRequestTiles/useRequestTiles';
import zoomToResolution from './zoomToResolution';

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
      setViewportParams({
        sw_lat: b.getSouth(),
        sw_lng: b.getWest(),
        ne_lat: b.getNorth(),
        ne_lng: b.getEast(),
        res: zoomToResolution(zoom),
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