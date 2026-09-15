import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { usePlaceSelection } from '../../../context/PlaceSelectionContext';
import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';

type RenderedListContextValue = {
  unmatchedPlaceId: string | null;
  showPlaceMainDrawer: boolean;
  reportUnmatchedPlaceId: (value: string | null, selectedWhileClosed?: boolean) => void;
};

const RenderedListContext = createContext<RenderedListContextValue | null>(null);

export const RenderedListProvider = ({ children }: { children: ReactNode }) => {
  const [unmatchedPlaceId, setUnmatchedPlaceId] = useState<string | null>(null);
  const [selectedWhileClosed, setSelectedWhileClosed] = useState(false);
  const { selectedPlaceId, selectionSource } = usePlaceSelection();
  const { isClosed } = useDrawerState();
  const showPlaceMainDrawer = unmatchedPlaceId !== null && selectedWhileClosed;

  const reportUnmatchedPlaceId = useCallback((value: string | null, selectedWhileClosed = false) => {
    setUnmatchedPlaceId(value);
    setSelectedWhileClosed((prev) => (
      value !== null && (selectedWhileClosed || prev)
    ));
  }, []);
  useEffect(() => {
    if (selectedPlaceId === null || selectionSource !== 'map') {
      reportUnmatchedPlaceId(null);
    } else if (isClosed) {
      reportUnmatchedPlaceId(selectedPlaceId, true);
    } else if (!isClosed && selectedWhileClosed === true) {
      // Also counts if last selection was made while the drawer was closed
      // This allows place detail panel to stay on if user switches between place markers
      reportUnmatchedPlaceId(selectedPlaceId, true);
    }
  }, [isClosed, selectedPlaceId, selectionSource, reportUnmatchedPlaceId]);

  const value = useMemo(() => ({
    unmatchedPlaceId,
    showPlaceMainDrawer,
    reportUnmatchedPlaceId,
  }), [reportUnmatchedPlaceId, selectedWhileClosed, unmatchedPlaceId]);

  return (
    <RenderedListContext.Provider value={value}>
      {children}
    </RenderedListContext.Provider>
  );
};

export const useRenderedList = (): RenderedListContextValue => {
  const context = useContext(RenderedListContext);
  if (!context) {
    throw new Error('useRenderedList must be used within RenderedListProvider');
  }
  return context;
};
