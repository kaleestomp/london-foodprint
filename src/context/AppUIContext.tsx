import { createContext, useContext, useMemo, useState } from 'react'; 
import type { ReactNode } from 'react'; 

interface AppUIContextType { 
  isLoading: boolean;
  isSideCardVisible: boolean;
  restaurantPanelCommandToken: number;
  restaurantPanelTargetTab: 'results' | 'filters';
  restaurantPanelTargetSnapIndex: number;
  toggleLoading: (loading: boolean) => void;
  toggleSideCard: () => void;
  openRestaurantFiltersPanel: () => void;
}

const AppUIContext = createContext<AppUIContextType | null>(null);

export const AppUIProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSideCardVisible, setIsSideCardVisible] = useState(true);
  const [restaurantPanelCommandToken, setRestaurantPanelCommandToken] = useState(0);
  const [restaurantPanelTargetTab, setRestaurantPanelTargetTab] = useState<'results' | 'filters'>('results');
  const [restaurantPanelTargetSnapIndex, setRestaurantPanelTargetSnapIndex] = useState(0);

  const exposed = useMemo<AppUIContextType>(() => ({ 
    isLoading,
    isSideCardVisible,
    restaurantPanelCommandToken,
    restaurantPanelTargetTab,
    restaurantPanelTargetSnapIndex,
    toggleLoading: (loading: boolean) => setIsLoading(loading),
    toggleSideCard: () => setIsSideCardVisible((prev) => !prev),
    openRestaurantFiltersPanel: () => {
      setRestaurantPanelTargetSnapIndex(2);
      setRestaurantPanelTargetTab('filters');
      setRestaurantPanelCommandToken((prev) => prev + 1);
    },
  }), [
    isLoading,
    isSideCardVisible,
    restaurantPanelCommandToken,
    restaurantPanelTargetSnapIndex,
    restaurantPanelTargetTab,
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
