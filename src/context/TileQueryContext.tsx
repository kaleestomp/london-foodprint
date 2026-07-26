import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { TilesParams } from '../MapPage/request/useRequestTiles/useRequestTiles';

type TileQueryContextType = {
  lastTilesParams: TilesParams | null;
  setLastTilesParams: (params: TilesParams | null) => void;
  viewportParams: TilesParams | null;
  setViewportParams: (params: TilesParams | null) => void;
};

const TileQueryContext = createContext<TileQueryContextType | null>(null);

export const TileQueryProvider = ({ children }: { children: ReactNode }) => {
  const [lastTilesParams, setLastTilesParams] = useState<TilesParams | null>(null);
  const [viewportParams, setViewportParams] = useState<TilesParams | null>(null);

  const value = useMemo<TileQueryContextType>(() => ({
    lastTilesParams,
    setLastTilesParams,
    viewportParams,
    setViewportParams,
  }), [lastTilesParams, viewportParams]);

  return <TileQueryContext.Provider value={value}>{children}</TileQueryContext.Provider>;
};

export const useTileQuery = (): TileQueryContextType => {
  const ctx = useContext(TileQueryContext);
  if (!ctx) {
    throw new Error('useTileQuery must be used within TileQueryProvider');
  }
  return ctx;
};