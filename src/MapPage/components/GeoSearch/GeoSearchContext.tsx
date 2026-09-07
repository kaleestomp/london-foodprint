import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useAppUI } from '../../../context/AppUIContext';
import useMaptilerSuggestions, { MIN_QUERY_LENGTH } from './fetchHooks/useMaptilerSuggestions';
import { fetchFeatureGeometry, isBoundaryGeometry, isStreetGeometry } from './fetchHooks/maptilerGeocode';
import type { BoundarySelection, GeoSuggestion, StreetSelection } from './types';

interface GeoSearchContextType {
  query: string;
  suggestions: GeoSuggestion[];
  isLoading: boolean;
  isExpanded: boolean;
  isListDismissed: boolean;
  suggestionsVisible: boolean;
  selectedBoundary: BoundarySelection | null;
  selectedStreet: StreetSelection | null;
  setQuery: (query: string) => void;
  expandSearch: () => void;
  collapseSearch: () => void;
  clearSearch: () => void;
  selectSuggestion: (suggestion: GeoSuggestion) => void;
  clearBoundary: () => void;
}

const GeoSearchContext = createContext<GeoSearchContextType | null>(null);

export const GeoSearchProvider = ({ children }: { children: ReactNode }) => {
  const { queueLiveLocationDrop } = useAppUI();

  const [query, setQueryState] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListDismissed, setIsListDismissed] = useState(false);
  const [selectedBoundary, setSelectedBoundary] = useState<BoundarySelection | null>(null);
  const [selectedStreet, setSelectedStreet] = useState<StreetSelection | null>(null);

  const { suggestions, isLoading } = useMaptilerSuggestions(query);

  const suggestionsVisible =
    !isListDismissed &&
    query.trim().length >= MIN_QUERY_LENGTH &&
    (isLoading || suggestions.length > 0);

  const setQuery = useCallback((next: string) => {
    setQueryState(next);
    setIsListDismissed(false);
    setSelectedBoundary(null);
    setSelectedStreet(null);
  }, []);

  const expandSearch = useCallback(() => setIsExpanded(true), []);

  const collapseSearch = useCallback(() => {
    setIsExpanded(false);
    setIsListDismissed(true);
  }, []);

  const clearSearch = useCallback(() => {
    setQueryState('');
    setIsListDismissed(true);
    setSelectedBoundary(null);
    setSelectedStreet(null);
  }, []);

  const clearBoundary = useCallback(() => setSelectedBoundary(null), []);

  const selectSuggestion = useCallback((suggestion: GeoSuggestion) => {
    setQueryState(suggestion.secondary ? `${suggestion.primary}, ${suggestion.secondary}` : suggestion.primary);
    setIsListDismissed(true); // unmounts the suggestion list, revealing the restaurant list

    const dropAtCenter = () => {
      if (suggestion.center) {
        queueLiveLocationDrop(suggestion.center[1], suggestion.center[0]);
      }
    };

    if (!suggestion.expectsBoundary && !suggestion.expectsStreet) {
      setSelectedBoundary(null);
      setSelectedStreet(null);
      dropAtCenter();
      return;
    }

    // Resolve administrative and street candidates by feature id. This is
    // necessary because autocomplete returns a point centroid while the
    // feature endpoint returns the full Polygon or MultiLineString geometry.
    fetchFeatureGeometry(suggestion.id)
      .then((feature) => {
        if (feature && isBoundaryGeometry(feature)) {
          setSelectedStreet(null);
          setSelectedBoundary({ feature, label: suggestion.primary });
          return;
        }
        if (feature && isStreetGeometry(feature)) {
          setSelectedBoundary(null);
          setSelectedStreet({ feature, label: suggestion.primary });
          return;
        }
        setSelectedBoundary(null);
        setSelectedStreet(null);
        dropAtCenter();
      })
      .catch(() => {
        setSelectedBoundary(null);
        setSelectedStreet(null);
        dropAtCenter();
      });
  }, [queueLiveLocationDrop]);

  const exposed = useMemo<GeoSearchContextType>(() => ({
    query,
    suggestions,
    isLoading,
    isExpanded,
    isListDismissed,
    suggestionsVisible,
    selectedBoundary,
    selectedStreet,
    setQuery,
    expandSearch,
    collapseSearch,
    clearSearch,
    selectSuggestion,
    clearBoundary,
  }), [
    query,
    suggestions,
    isLoading,
    isExpanded,
    isListDismissed,
    suggestionsVisible,
    selectedBoundary,
    selectedStreet,
    setQuery,
    expandSearch,
    collapseSearch,
    clearSearch,
    selectSuggestion,
    clearBoundary,
  ]);

  return (
    <GeoSearchContext.Provider value={exposed}>
      {children}
    </GeoSearchContext.Provider>
  );
};

export const useGeoSearch = (): GeoSearchContextType => {
  const context = useContext(GeoSearchContext);
  if (!context) {
    throw new Error('useGeoSearch must be used within GeoSearchProvider');
  }
  return context;
};
