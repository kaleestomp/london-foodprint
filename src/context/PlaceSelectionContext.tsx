import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type PlaceSelectionContextType = {
  selectedPlaceId: string | null;
  setSelectedPlaceId: (placeId: string | null) => void;
};

const PlaceSelectionContext = createContext<PlaceSelectionContextType | null>(null);

export const PlaceSelectionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const value = useMemo<PlaceSelectionContextType>(() => ({
    selectedPlaceId,
    setSelectedPlaceId,
  }), [selectedPlaceId]);

  return <PlaceSelectionContext.Provider value={value}>{children}</PlaceSelectionContext.Provider>;
};

export const usePlaceSelection = (): PlaceSelectionContextType => {
  const ctx = useContext(PlaceSelectionContext);
  if (!ctx) {
    throw new Error('usePlaceSelection must be used within PlaceSelectionProvider');
  }
  return ctx;
};