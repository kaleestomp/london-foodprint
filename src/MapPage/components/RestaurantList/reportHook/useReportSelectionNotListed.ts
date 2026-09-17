import { useEffect, useRef } from 'react';

import { useDrawerState } from '../../SlideUpDrawer/DrawerStateContext';
import { usePlaceSelection } from '../../../../context/PlaceSelectionContext';
import { type PlacesListItem } from '../../../request/useRequestPlacesList/request';

type ListStatus = 'empty' | 'loading' | 'success' | 'error';

// UN-LISTED SELECTED PLACE ID
// Reports the currently selected place id up to the parent (Content) whenever a
// map marker is selected but has no matching row in the loaded list.
const useReportUnlistedSelection = (
  items: PlacesListItem[],
  status: ListStatus,
  report: (placeId: string | null) => void,
): void => {

  const { isClosed } = useDrawerState();
  const { selectedPlaceId, selectionSource } = usePlaceSelection();
  // const { reportNotListedPlaceId } = usePlaceDetailCardState();
  const notListedPlaceIdRef = useRef<string | null>(null);

  useEffect(() => {

    // IGNORE ALL CLOSED-DRAWER SELECTIONS
    // CLOSE DRAWER SELECTIONS ARE HANDLED BY PlaceDetailCardProvider
    if (isClosed) {
      notListedPlaceIdRef.current = selectedPlaceId;
      return;
    }

    const selectionInvalid = selectedPlaceId === null || selectionSource !== 'map';
    if (selectionInvalid) {
      report(null);
      notListedPlaceIdRef.current = null;

    } else if (notListedPlaceIdRef.current === selectedPlaceId) {
      // Preserve a selection that was classified before the drawer opened.
      return;

    } else {
      // Do not classify against stale list data while a refresh is in flight.
      if (status === 'loading') return;

      const isInList = items.some((row) => row.id === selectedPlaceId);

      // Hold an existing unmatched verdict while the list is refreshing.
      report(isInList ? null : selectedPlaceId);
      notListedPlaceIdRef.current = isInList ? null : selectedPlaceId;
    }
  // ITEMS purposely REMOVED from deps to avoid matching after list refresh.
  }, [isClosed, selectedPlaceId, selectionSource, status, notListedPlaceIdRef]);

};

export default useReportUnlistedSelection;
