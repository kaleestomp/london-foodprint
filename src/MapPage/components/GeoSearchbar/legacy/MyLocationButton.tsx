import { useCallback, useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
// import NearMeIcon from '@mui/icons-material/NearMe';
import L from 'leaflet';
import useMyLocation from '../../../../request/useMyLocation/useMyLocation';
import { LONDON_BOUNDS } from '../../Map/MapTemplate';
import AnimatedLoadingDots from '../../../../components/LoadingDots/AnimatedLoadingDots';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import './GeoSearch.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
  onLiveLocationDrop: (lat: number, lng: number) => void | Promise<void>;
};

const MyLocationButton: React.FC<Props> = ({ mapRef, onLiveLocationDrop }) => {

  const { state, locate } = useMyLocation();
  const [message, setMessage] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(false);

  const handleOutsideLondon = useCallback(() => {
    setMessage('oops you are not in london');
  }, []);

  const handleLiveLocationDrop = useCallback((lat: number, lon: number) => {
    void onLiveLocationDrop(lat, lon);
  }, [onLiveLocationDrop]);

  // Delay loading animation by 100ms to avoid flashing for fast requests
  useEffect(() => {
    if (state.status === 'loading') {
      const timer = setTimeout(() => setShowLoading(true), 100);
      return () => clearTimeout(timer);
    }
    setShowLoading(false);
  }, [state.status]);

  useEffect(() => {
    if (state.status === 'error') {
      setMessage(state.message);
      return;
    }

    if (state.status !== 'success') { return; }

    if (!LONDON_BOUNDS.contains(L.latLng(state.lat, state.lon))) {
      handleOutsideLondon();
      return;
    }

    handleLiveLocationDrop(state.lat, state.lon);
  }, [handleLiveLocationDrop, handleOutsideLondon, state]);

  return (
    <>
      <IconButton
        className="geo-search-my-location-btn"
        aria-label="My location"
        onClick={locate}
        disabled={state.status === 'loading' || !mapRef.current}
        size="small"
      >
        {showLoading ? (
          <AnimatedLoadingDots size="medium" />
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

export default MyLocationButton;
