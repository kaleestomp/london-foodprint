import React, { createContext, useContext, useMemo } from 'react';

import usePullUpPanelSnap from './usePullUpPanelSnap';

const PullUpPanelSnapContext = createContext<ReturnType<typeof usePullUpPanelSnap> | null>(null);
type PullUpPanelMetrics = Pick<ReturnType<typeof usePullUpPanelSnap>, 'panelHeight' | 'translateY'>;
const PullUpPanelMetricsContext = createContext<PullUpPanelMetrics | null>(null);

export const PullUpPanelSnapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const snap = usePullUpPanelSnap();
  const metrics = useMemo<PullUpPanelMetrics>(() => ({
    panelHeight: snap.panelHeight,
    translateY: snap.translateY,
  }), [snap.panelHeight, snap.translateY]);

  return (
    <PullUpPanelMetricsContext.Provider value={metrics}>
      <PullUpPanelSnapContext.Provider value={snap}>
        {children}
      </PullUpPanelSnapContext.Provider>
    </PullUpPanelMetricsContext.Provider>
  );
};

export const usePullUpPanelSnapState = () => {
  const context = useContext(PullUpPanelSnapContext);
  if (!context) {
    throw new Error('usePullUpPanelSnapState must be used within PullUpPanelSnapProvider');
  }

  return context;
};

export const usePullUpPanelMetrics = () => {
  const context = useContext(PullUpPanelMetricsContext);
  if (!context) {
    throw new Error('usePullUpPanelMetrics must be used within PullUpPanelSnapProvider');
  }

  return context;
};
