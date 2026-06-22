import React, { createContext, useContext } from 'react';

import useRestaurantPanelSnap from './useRestaurantPanelSnap';

const RestaurantPanelSnapContext = createContext<ReturnType<typeof useRestaurantPanelSnap> | null>(null);

export const RestaurantPanelSnapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const snap = useRestaurantPanelSnap();

  return (
    <RestaurantPanelSnapContext.Provider value={snap}>
      {children}
    </RestaurantPanelSnapContext.Provider>
  );
};

export const useRestaurantPanelSnapState = () => {
  const context = useContext(RestaurantPanelSnapContext);
  if (!context) {
    throw new Error('useRestaurantPanelSnapState must be used within RestaurantPanelSnapProvider');
  }

  return context;
};
