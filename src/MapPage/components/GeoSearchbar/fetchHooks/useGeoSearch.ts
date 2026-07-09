import { useEffect, useState } from 'react';
import { LONDON_BOUNDS } from '../../Map/MapTemplate';

export type LocationResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

const API_BASE =
  (import.meta.env as Record<string, string | undefined>).VITE_RENDER_API_URL ??
  'http://localhost:3000';
const GEOCODE_URL = `${API_BASE}/api/geocode`;
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;

const isWithinLondonBounds = (result: LocationResult): boolean => {
  const lat = Number.parseFloat(result.lat);
  const lon = Number.parseFloat(result.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return false;
  }
  return LONDON_BOUNDS.contains([lat, lon]);
};

const useGeoSearch = (query: string) => {
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredOutAll, setFilteredOutAll] = useState(false);

  useEffect(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setFilteredOutAll(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        const res = await fetch(`${GEOCODE_URL}?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) { throw new Error(`Geocode error: ${res.status}`); }
        const data: LocationResult[] = await res.json();
        const londonOnly = data.filter(isWithinLondonBounds);
        setFilteredOutAll(data.length > 0 && londonOnly.length === 0);
        setSuggestions(londonOnly);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') { return; }
        setFilteredOutAll(false);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { suggestions, isLoading, filteredOutAll };
};

export default useGeoSearch;
