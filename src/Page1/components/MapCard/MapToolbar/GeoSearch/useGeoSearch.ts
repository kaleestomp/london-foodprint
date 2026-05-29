import { useEffect, useState } from 'react';

export type LocationResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

const GEOCODE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/geocode`;
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;

const useGeoSearch = (query: string) => {
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
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
        if (!res.ok) { throw new Error(`Nominatim error: ${res.status}`); }
        const data: LocationResult[] = await res.json();
        setSuggestions(data);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') { return; }
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

  return { suggestions, isLoading };
};

export default useGeoSearch;
