import { createContext, useContext, useEffect, useMemo, useState } from 'react'; 
import type { ReactNode } from 'react'; 
import { useLocation } from 'react-router-dom';

interface AppUIContextType { 
  isLoading: boolean; 
  isSidedrawOpen: boolean;
  isSideCardVisible: boolean;
  bookmarkedCardIds: number[];
  bookmarkCount: number; 
  toggleLoading: (loading: boolean) => void;
  toggleSideDraw: () => void;
  toggleSideCard: () => void;
  toggleBookmark: (cardId: number) => void;
}

const AppUIContext = createContext<AppUIContextType | null>(null);

export const AppUIProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSidedrawOpen, setIsSidedrawOpen] = useState(false);
  const [isSideCardVisible, setIsSideCardVisible] = useState(true);
  const [bookmarkedCardIds, setBookmarkedCardIds] = useState<number[]>([1, 3]);
  
  // ONLY SET ONCE WHEN PAGE1 IS FIRST LOADED, NOT ON EVERY RENDER
  // const location = useLocation();
  // useEffect(() => { if (location.pathname === '/') setIsSidedrawOpen(true); }, []);

  const exposed = useMemo<AppUIContextType>(() => ({ 
    isLoading, 
    isSidedrawOpen,
    isSideCardVisible: isSideCardVisible,
    bookmarkedCardIds,
    bookmarkCount: bookmarkedCardIds.length,
    toggleLoading: (loading: boolean) => setIsLoading(loading),
    toggleSideDraw: () => setIsSidedrawOpen((prev) => !prev),
    toggleSideCard: () => setIsSideCardVisible((prev) => !prev),
    toggleBookmark: (cardId: number) => setBookmarkedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    ),
  }), [isLoading, isSidedrawOpen, isSideCardVisible, bookmarkedCardIds]);

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
