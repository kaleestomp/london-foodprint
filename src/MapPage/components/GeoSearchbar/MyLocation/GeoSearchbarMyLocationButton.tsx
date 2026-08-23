import { useCallback, useEffect, useState } from 'react';
import type maplibregl from 'maplibre-gl';

import Snackbar from '@mui/material/Snackbar';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import useMyLocation from '../../../../request/useMyLocation/useMyLocation';
import { isWithinLondonBounds } from '../../Map/MapTemplate';
import AnimatedLoadingDots from '../../../../components/LoadingDots/AnimatedLoadingDots';

import './GeoSearchbarMyLocationButton.css';

type Props = {
  mapRef: React.RefObject<maplibregl.Map | null>;
  onLiveLocationDrop: (lat: number, lng: number) => void | Promise<void>;
};

const GeoSearchbarMyLocationButton: React.FC<Props> = ({ mapRef, onLiveLocationDrop }) => {
  const { state, locate } = useMyLocation();
  const [message, setMessage] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(false);

  const handleOutsideLondon = useCallback(() => {
    setMessage('oops you are not in london');
  }, []);

  const handleLiveLocationDrop = useCallback((lat: number, lon: number) => {
    void onLiveLocationDrop(lat, lon);
  }, [onLiveLocationDrop]);

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

    if (state.status !== 'success') {
      return;
    }

    if (!isWithinLondonBounds(state.lat, state.lon)) {
      handleOutsideLondon();
      return;
    }

    handleLiveLocationDrop(state.lat, state.lon);
  }, [handleLiveLocationDrop, handleOutsideLondon, state]);

  return (
    <>
      <button
        type="button"
        className="geo-searchbar-my-location-btn"
        aria-label="My location"
        onClick={locate}
        disabled={state.status === 'loading' || !mapRef.current}
      >
        {showLoading ? (
          <AnimatedLoadingDots size="small" />
        ) : (
          <MyLocationOutlinedIcon fontSize="small" />
        )}
      </button>
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

export default GeoSearchbarMyLocationButton;
