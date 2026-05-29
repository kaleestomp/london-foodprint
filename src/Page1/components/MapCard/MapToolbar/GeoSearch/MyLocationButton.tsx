import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import { type LocationResult } from './useGeoSearch';
import useGeoSearchHandler from '../../Map/GeoSearchHandler/GeoSearchHandler';
import useMyLocation from '../../../../../utils/useMyLocation/useMyLocation';
import './GeoSearch.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};

const MyLocationButton: React.FC<Props> = ({ mapRef }) => {

  const myLocation = useMyLocation(); 
  const [location, setLocation] = useState<LocationResult | null>(null); 
  useGeoSearchHandler(mapRef, location); 
  
  const handleMyLocation = () => {
    if (!myLocation) { return; }
    const label = [myLocation.district, myLocation.city, myLocation.region, myLocation.country]
      .filter(Boolean).join(', ') || 'My Location';
    const location: LocationResult = {
      place_id: 0, 
      display_name: label, 
      lat: String(myLocation.lat), 
      lon: String(myLocation.lon)
    };
    setLocation(location);
  };
  return (
    <div className="geo-search-actions">
      <IconButton
          className="geo-search-action-btn"
          aria-label="My location"
          onClick={handleMyLocation}
          disabled={!myLocation}
          size="small"
      >
        <MyLocationOutlinedIcon sx={{ fontSize: 24 }} />
      </IconButton>
      {/* Add More Buttons Here */}
    </div>
  );
};

export default MyLocationButton;
