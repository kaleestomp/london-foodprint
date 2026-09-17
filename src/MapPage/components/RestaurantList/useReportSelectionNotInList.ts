import { useEffect, useRef } from 'react';

import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';
import { usePlaceSelection } from '../../../context/PlaceSelectionContext';
import { usePlaceDetailCardState } from '../../../context/PlaceDetailCardContext';
import { type PlacesListItem } from '../../request/useRequestPlacesList/request';

type ListStatus = 'empty' | 'loading' | 'success' | 'error';

// Reports the currently selected place id up to the parent (Content) whenever a
// cluster singleton marker is selected but has no matching row in the loaded list.
const useReportSelectionNotInList = (
  items: PlacesListItem[],
  status: ListStatus,
): void => {

  const { isClosed } = useDrawerState();
  const { selectedPlaceId, selectionSource } = usePlaceSelection();
  const { reportUnmatchedPlaceId } = usePlaceDetailCardState();
  const unmatchedPlaceIdRef = useRef<string | null>(null);

  useEffect(() => {

    // IGNORE ALL CLOSED-DRAWER SELECTIONS
    // CLOSE DRAWER SELECTIONS ARE HANDLED BY RenderedListProvider
    if (isClosed) {
      // Closed-drawer selections are handled by RenderedListProvider.
      unmatchedPlaceIdRef.current = selectedPlaceId;
      return;
    }

    const selectionInvalid = selectedPlaceId === null || selectionSource !== 'map';
    if (selectionInvalid) {
      reportUnmatchedPlaceId(null);
      unmatchedPlaceIdRef.current = null;

    } else if (unmatchedPlaceIdRef.current === selectedPlaceId) {
      // Preserve a selection that was classified before the drawer opened.
      return;

    } else {
      // Do not classify against stale list data while a refresh is in flight.
      if (status === 'loading') return;

      const isInList = items.some((row) => row.id === selectedPlaceId);

      // Hold an existing unmatched verdict while the list is refreshing.
      reportUnmatchedPlaceId(isInList ? null : selectedPlaceId);
      unmatchedPlaceIdRef.current = isInList ? null : selectedPlaceId;
    }
  // ITEMS purposely REMOVED from deps to avoid matching after list refresh.
  }, [isClosed, selectedPlaceId, selectionSource, status, unmatchedPlaceIdRef]);

};

export default useReportSelectionNotInList;
