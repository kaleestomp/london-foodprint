import { createContext, useCallback, useContext, useMemo, useState } from 'react'; 
import type { ReactNode } from 'react'; 

export type ToolbarFilterTab = 'rating' | 'price' | 'cuisine' | 'search';
export type ColorMode = 'light' | 'dark';

export type LiveLocation = {
  lat: number;
  lng: number;
  token: number;
};

interface AppUIContextType { 
  isLoading: boolean;
  activeToolbarTab: ToolbarFilterTab | null;
  liveLocation: LiveLocation | null;
  colorMode: ColorMode;
  heatmapEnabled: boolean;
  mapMode: ColorMode;
  toggleLoading: (loading: boolean) => void;
  setActiveToolbarTab: (tab: ToolbarFilterTab | null) => void;
  queueLiveLocationDrop: (lat: number, lng: number) => void;
  toggleColorMode: () => void;
  toggleHeatmapEnabled: () => void;
  toggleMapMode: () => void;
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
  const [activeToolbarTab, setActiveToolbarTab] = useState<ToolbarFilterTab | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('light'); //getInitialColorMode
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [mapMode, setMapMode] = useState<ColorMode>('dark');

  const toggleLoading = useCallback((loading: boolean) => {
    setIsLoading((prev) => (prev === loading ? prev : loading));
  }, []);

  const queueLiveLocationDrop = useCallback((lat: number, lng: number) => {
    setLiveLocation({ lat, lng, token: Date.now() });
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleHeatmapEnabled = useCallback(() => {
    setHeatmapEnabled((prev) => !prev);
  }, []);

  const toggleMapMode = useCallback(() => {
    setMapMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const exposed = useMemo<AppUIContextType>(() => ({ 
    isLoading, toggleLoading,
    activeToolbarTab, setActiveToolbarTab,
    liveLocation, queueLiveLocationDrop,
    colorMode, toggleColorMode,
    heatmapEnabled, toggleHeatmapEnabled,
    mapMode, toggleMapMode
  }), [
    isLoading, toggleLoading,
    activeToolbarTab, setActiveToolbarTab,
    liveLocation, queueLiveLocationDrop,
    colorMode, toggleColorMode,
    heatmapEnabled, toggleHeatmapEnabled,
    mapMode, toggleMapMode
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
