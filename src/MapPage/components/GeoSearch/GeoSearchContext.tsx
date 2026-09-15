import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useAppUI } from '../../../context/AppUIContext';
import useMaptilerFeatureRequestCall from './request/useMaptilerFeatureRequestCall/useMaptilerFeatureRequestCall';
import type { MaptilerFeature, BoundarySelection, GeoSuggestion, StreetSelection } from './types';
import updateFeatureState from './request/useMaptilerFeatureRequestCall/updateFeatureState';

interface GeoSearchContextType {
  query: string;
  selectedBoundary: BoundarySelection | null;
  selectedStreet: StreetSelection | null;
  setQuery: (query: string) => void;
  clearSearch: () => void;
  selectSuggestion: (suggestion: GeoSuggestion) => void;
}

const GeoSearchContext = createContext<GeoSearchContextType | null>(null);

export const GeoSearchProvider = ({ children }: { children: ReactNode }) => {

  const { queueLiveLocationDrop } = useAppUI();
  const requestMaptilerFeature = useMaptilerFeatureRequestCall();

  const [query, setQueryState] = useState('');
  const [selectedBoundary, setSelectedBoundary] = useState<BoundarySelection | null>(null);
  const [selectedStreet, setSelectedStreet] = useState<StreetSelection | null>(null);

  const setQuery = useCallback((next: string) => {
    setQueryState(next);
    setSelectedBoundary(null);
    setSelectedStreet(null);
  }, []);

  const clearSearch = useCallback(() => {
    setQueryState('');
    setSelectedBoundary(null);
    setSelectedStreet(null);
  }, []);

  const dropAtCenter = useCallback((center: [number, number] | null) => {
    if (center) {
      queueLiveLocationDrop(center[1], center[0]);
    }
  }, [queueLiveLocationDrop]);

  const onBoundaryType = useCallback((feature: MaptilerFeature, label: string) => {
    setSelectedStreet(null);
    setSelectedBoundary({ feature, label });
  }, []);
  const onStreetType = useCallback((feature: MaptilerFeature, label: string) => {
    setSelectedBoundary(null);
    setSelectedStreet({ feature, label });
  }, []);
  const onPlaceType = useCallback((center: [number, number] | null | undefined) => {
    setSelectedBoundary(null);
    setSelectedStreet(null);
    dropAtCenter(center ?? null);
  }, [dropAtCenter]);

  const selectSuggestion = useCallback((suggestion: GeoSuggestion) => {

    setQueryState(suggestion.secondary ? `${suggestion.primary}, ${suggestion.secondary}` : suggestion.primary);
    const isPlaceType = suggestion.expectsPlace || (!suggestion.expectsBoundary && !suggestion.expectsStreet);
    if (isPlaceType) {
      onPlaceType(suggestion.center ?? null);
      
    } else {
      void requestMaptilerFeature(suggestion.id)
        .then((feature) => updateFeatureState(
          feature,
          suggestion.primary,
          suggestion.center,
          { onBoundaryType, onStreetType, onOtherType: onPlaceType },

        )).catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) {
            onPlaceType(suggestion.center);
          }
        });
    }

  }, [onBoundaryType, onPlaceType, onStreetType, requestMaptilerFeature]);

  const exposed = useMemo<GeoSearchContextType>(() => ({
    query,
    selectedBoundary,
    selectedStreet,
    setQuery,
    clearSearch,
    selectSuggestion,
  }), [
    query,
    selectedBoundary,
    selectedStreet,
    setQuery,
    clearSearch,
    selectSuggestion,
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
