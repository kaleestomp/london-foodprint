import IconButton from '@mui/material/IconButton';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import L from 'leaflet';
import DropPinButton from './DropPinButton/DropPinButton';
import GeoSearch from './GeoSearch/GeoSearch';
import './MapToolbar.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
  onProgrammaticDrop: (lat: number, lng: number) => void;
};

const MapToolbar: React.FC<Props> = ({ mapRef, onProgrammaticDrop }) => {

  return (
    <div className="map-toolbar">
      <IconButton className="map-toolbar-fab" aria-label="Layers">
        <LayersOutlinedIcon fontSize="medium" />
      </IconButton>
      <DropPinButton mapRef={mapRef} />
      <GeoSearch mapRef={mapRef} onProgrammaticDrop={onProgrammaticDrop} />
    </div>
  );
};

export default MapToolbar;
