import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { TilesParams, TilesResponse } from '../MapPage/request/useRequestTiles/useRequestTiles';
import type { NearbyResponse } from '../MapPage/request/useRequestNearby/request';

type TileQueryContextType = {
  lastTilesParams: TilesParams | null;
  setLastTilesParams: (params: TilesParams | null) => void;
  lastTilesResponse: TilesResponse | null;
  setLastTilesResponse: (response: TilesResponse | null) => void;
  lastNearbyResponse: NearbyResponse | null;
  setLastNearbyResponse: (response: NearbyResponse | null) => void;
};

const TileQueryContext = createContext<TileQueryContextType | null>(null);

export const TileQueryProvider = ({ children }: { children: ReactNode }) => {
  const [lastTilesParams, setLastTilesParams] = useState<TilesParams | null>(null);
  const [lastTilesResponse, setLastTilesResponse] = useState<TilesResponse | null>(null);
  const [lastNearbyResponse, setLastNearbyResponse] = useState<NearbyResponse | null>(null);

  const value = useMemo<TileQueryContextType>(() => ({
    lastTilesParams,
    setLastTilesParams,
    lastTilesResponse,
    setLastTilesResponse,
    lastNearbyResponse,
    setLastNearbyResponse,
  }), [lastTilesParams, lastTilesResponse, lastNearbyResponse]);

  return <TileQueryContext.Provider value={value}>{children}</TileQueryContext.Provider>;
};

export const useTileQuery = (): TileQueryContextType => {
  const ctx = useContext(TileQueryContext);
  if (!ctx) {
    throw new Error('useTileQuery must be used within TileQueryProvider');
  }
  return ctx;
};