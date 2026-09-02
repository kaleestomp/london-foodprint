import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type SelectedLayer = 'topPlaces' | 'cluster' | 'list';

type PlaceSelectionContextType = {
  selectedPlaceId: string | null;
  selectedLayer: SelectedLayer | null;
  reportSelectedPlaceId: (placeId: string | null, layer: SelectedLayer | null) => void;
};

const PlaceSelectionContext = createContext<PlaceSelectionContextType | null>(null);

export const PlaceSelectionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<SelectedLayer | null>(null);
  const reportSelectedPlaceId = (placeId: string | null, layer: SelectedLayer | null) => {
    setSelectedPlaceId(placeId);
    setSelectedLayer(layer);
  };

  const value = useMemo<PlaceSelectionContextType>(() => ({
    selectedPlaceId, selectedLayer, reportSelectedPlaceId
  }), [selectedPlaceId, selectedLayer, reportSelectedPlaceId]);

  return <PlaceSelectionContext.Provider value={value}>{children}</PlaceSelectionContext.Provider>;
};

export const usePlaceSelection = (): PlaceSelectionContextType => {
  const ctx = useContext(PlaceSelectionContext);
  if (!ctx) {
    throw new Error('usePlaceSelection must be used within PlaceSelectionProvider');
  }
  return ctx;
};