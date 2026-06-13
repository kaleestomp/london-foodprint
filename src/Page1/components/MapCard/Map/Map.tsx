import L from 'leaflet';
import BaseLayer from './BaseLayer/BaseLayer';
import DataLayer from './DataLayer/DataLayer'; 
import 'leaflet/dist/leaflet.css';

type SearchMask = {
  center: { lat: number; lng: number };
  radiusM: number;
};

type Props = {
  mapRef?: React.RefObject<L.Map | null>;
  searchMask?: SearchMask | null;
};
const Map: React.FC<Props> = ({ mapRef: externalMapRef, searchMask = null }) => { 
  
  const { mapContainerRef, mapRef } = BaseLayer(externalMapRef);
  DataLayer(mapRef, searchMask);

  return <div className="leaflet-map-canvas" ref={mapContainerRef} />;
};

export default Map;