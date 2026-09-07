import { useEffect, useState } from 'react';
import { isWithinCityBounds } from '../../Map/MapTemplate';
import { useCityContext } from '../../../../context/CityContext';

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

const isResultWithinCityBounds = (result: LocationResult, bounds: [[number, number], [number, number]]): boolean => {
  const lat = Number.parseFloat(result.lat);
  const lon = Number.parseFloat(result.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return false;
  }
  return isWithinCityBounds(lat, lon, bounds);
};

const useGeoSearch = (query: string) => {
  const { cityParams } = useCityContext();
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
        const cityOnly = cityParams
          ? data.filter((item) => isResultWithinCityBounds(item, cityParams.maxBounds))
          : data;
        setFilteredOutAll(data.length > 0 && cityOnly.length === 0);
        setSuggestions(cityOnly);
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
  }, [query, cityParams]);

  return { suggestions, isLoading, filteredOutAll };
};

export default useGeoSearch;
