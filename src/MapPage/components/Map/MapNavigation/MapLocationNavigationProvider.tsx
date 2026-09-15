import { useCallback, useMemo, useState, type ReactNode } from 'react';

import type { LocationTarget } from '../../BubbleAvatar/config';
import { MapLocationNavigationContext } from './MapLocationNavigationContext';

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
