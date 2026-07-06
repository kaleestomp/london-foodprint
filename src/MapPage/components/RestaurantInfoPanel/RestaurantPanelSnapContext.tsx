import React, { createContext, useContext, useMemo } from 'react';

import useRestaurantPanelSnap from './useRestaurantPanelSnap';

const RestaurantPanelSnapContext = createContext<ReturnType<typeof useRestaurantPanelSnap> | null>(null);
type RestaurantPanelMetrics = Pick<ReturnType<typeof useRestaurantPanelSnap>, 'isMobile' | 'panelHeight' | 'translateY'>;
const RestaurantPanelMetricsContext = createContext<RestaurantPanelMetrics | null>(null);

export const RestaurantPanelSnapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const snap = useRestaurantPanelSnap();
  const metrics = useMemo<RestaurantPanelMetrics>(() => ({
    isMobile: snap.isMobile,
    panelHeight: snap.panelHeight,
    translateY: snap.translateY,
  }), [snap.isMobile, snap.panelHeight, snap.translateY]);

  return (
    <RestaurantPanelMetricsContext.Provider value={metrics}>
      <RestaurantPanelSnapContext.Provider value={snap}>
        {children}
      </RestaurantPanelSnapContext.Provider>
    </RestaurantPanelMetricsContext.Provider>
  );
};

export const useRestaurantPanelSnapState = () => {
  const context = useContext(RestaurantPanelSnapContext);
  if (!context) {
    throw new Error('useRestaurantPanelSnapState must be used within RestaurantPanelSnapProvider');
  }

  return context;
};

export const useRestaurantPanelMetrics = () => {
  const context = useContext(RestaurantPanelMetricsContext);
  if (!context) {
    throw new Error('useRestaurantPanelMetrics must be used within RestaurantPanelSnapProvider');
  }

  return context;
};
