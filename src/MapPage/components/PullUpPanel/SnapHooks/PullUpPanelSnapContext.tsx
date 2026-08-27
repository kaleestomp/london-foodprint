import React, { createContext, useContext, useMemo } from 'react';

import usePullUpPanelSnap from './usePullUpPanelSnap';

type PullUpPanelSnapshot = ReturnType<typeof usePullUpPanelSnap>;
type PullUpPanelSnapState = Omit<PullUpPanelSnapshot, 'panelHeight' | 'translateY'>;
type PullUpPanelMetrics = Pick<PullUpPanelSnapshot, 'panelHeight' | 'translateY'>;

const PullUpPanelSnapContext = createContext<PullUpPanelSnapState | null>(null);
const PullUpPanelMetricsContext = createContext<PullUpPanelMetrics | null>(null);

export const PullUpPanelSnapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const snap = usePullUpPanelSnap();
  const snapState = useMemo<PullUpPanelSnapState>(() => ({
    snapState: snap.snapState,
    handlePanelPointerDown: snap.handlePanelPointerDown,
    handleHandlePointerDown: snap.handleHandlePointerDown,
    handleContentPointerDown: snap.handleContentPointerDown,
    handleContentPointerMove: snap.handleContentPointerMove,
    handleContentPointerUp: snap.handleContentPointerUp,
    handleContentPointerCancel: snap.handleContentPointerCancel,
    isDragging: snap.isDragging,
    isMobile: snap.isMobile,
    isPanelOpen: snap.isPanelOpen,
    openPanel: snap.openPanel,
  }), [
    snap.handleContentPointerCancel,
    snap.handleContentPointerDown,
    snap.handleContentPointerMove,
    snap.handleContentPointerUp,
    snap.handleHandlePointerDown,
    snap.handlePanelPointerDown,
    snap.isDragging,
    snap.isMobile,
    snap.isPanelOpen,
    snap.openPanel,
    snap.snapState,
  ]);
  const metrics = useMemo<PullUpPanelMetrics>(() => ({
    panelHeight: snap.panelHeight,
    translateY: snap.translateY,
  }), [snap.panelHeight, snap.translateY]);

  return (
    <PullUpPanelMetricsContext.Provider value={metrics}>
      <PullUpPanelSnapContext.Provider value={snapState}>
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
