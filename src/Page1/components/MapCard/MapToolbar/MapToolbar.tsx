import IconButton from '@mui/material/IconButton';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import L from 'leaflet';
import { useAppUI } from '../../../../context/AppUIContext';
import GeoSearch from './GeoSearch/GeoSearch';
import './MapToolbar.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
  onProgrammaticDrop: (lat: number, lng: number) => void;
};

const MapToolbar: React.FC<Props> = ({ mapRef, onProgrammaticDrop }) => {
  const { openRestaurantFiltersPanel } = useAppUI();

  return (
    <div className="map-toolbar">
      <IconButton
        className="map-toolbar-fab"
        aria-label="Layers"
        onClick={openRestaurantFiltersPanel}
      >
        <LayersOutlinedIcon fontSize="medium" />
      </IconButton>
      <GeoSearch mapRef={mapRef} onProgrammaticDrop={onProgrammaticDrop} />
    </div>
  );
};

export default MapToolbar;
