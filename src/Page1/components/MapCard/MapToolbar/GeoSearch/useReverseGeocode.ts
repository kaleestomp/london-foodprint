import { useCallback, useState } from 'react';
import { type LocationResult } from './useGeoSearch';

const REVERSE_GEOCODE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/reverse-geocode`;

const useReverseGeocode = () => {
  const [isLoading, setIsLoading] = useState(false);

  const lookup = useCallback(async (lat: number, lon: number): Promise<LocationResult> => {
    const coordLabel = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
      const res = await fetch(`${REVERSE_GEOCODE_URL}?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.display_name) {
          return {
            place_id: data.place_id ?? 0,
            display_name: data.display_name,
            lat: data.lat ?? String(lat),
            lon: data.lon ?? String(lon),
          };
        }
      }
    } catch {
      // fall through to coordinate fallback
    } finally {
      setIsLoading(false);
    }
    // No address found — return coordinates only
    return { place_id: 0, display_name: coordLabel, lat: String(lat), lon: String(lon) };
  }, []);

  return { lookup, isLoading };
};

export default useReverseGeocode;
