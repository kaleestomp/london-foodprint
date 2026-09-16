/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { LocationTarget } from '../../BubbleAvatar/config';

export type MapLocationNavigationContextValue = {
  settledTarget: LocationTarget | null;
  settledToken: number | null;
  reportSettled: (target: LocationTarget, token: number) => void;
};

export const MapLocationNavigationContext = createContext<MapLocationNavigationContextValue | null>(null);

export const MapLocationNavigationProvider = ({ children }: { children: ReactNode }) => {
  const [settledTarget, setSettledTarget] = useState<LocationTarget | null>(null);
  const [settledToken, setSettledToken] = useState<number | null>(null);

  const reportSettled = useCallback((target: LocationTarget, token: number) => {
    setSettledTarget(target);
    setSettledToken(token);
  }, []);

  const value = useMemo(() => ({ settledTarget, settledToken, reportSettled }), [reportSettled, settledTarget, settledToken]);

  return (
    <MapLocationNavigationContext.Provider value={value}>
      {children}
    </MapLocationNavigationContext.Provider>
  );
};

export const useMapLocationNavigationState = () => {
  const context = useContext(MapLocationNavigationContext);
  if (!context) {
    throw new Error('useMapLocationNavigationState must be used within MapLocationNavigationProvider');
  }
  return context;
};
