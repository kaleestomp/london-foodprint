import { useEffect, useState } from 'react';
import L from 'leaflet';

import { type TilesParams } from '../../../../request/useRequestTiles/useRequestTiles';

const onUserRoam = (mapRef: React.RefObject<L.Map | null>): TilesParams | null => {

  const [viewportParams, setViewportParams] = useState<TilesParams | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update = () => {
      const b = map.getBounds();
      setViewportParams({
        sw_lat: b.getSouth(),
        sw_lng: b.getWest(),
        ne_lat: b.getNorth(),
        ne_lng: b.getEast(),
        zoom: map.getZoom(),
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