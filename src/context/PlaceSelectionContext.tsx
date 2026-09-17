import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type SelectedLayer = 'topPlaces' | 'cluster' | 'temporary';
export type selectionSource = 'map' | 'list';
type PlaceSelectionContextType = {
  selectedPlaceId: string | null;
  targetPaintLayer: SelectedLayer | null;
  selectionSource: selectionSource | null;
  reportSelectedPlaceId: (placeId: string | null, layer: SelectedLayer | null, source?: selectionSource) => void;
  clearSelection: () => void;
};

const PlaceSelectionContext = createContext<PlaceSelectionContextType | null>(null);

export const PlaceSelectionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [targetPaintLayer, setTargetPaintLayer] = useState<SelectedLayer | null>(null);
  const [selectionSource, setSelectionSource] = useState<selectionSource | null>(null);
  
  const reportSelectedPlaceId = useCallback((
    placeId: string | null,
    layer: SelectedLayer | null,
    source: selectionSource = 'map'
  ) => {
    setSelectedPlaceId(placeId);
    setTargetPaintLayer(layer);
    setSelectionSource(source);
  }, []);
  const clearSelection = useCallback(() => {
    setSelectedPlaceId(null);
    setTargetPaintLayer(null);
    setSelectionSource(null);
  }, []);

  const value = useMemo<PlaceSelectionContextType>(() => ({
    selectedPlaceId, targetPaintLayer, selectionSource, reportSelectedPlaceId, clearSelection
  }), [selectedPlaceId, targetPaintLayer, selectionSource, reportSelectedPlaceId, clearSelection]);

  return <PlaceSelectionContext.Provider value={value}>{children}</PlaceSelectionContext.Provider>;
};

export const usePlaceSelection = (): PlaceSelectionContextType => {
  const ctx = useContext(PlaceSelectionContext);
  if (!ctx) {
    throw new Error('usePlaceSelection must be used within PlaceSelectionProvider');
  }
  return ctx;
};