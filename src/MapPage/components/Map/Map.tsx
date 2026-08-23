import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

import BaseLayer from './BaseLayer/BaseLayer';
import DataLayer from './DataLayer/DataLayer';
import onUserRoam from './InputHooks/onUserRoam';
import { useTileQuery } from '../../../context/TileQueryContext';

type Props = {
  mapRef?: React.RefObject<maplibregl.Map | null>;
};
const Map: React.FC<Props> = ({ mapRef: externalMapRef }) => {
  const { mapContainerRef, mapRef } = BaseLayer(externalMapRef);
  const viewportParams = onUserRoam(mapRef);
  const { setViewportParams } = useTileQuery();

  useEffect(() => {
    setViewportParams(viewportParams);
  }, [viewportParams, setViewportParams]);

  DataLayer(mapRef, true);

  return <div className="leaflet-map-canvas" ref={mapContainerRef} />;
};

export default Map;