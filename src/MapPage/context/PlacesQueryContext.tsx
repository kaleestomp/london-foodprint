import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { TilesParams } from '../request/useRequestTiles/useRequestTiles';

type PlacesQueryContextType = {
  lastTilesParams: TilesParams | null;
  setLastTilesParams: (params: TilesParams | null) => void;
  selectedPlaceId: string | null;
  setSelectedPlaceId: (placeId: string | null) => void;
};

const PlacesQueryContext = createContext<PlacesQueryContextType | null>(null);

export const PlacesQueryProvider = ({ children }: { children: ReactNode }) => {
  const [lastTilesParams, setLastTilesParams] = useState<TilesParams | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const value = useMemo<PlacesQueryContextType>(() => ({
    lastTilesParams,
    setLastTilesParams,
    selectedPlaceId,
    setSelectedPlaceId,
  }), [lastTilesParams, selectedPlaceId]);

  return <PlacesQueryContext.Provider value={value}>{children}</PlacesQueryContext.Provider>;
};

export const usePlacesQuery = (): PlacesQueryContextType => {
  const ctx = useContext(PlacesQueryContext);
  if (!ctx) {
    throw new Error('usePlacesQuery must be used within PlacesQueryProvider');
  }
  return ctx;
};
