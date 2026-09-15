import { createContext } from 'react';

import type { LocationTarget } from '../../BubbleAvatar/config';

export type MapLocationNavigationContextValue = {
  settledTarget: LocationTarget | null;
  settledToken: number | null;
  reportSettled: (target: LocationTarget, token: number) => void;
};

export const MapLocationNavigationContext = createContext<MapLocationNavigationContextValue | null>(null);
