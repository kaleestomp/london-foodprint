import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { usePlaceSelection } from './PlaceSelectionContext';
import { useDrawerState } from '../MapPage/components/SlideUpDrawer/DrawerStateContext';
type PlaceDetailCardContextValue = {
  untrackedPlaceId: string | null;
  showOnDrawer: boolean;
  showOnNestedDrawer: boolean;
  showOnList: boolean;
  reportUnmatchedPlaceId: (value: string | null, selectedWhileClosed?: boolean) => void;
};

// THIS CONTEXT TRACKS WHEN AND HOW 
// A PLACE DETAIL CARD SHOULD BE RENDERED 
// by tracking selection of place markers 
// that are not tracked on rendered list
const PlaceDetailCardContext = createContext<PlaceDetailCardContextValue | null>(null);
export const PlaceDetailCardProvider = ({ children }: { children: ReactNode }) => {
  const [ untrackedPlaceId, setUntrackedPlaceId ] = useState<string | null>(null);
  const [ selectedWhileClosed, setSelectedWhileClosed ] = useState(false);
  const { selectedPlaceId, selectionSource } = usePlaceSelection();
  const { isClosed } = useDrawerState();

  const placeSelected = Boolean(selectedPlaceId);
  const untrackedPlaceSelected = Boolean(untrackedPlaceId);
  const showOnDrawer = untrackedPlaceSelected && selectedWhileClosed;
  const showOnNestedDrawer = untrackedPlaceSelected && !showOnDrawer;
  const showOnList = !isClosed && placeSelected && !(showOnNestedDrawer || showOnDrawer);
  // console.log({ showOnDrawer, showOnNestedDrawer, showOnList });

  const reportUnmatchedPlaceId = useCallback((value: string | null, selectedWhileClosed = false) => {
    setUntrackedPlaceId(value);
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
    untrackedPlaceId, showOnDrawer, showOnNestedDrawer, showOnList, reportUnmatchedPlaceId,
  }), [untrackedPlaceId, showOnDrawer, showOnNestedDrawer, showOnList, reportUnmatchedPlaceId]);

  return (
    <PlaceDetailCardContext.Provider value={value}>
      {children}
    </PlaceDetailCardContext.Provider>
  );
};

export const usePlaceDetailCardState = (): PlaceDetailCardContextValue => {
  const context = useContext(PlaceDetailCardContext);
  if (!context) {
    throw new Error('usePlaceDetailCardState must be used within PlaceDetailCardProvider');
  }
  return context;
};
