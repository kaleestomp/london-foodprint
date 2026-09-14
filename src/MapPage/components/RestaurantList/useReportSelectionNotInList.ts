import { useEffect, useRef } from 'react';

import { useDrawerState } from '../SlideUpDrawer/DrawerStateContext';
import { usePlaceSelection } from '../../../context/PlaceSelectionContext';
import { useRenderedList } from './RenderedListContext';
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
  const { reportUnmatchedPlaceId } = useRenderedList();
  const unmatchedPlaceIdRef = useRef<string | null>(null);

  useEffect(() => {
    const selectionInvalid = selectedPlaceId === null || selectionSource !== 'map';
    if (selectionInvalid) {
      reportUnmatchedPlaceId(null);
      unmatchedPlaceIdRef.current = null;

    } else if (isClosed) {
      // A map selection made while the drawer is closed 
      // must remain UNMATCHED.
      reportUnmatchedPlaceId(selectedPlaceId, true);
      unmatchedPlaceIdRef.current = selectedPlaceId;

    } else if (unmatchedPlaceIdRef.current === selectedPlaceId) {
      // Preserve a selection that was made while the drawer was closed.
      return;

    } else {
      const isInList = items.some((row) => row.id === selectedPlaceId);

      // Hold an existing unmatched verdict while the list is refreshing.
      const holdVerdict = !isInList && status === 'loading' && unmatchedPlaceIdRef.current !== null;
      if (holdVerdict) return;
      reportUnmatchedPlaceId(isInList ? null : selectedPlaceId);
      unmatchedPlaceIdRef.current = isInList ? null : selectedPlaceId;
    }
  // ITEMS purposely REMOVED from deps to avoid matching after list refresh.
  }, [isClosed, selectedPlaceId, selectionSource, status, unmatchedPlaceIdRef]);

};

export default useReportSelectionNotInList;
