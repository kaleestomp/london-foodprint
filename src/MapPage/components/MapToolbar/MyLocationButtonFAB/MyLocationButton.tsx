import { useCallback, useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import useMyLocation from '../../../../request/useMyLocation/useMyLocation';
import { isWithinCityBounds } from '../../Map/MapTemplate';
import { useCityContext } from '../../../../context/CityContext';
import AnimatedLoadingDots from '../../../../components/LoadingDots/AnimatedLoadingDots';
import '../MapToolbar.css';


type Props = {
  mapRef: React.RefObject<L.Map | null>;
  onLiveLocationDrop: (lat: number, lng: number) => void;
};
const MyLocation: React.FC<Props> = ({ mapRef, onLiveLocationDrop }) => {
  const { cityParams } = useCityContext();
  const { state, locate } = useMyLocation();
  const [message, setMessage] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(false);

  const handleOutsideCity = useCallback(() => {
    const cityName = cityParams?.city ?? 'london';
    setMessage(`oops you are not in ${cityName}`);
  }, [cityParams?.city]);

  const handleLiveLocationDrop = useCallback((lat: number, lon: number) => {
    onLiveLocationDrop(lat, lon);
  }, [onLiveLocationDrop]);

  // Delay loading animation by 100ms to avoid flashing for fast requests
  useEffect(() => {
    if (state.status === 'loading') {
      const timer = setTimeout(() => setShowLoading(true), 100);
      return () => clearTimeout(timer);
    }
    setShowLoading(false);
  }, [state.status]);

  // Handle location state changes
  // Show error messages for errors, and handle success cases
  // If the location is outside London, show a message. 
  // Otherwise, call the onLiveLocationDrop callback.
  useEffect(() => {
    if (state.status === 'error') {
      setMessage(state.message);
      return;
    }

    if (state.status !== 'success' || !cityParams) {
      return;
    }

    if (!isWithinCityBounds(state.lat, state.lon, cityParams.maxBounds)) {
      handleOutsideCity();
      return;
    }

    handleLiveLocationDrop(state.lat, state.lon);
  }, [handleLiveLocationDrop, handleOutsideCity, state, cityParams]);

  return (
    <>
      <IconButton
        className="map-toolbar-fab"
        aria-label="My location"
        onClick={locate}
        disabled={state.status === 'loading' || !mapRef.current}
      >
        {showLoading ? (
          <AnimatedLoadingDots size="small" />
        ) : (
          <MyLocationOutlinedIcon fontSize="medium" />
        )}
      </IconButton>
      <Snackbar
        open={message !== null}
        autoHideDuration={2600}
        onClose={() => setMessage(null)}
        message={message ?? ''}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </>
  );
};

export default MyLocation;
