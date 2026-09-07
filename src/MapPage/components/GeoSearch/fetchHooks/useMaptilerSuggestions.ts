import { useEffect, useState } from 'react';

import { useCityContext } from '../../../../context/CityContext';
import { fetchGeocodeSuggestions, toSuggestion } from './maptilerGeocode';
import type { GeoSuggestion } from '../types';

// Brief: suggested search fires once more than 4 characters are entered.
export const MIN_QUERY_LENGTH = 4;
const DEBOUNCE_MS = 400;

const useMaptilerSuggestions = (query: string) => {
  const { cityParams } = useCityContext();
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      return; // short queries expose no suggestions — gated below
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const features = await fetchGeocodeSuggestions(query, cityParams, controller.signal);
        const items = features
          .map(toSuggestion)
          .filter((item) => item.center !== null || item.expectsBoundary);
        setSuggestions(items);
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
  }, [query, cityParams]);

  // Stale results from a previous query are never exposed for short queries.
  const exposed = query.trim().length >= MIN_QUERY_LENGTH ? suggestions : [];
  return { suggestions: exposed, isLoading };
};

export default useMaptilerSuggestions;
