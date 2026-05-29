import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet.heat';

import { useAppUI } from '../../../../../context/AppUIContext';
import useRequestEPDMap from '../../../../request/useRequestEPDMap/useRequestEPDMap';
import { adjustBounds } from '../MapTemplate'; 
import useSelectDataOnZoom from './useSelectDataOnZoom'; 

const DataLayer = (mapRef: React.RefObject<L.Map | null>): void => {

  const { status, res } = useRequestEPDMap(); 
  // console.log('DataLayer - API Response Sample:', res);
  const { toggleLoading } = useAppUI()!;
  useEffect(() => {
    toggleLoading(status === 'loading');
  }, [status, toggleLoading]);
  
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'success') { return; }

    const bounds = L.latLngBounds([]);
    const { heatLayer, scatterLayer, dataZoomHandler } = useSelectDataOnZoom(map, res);

    map.on('zoomend', dataZoomHandler);
    dataZoomHandler();
    adjustBounds(map, res, bounds);

    return () => {
      map.off('zoomend', dataZoomHandler);
      map.removeLayer(heatLayer);
      map.removeLayer(scatterLayer);
    };
  }, [status, res]);

};

export default DataLayer;