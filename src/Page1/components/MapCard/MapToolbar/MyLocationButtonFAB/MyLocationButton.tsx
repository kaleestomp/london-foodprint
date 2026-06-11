import IconButton from '@mui/material/IconButton';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import { type LocationResult } from '../GeoSearch/useGeoSearch';
// import useMyLocation from '../../../../../utils/useMyLocation/useMyLocation';
import '../MapToolbar.css';


type Props = {
  setLocation: React.Dispatch<React.SetStateAction<LocationResult | null>>;
};
const MyLocation: React.FC<Props> = ({ setLocation }) => {
  
  const myLocation = undefined; // useMyLocation();
  const handleMyLocation = () => {
    if (!myLocation) { return; }
    const label = [myLocation.district, myLocation.city, myLocation.region, myLocation.country]
      .filter(Boolean)
      .join(', ') || 'My Location';
    setLocation({
      place_id: 0,
      display_name: label,
      lat: String(myLocation.lat),
      lon: String(myLocation.lon),
    });
  };

  return (
      <IconButton
        className="map-toolbar-fab"
        aria-label="My location"
        onClick={handleMyLocation}
        disabled={!myLocation}
      >
        <MyLocationOutlinedIcon fontSize="medium" />
      </IconButton>
  );
};

export default MyLocation;
