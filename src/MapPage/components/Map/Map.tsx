import L from 'leaflet';
import BaseLayer from './BaseLayer/BaseLayer';
import DataLayer from './DataLayer/DataLayer'; 
import { useSearchFilters } from '../../../context/SearchFiltersContext';
import 'leaflet/dist/leaflet.css';

const DISABLE_DATA_LAYER = (import.meta.env as Record<string, string | undefined>).VITE_DEBUG_DISABLE_DATA_LAYER === 'true';

type Props = {
  mapRef?: React.RefObject<L.Map | null>;
};
const Map: React.FC<Props> = ({ mapRef: externalMapRef }) => { 
  
  const { mapContainerRef, mapRef } = BaseLayer(externalMapRef);

  const { searchMask } = useSearchFilters();
  DataLayer(mapRef, searchMask, !DISABLE_DATA_LAYER);

  return <div className="leaflet-map-canvas" ref={mapContainerRef} />;
};

export default Map;