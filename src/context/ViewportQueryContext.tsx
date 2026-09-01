import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { ViewportBounds } from '../MapPage/components/Map/InputHooks/readViewportParams/getBucketedViewportBounds/snapViewportLatLng';

type ViewportQueryContextType = {
  viewportParams: ViewportBounds | null;
  setViewportParams: (params: ViewportBounds | null) => void;
};

const ViewportQueryContext = createContext<ViewportQueryContextType | null>(null);

export const ViewportQueryProvider = ({ children }: { children: ReactNode }) => {
  const [viewportParams, setViewportParams] = useState<ViewportBounds | null>(null);

  const value = useMemo<ViewportQueryContextType>(() => ({
    viewportParams,
    setViewportParams,
  }), [viewportParams]);

  return <ViewportQueryContext.Provider value={value}>{children}</ViewportQueryContext.Provider>;
};

export const useViewportQuery = (): ViewportQueryContextType => {
  const ctx = useContext(ViewportQueryContext);
  if (!ctx) {
    throw new Error('useViewportQuery must be used within ViewportQueryProvider');
  }
  return ctx;
};