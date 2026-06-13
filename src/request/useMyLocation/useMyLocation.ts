import { useCallback, useState } from 'react';

export type LocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; lat: number; lon: number; accuracy: number }
  | { status: 'error'; message: string };

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 0,
};

const useMyLocation = () => {
  const [state, setState] = useState<LocationState>({ status: 'idle' });

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'error', message: 'Geolocation is not supported by this browser.' });
      return;
    }

    setState({ status: 'loading' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: 'success',
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied.'
            : err.code === err.POSITION_UNAVAILABLE
            ? 'Location information is unavailable.'
            : 'Location request timed out.';
        setState({ status: 'error', message });
      },
      GEO_OPTIONS,
    );
  }, []);

  return { state, locate };
};

export default useMyLocation;
