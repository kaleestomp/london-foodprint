import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type RenderedListContextValue = {
  unmatchedPlaceId: string | null;
  showPlaceMainDrawer: boolean;
  reportUnmatchedPlaceId: (value: string | null, selectedWhileClosed?: boolean) => void;
};

const RenderedListContext = createContext<RenderedListContextValue | null>(null);

export const RenderedListProvider = ({ children }: { children: ReactNode }) => {
  const [unmatchedPlaceId, setUnmatchedPlaceId] = useState<string | null>(null);
  const [selectedWhileClosed, setSelectedWhileClosed] = useState(false);
  const showPlaceMainDrawer = unmatchedPlaceId !== null && selectedWhileClosed;

  const reportUnmatchedPlaceId = (value: string | null, selectedWhileClosed = false) => {
    setUnmatchedPlaceId(value);
    setSelectedWhileClosed(value !== null && selectedWhileClosed);
  };
  
  // const { selectedPlaceId, selectionSource } = usePlaceSelection();
  // useEffect(() => {
  //   // CLEAR UNMATCHED
  //   const selectionDroped = selectedPlaceId === null;
  //   if (selectionDroped) {
  //     setUnmatchedPlaceId(null);
  //     setSelectedWhileClosed(false);
  //     return;
  //   }
  // }, [selectedPlaceId, selectionSource]);

  // const { isClosed } = useDrawerState();
  // const { selectedPlaceId, selectionSource } = usePlaceSelection();
  // useEffect(() => {
  //   // CLEAR UNMATCHED
  //   const selectionDroped = selectedPlaceId === null;
  //   const unmatchedStale = unmatchedPlaceId !== selectedPlaceId;
  //   if (selectionDroped || unmatchedStale) {
  //     setUnmatchedPlaceId(null);
  //     setSelectedWhileClosed(false);
  //     return;
  //   }

  //   // UPDATE UNMATCHED
  //   const selectionInvalid = selectionSource !== 'map';
  //   if (!selectionInvalid && isClosed) {
  //     // A map selection made while the drawer is closed 
  //     // must remain UNMATCHED.
  //     reportUnmatchedPlaceId(selectedPlaceId, true);
  //   }
  // }, [selectedPlaceId, selectionSource, isClosed]);



  const value = useMemo(() => ({
    unmatchedPlaceId,
    showPlaceMainDrawer,
    reportUnmatchedPlaceId,
  }), [unmatchedPlaceId, selectedWhileClosed]);

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
