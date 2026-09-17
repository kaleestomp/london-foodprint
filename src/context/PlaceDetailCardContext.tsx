import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { usePlaceSelection } from './PlaceSelectionContext';
import { useDrawerState } from '../MapPage/components/SlideUpDrawer/DrawerStateContext';
type PlaceDetailCardContextValue = {
  placeId: string | null;
  showOnMainDrawer: boolean;
  showOnNestedDrawer: boolean;
};

// THIS CONTEXT TRACKS WHEN AND HOW 
// A PLACE DETAIL CARD SHOULD BE RENDERED 
// by tracking selection of place markers 
// that are not tracked on rendered list
const PlaceDetailCardContext = createContext<PlaceDetailCardContextValue | null>(null);
export const PlaceDetailCardProvider = ({ children }: { children: ReactNode }) => {

  const [ placeId, setPlaceId ] = useState<string | null>(null);
  const [ showOnMainDrawer, setShowOnMainDrawer ] = useState(false);
  const showOnNestedDrawer = Boolean(placeId) && !showOnMainDrawer;
  const reportPlaceIdforDetail = useCallback((value: string | null, showOnMainDrawer = false) => {
    setPlaceId(value);
    setShowOnMainDrawer((prev) => (value !== null && (showOnMainDrawer || prev)));
  }, []);

  const { isClosed } = useDrawerState();
  const { selectedPlaceId, selectionSource } = usePlaceSelection();
  useEffect(() => {

    // INVALID SELECTION
    // DISREGARD LIST SELECTIONS
    if (selectedPlaceId === null || selectionSource !== 'map') { // INVALID SELECTION
      reportPlaceIdforDetail(null);
    
    // SELECTION TO BE RENDERED ON BASE DRAWER
    // selectiosn made while drawer is closed or 
    // while showOnDrawer is already true
    // This allows place detail panel to stay on same drawer
    } else {
      const shouldShowOnMainDrawer = (isClosed || showOnMainDrawer);
      reportPlaceIdforDetail(selectedPlaceId, shouldShowOnMainDrawer);
    }
  }, [selectedPlaceId, selectionSource, isClosed, 
    showOnMainDrawer, reportPlaceIdforDetail]);


  const value = useMemo(() => ({
    placeId, showOnMainDrawer, showOnNestedDrawer
  }), [placeId, showOnMainDrawer, showOnNestedDrawer

  ]);

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
