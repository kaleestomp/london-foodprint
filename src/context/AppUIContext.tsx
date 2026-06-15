import { createContext, useCallback, useContext, useMemo, useState } from 'react'; 
import type { ReactNode } from 'react'; 

export type ToolbarFilterTab = 'rating' | 'price' | 'cuisine';

export type LiveLocation = {
  lat: number;
  lng: number;
  token: number;
};

interface AppUIContextType { 
  isLoading: boolean;
  isSideCardVisible: boolean;
  activeToolbarTab: ToolbarFilterTab | null;
  liveLocation: LiveLocation | null;
  toggleLoading: (loading: boolean) => void;
  setActiveToolbarTab: (tab: ToolbarFilterTab | null) => void;
  toggleToolbarFilterTab: (tab: ToolbarFilterTab) => void;
  queueLiveLocationDrop: (lat: number, lng: number) => void;
}

const AppUIContext = createContext<AppUIContextType | null>(null);

export const AppUIProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSideCardVisible] = useState(true);
  const [activeToolbarTab, setActiveToolbarTab] = useState<ToolbarFilterTab | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);

  const toggleLoading = useCallback((loading: boolean) => {
    setIsLoading((prev) => (prev === loading ? prev : loading));
  }, []);

  const toggleToolbarFilterTab = useCallback((tab: ToolbarFilterTab) => {
    setActiveToolbarTab((prev) => (prev === tab ? null : tab));
  }, []);

  const queueLiveLocationDrop = useCallback((lat: number, lng: number) => {
    setLiveLocation({ lat, lng, token: Date.now() });
  }, []);

  const exposed = useMemo<AppUIContextType>(() => ({ 
    isLoading,
    isSideCardVisible,
    activeToolbarTab,
    liveLocation,
    toggleLoading,
    setActiveToolbarTab,
    toggleToolbarFilterTab,
    queueLiveLocationDrop,
  }), [
    activeToolbarTab,
    isLoading,
    isSideCardVisible,
    liveLocation,
    queueLiveLocationDrop,
    toggleLoading,
    toggleToolbarFilterTab,
  ]);

  return (
    <AppUIContext.Provider value={exposed}>
      {children}
    </AppUIContext.Provider>
  );
};

export const useAppUI = (): AppUIContextType => {
  const context = useContext(AppUIContext);
  if (!context) throw new Error('useAppUI must be used within AppUIProvider');

  return context;
};
