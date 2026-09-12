import { useEffect } from 'react';
import type * as maplibregl from 'maplibre-gl';

import BaseLayer from './BaseLayer/BaseLayer';
import DataLayer from './DataLayer/DataLayer';
import onUserRoam from './InputHooks/onUserRoam';
import { useViewportQuery } from '../../../context/ViewportQueryContext';

import './Map.css';

type Props = {
  mapRef?: React.RefObject<maplibregl.Map | null>;
};
const Map: React.FC<Props> = ({ mapRef: externalMapRef }) => {
  const { mapContainerRef, mapRef } = BaseLayer(externalMapRef);
  const viewportParams = onUserRoam(mapRef);
  const { setViewportParams } = useViewportQuery();

  useEffect(() => {
    setViewportParams(viewportParams);
  }, [viewportParams, setViewportParams]);

  DataLayer(mapRef, true);

  return <div className="map-canvas" ref={mapContainerRef} />;
};

export default Map;