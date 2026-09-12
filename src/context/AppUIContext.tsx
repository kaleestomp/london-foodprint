import { createContext, useCallback, useContext, useMemo, useState } from 'react'; 
import type { ReactNode } from 'react'; 

export type ToolbarFilterTab = 'rating' | 'price' | 'cuisine' | 'search';
export type InitialLoadItem = 'baseTiles' | 'clusterLayer' | 'heatmapLayer';
export type LiveLocation = {
  lat: number;
  lng: number;
  token: number;
};

interface AppUIContextType { 
  isLoading: boolean; toggleLoading: (loading: boolean) => void;
  activeToolbarTab: ToolbarFilterTab | null; setActiveToolbarTab: (tab: ToolbarFilterTab | null) => void;
  liveLocation: LiveLocation | null; queueLiveLocationDrop: (lat: number, lng: number) => void;
  darkMode: boolean; toggleDarkMode: () => void;
  heatmapEnabled: boolean; toggleHeatmapEnabled: () => void;
  // initialLoadComplete: boolean; markInitialLoadItemComplete: (item: InitialLoadItem) => void;
}

const AppUIContext = createContext<AppUIContextType | null>(null);

export const AppUIProvider = ({ children }: { children: ReactNode }) => {
  // const getInitialColorMode = (): ColorMode => {
  //   if (typeof window === 'undefined') return 'light';

  //   const storedMode = window.localStorage.getItem('app-color-mode');
  //   if (storedMode === 'light' || storedMode === 'dark') return storedMode;

  //   return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  // };

  const [isLoading, setIsLoading] = useState(false);
  // const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [activeToolbarTab, setActiveToolbarTab] = useState<ToolbarFilterTab | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  // const [, setInitialLoadItems] = useState<Record<InitialLoadItem, boolean>>({
  //   baseTiles: false,
  //   clusterLayer: false,
  //   heatmapLayer: false,
  // });

  const toggleLoading = useCallback((loading: boolean) => {
    setIsLoading((prev) => (prev === loading ? prev : loading));
  }, []);

  // const markInitialLoadItemComplete = useCallback((item: InitialLoadItem) => {
  //   setInitialLoadItems((prev) => {
  //     if (prev[item]) return prev;

  //     const next = { ...prev, [item]: true };
  //     if (!initialLoadComplete && Object.values(next).every(Boolean)) {
  //       setInitialLoadComplete(true);
  //     }

  //     return next;
  //   });
  // }, [initialLoadComplete]);

  const queueLiveLocationDrop = useCallback((lat: number, lng: number) => {
    setLiveLocation({ lat, lng, token: Date.now() });
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const toggleHeatmapEnabled = useCallback(() => {
    setHeatmapEnabled((prev) => !prev);
  }, []);


  const exposed = useMemo<AppUIContextType>(() => ({ 
    isLoading, toggleLoading,
    // initialLoadComplete, markInitialLoadItemComplete,
    activeToolbarTab, setActiveToolbarTab,
    liveLocation, queueLiveLocationDrop,
    darkMode, toggleDarkMode,
    heatmapEnabled, toggleHeatmapEnabled,
  }), [
    isLoading, toggleLoading,
    // initialLoadComplete, markInitialLoadItemComplete,
    activeToolbarTab, setActiveToolbarTab,
    liveLocation, queueLiveLocationDrop,
    darkMode, toggleDarkMode,
    heatmapEnabled, toggleHeatmapEnabled,
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
