import { useContext } from 'react';

import { MapLocationNavigationContext } from './MapLocationNavigationContext';

export const useMapLocationNavigationState = () => {
  const context = useContext(MapLocationNavigationContext);
  if (!context) {
    throw new Error('useMapLocationNavigationState must be used within MapLocationNavigationProvider');
  }
  return context;
};
