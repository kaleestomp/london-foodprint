import { createContext, useContext, useMemo, useState } from 'react'; 
import type { ReactNode } from 'react'; 

interface AppUIContextType { 
  isLoading: boolean;
  isSideCardVisible: boolean;
  toggleLoading: (loading: boolean) => void;
  toggleSideCard: () => void;
}

const AppUIContext = createContext<AppUIContextType | null>(null);

export const AppUIProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSideCardVisible, setIsSideCardVisible] = useState(true);

  const exposed = useMemo<AppUIContextType>(() => ({ 
    isLoading,
    isSideCardVisible,
    toggleLoading: (loading: boolean) => setIsLoading(loading),
    toggleSideCard: () => setIsSideCardVisible((prev) => !prev),
  }), [isLoading, isSideCardVisible]);

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
