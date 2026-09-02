import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type TopPlacesContextType = {
  topPlaceIdSet: Set<string>;
  reportTopPlaceIdSet: (idSet: Set<string>) => void;
};

const TopPlacesContext = createContext<TopPlacesContextType | null>(null);

export const TopPlacesProvider = ({ children }: { children: ReactNode }) => {
  const [topPlacesId, setTopPlacesId] = useState<Set<string>>(new Set());
  const reportTopPlaceIdSet = (idSet: Set<string>) => setTopPlacesId(idSet);

  const value = useMemo<TopPlacesContextType>(() => ({
    topPlaceIdSet: topPlacesId, reportTopPlaceIdSet
  }), [topPlacesId, reportTopPlaceIdSet]);

  return <TopPlacesContext.Provider value={value}>{children}</TopPlacesContext.Provider>;
};

export const useTopPlaces = (): TopPlacesContextType => {
  const ctx = useContext(TopPlacesContext);
  if (!ctx) {
    throw new Error('useTopPlaces must be used within TopPlacesProvider');
  }
  return ctx;
};